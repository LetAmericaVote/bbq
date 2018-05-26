const https = require('https');
const { join } = require('path');
const { spawn } = require('child_process');
const fs = require('fs');
const Git = require('nodegit');
const Logger = require('./logger');

// ############################################
// ############################################
//                   Utility
// ############################################
// ############################################

const bootstrapLogger = Logger('boostrap', '#80ff00');

function catchErrors(fn) {
  return function(...args) {
    return fn(...args).catch((err) => {
      bootstrapLogger.error(err);

      process.exit(0);
    });
  }
}

/**
 * Get the pathname of the folder a flavor should
 * be found in based on its name.
 *
 * @param  {String} name Flavor name
 * @return {String}      Path
 */
function flavorFilePath(name) {
  return join(__dirname, './flavors/', name);
}

/**
 * Filter out all of the flavors from the config
 * that are not missing required properties.
 *
 * @param  {Object} config bbq config
 * @return {Array<Object>} Array of flavors
 */
function validFlavorsFromConfig(config) {
  return config.flavors.filter(flavor => flavor.name && flavor.repo);
}

/**
 * Convert the data output from a stdout buffer
 * to a utf-8 string.
 *
 * @param  {Buffer} data Buffer data
 * @return {String}      Utf-8 string
 */
function convertBufferData(data) {
  return Buffer.from(data).toString('utf8').trim();
}

// ############################################
// ############################################
//                  Pipeline
// ############################################
// ############################################

/**
 * Fetch a config file from a remote source and
 * parse the contents to json.
 *
 * @param  {String} url Url leading to the config
 * @return {Promise.<Object>>} The parsed data from the config or an error.
 */
async function _fetchConfig(url) {
  function download(resolve, reject) {
    https.get(url, (response) => {
      let data = '';

      response.on('data', (chunk) => {
        data += chunk;
      });

      response.on('end', () => {
        try {
          const config = JSON.parse(data);

          resolve(config);
        } catch (error) {
          reject(error);
        }
      });

    }).on('error', (error) => {
      reject(error);
    });
  }

  return new Promise(download);
}

const fetchConfig = catchErrors(_fetchConfig);

/**
 * Read the config file from disk and parse the contents
 * to json.
 *
 * @param  {String} path Path on local disk to read from
 * @return {Promise.<Object>>} The parsed data from the config or an error.
 */
async function _readConfigFile(path) {
  function read(resolve, reject) {
    try {
      const contents = fs.readFileSync(join(__dirname, '../', path));
      const config = JSON.parse(contents);

      resolve(config);
    } catch (error) {
      reject(error);
    }
  }

  return new Promise(read);
}

const readConfigFile = catchErrors(_readConfigFile);

/**
 * Load the config based on the environment settings.
 *
 * @return {Promise.<Object>}
 */
async function _loadConfig() {
  const { BBQ_CONFIG } = process.env;

  if (! BBQ_CONFIG || ! BBQ_CONFIG.length) {
    throw new Error('Missing BBQ_CONFIG environment variable.');
  }

  const isRemote = BBQ_CONFIG.startsWith('https://');
  const loader = isRemote ? fetchConfig : readConfigFile;
  const config = await loader(BBQ_CONFIG);

  if (! config || ! config.version || ! config.flavors) {
    throw new Error('Invalid configuration');
  }

  bootstrapLogger.log(`Configuration loaded from ${isRemote ? 'remote' : 'local'} source.`);

  return config;
}

const loadConfig = catchErrors(_loadConfig);

/**
 * Clone a flavor from it's Github repo.
 *
 * @param       {String} name Flavor name
 * @param       {String} repo Url of the repository
 * @return      {Promise}
 */
async function _cloneFlavorFromGitRepo(name, repo) {
  const path = flavorFilePath(name);

  bootstrapLogger.debug(`Cloning flavor ${name} into path ${path} from repo ${repo}.`);

  return Git.Clone(repo, path);
}

const cloneFlavorFromGitRepo = catchErrors(_cloneFlavorFromGitRepo);

/**
 * Clone all flavors that are specified in the config
 * that have valid properties.
 *
 * @param  {Object} config bbq config
 * @return {Promise}
 */
async function _cloneFlavors(config) {
  const cloneOperations = validFlavorsFromConfig(config)
    .map(flavor => cloneFlavorFromGitRepo(flavor.name, flavor.repo));

  bootstrapLogger.log(`Cloning ${cloneOperations.length} flavor(s) from Git.`);

  return Promise.all(cloneOperations);
}

const cloneFlavors = catchErrors(_cloneFlavors);

/**
 * Install the modules for the given flavor.
 *
 * @param       {String} name Flavor name
 * @return      {Promise}     Resolves when install finished
 */
async function _installFlavor(name) {
  const path = flavorFilePath(name);

  bootstrapLogger.debug(`Installing modules for flavor ${name} at path ${path}.`);

  function install(resolve, reject) {
    const installPipeline = spawn('npm install', {
      shell: true,
      cwd: path,
    });

    installPipeline.stdout.on('data', (data) => {
      const message = convertBufferData(data);

      bootstrapLogger.debug(`Install logs for flavor ${name}.`);
      bootstrapLogger.debug(message);
    });

    installPipeline.stderr.on('data', (data) => {
      const error = convertBufferData(data);

      bootstrapLogger.error(`Encountered error while installing modules for flavor ${name}.`);
      bootstrapLogger.error(error);
    });

    installPipeline.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(`Flavor ${name} install exited with code ${code}.`);
      }
    });
  }

  return new Promise(install);
}

const installFlavor = catchErrors(_installFlavor);

/**
 * Install are flavors that are specified in the config.
 *
 * @param       {Object} config bbq config
 * @return      {Promise}
 */
async function _installFlavors(config) {
  const installOperations = validFlavorsFromConfig(config)
    .map(flavor => installFlavor(flavor.name));

  bootstrapLogger.log(`Installing modules for ${installOperations.length} flavor(s).`);

  return Promise.all(installOperations);
}

const installFlavors = catchErrors(_installFlavors);

/**
 * Read the configuration of the specific flavor.
 *
 * @param       {String} name Flavor name
 * @return      {Promise.<Object>} Flavor bbq config
 */
async function _readFlavorConfig(name) {
  const path = join(flavorFilePath(name), '/bbq.json');

  bootstrapLogger.debug(`Reading config for flavor ${name} at path ${path}.`);

  function read(resolve, reject) {
    try {
      const config = require(path);
      resolve(config);
    } catch (error) {
      reject(error);
    }
  }

  return new Promise(read);
}

const readFlavorConfig = catchErrors(_readFlavorConfig);

/**
 * Read all of the configurations within flavors that have
 * been specified by the bbq config.
 *
 * @param       {Object} config bbq config
 * @return      {Promise.<Array<Object>>} Array of flavor bbq configs
 */
async function _readFlavorConfigs(config) {
  const readOperations = validFlavorsFromConfig(config)
    .map(flavor => readFlavorConfig(flavor.name));

  bootstrapLogger.log(`Reading flavor configurations for ${readOperations.length} flavor(s).`);

  return Promise.all(readOperations);
}

const readFlavorConfigs = catchErrors(_readFlavorConfigs);

/**
 * Read the package.json file of a flavor.
 *
 * @param       {String} name Flavor name
 * @return      {Promise.<Object>}      Package.json parsed
 */
async function _readFlavorNpmPackageFile(name) {
  const path = join(flavorFilePath(name), '/package.json');

  bootstrapLogger.debug(`Reading package.json for flavor ${name} at path ${path}.`);

  function read(resolve, reject) {
    try {
      const package = require(path);
      resolve(package);
    } catch (error) {
      reject(error);
    }
  }

  return new Promise(read);
}

const readFlavorNpmPackageFile = catchErrors(_readFlavorNpmPackageFile);

/**
 * Build a bbq menu from all of the configurations discovered.
 *
 * @param       {Object} config  bbq config
 * @param       {Array<Object>} flavors Array of flavor configurations
 * @return      {Promise.<Object>} bbq menu
 */
async function _buildMenu(config, flavors) {
  const { version } = config;
  const menu = {
    meta: { version },
    flavors: {},
    paths: {},
  };

  bootstrapLogger.log(`Creating bbq menu for ${flavors.length} flavors.`);

  function buildMenu(resolve, reject) {
    async function _buildMenuFlavor(flavor) {
      if (! flavor.name) {
        bootstrapLogger.error(`Missing flavor name, skipping. Configuration: ${JSON.stringify(flavor)}`);
        return;
      }

      if (menu.flavors[flavor.name]) {
        reject(`Duplicate flavor(s) named ${flavor.name}. Aborting bootstrap.`);
        return;
      }

      const package = await readFlavorNpmPackageFile(flavor.name);

      if (! package.main || ! package.version) {
        bootstrapLogger.error(`Flavor ${flavor.name} is missing 'main' and/or 'version' in its package.json, skipping.`);
        return;
      }

      const modulePath = join(flavorFilePath(flavor.name), package.main);
      const flavorVersion = package.version;

      bootstrapLogger.debug(`Adding flavor ${flavor.name} to the menu`);
      menu.flavors[flavor.name] = {
        ...flavor,
        modulePath,
        flavorVersion,
      };

      if (! flavor.path || ! flavor.method) {
        return;
      }

      if (! menu.paths[flavor.path]) {
        menu.paths[flavor.path] = {};
      } else if (menu.paths[flavor.path][flavor.method]) {
        reject(`Path ${flavor.path} with method ${method} have a conflict between ${flavor.name} and ${menu.paths[flavor.path][flavor.method]}. Aborting bootstrap.`);
        return;
      }

      menu.paths[flavor.path][flavor.method] = flavor.name;
    }

    const buildMenuFlavor = catchErrors(_buildMenuFlavor);

    flavors.forEach(buildMenuFlavor);

    resolve(menu);
  }

  return new Promise(buildMenu);
}

const buildMenu = catchErrors(_buildMenu);

/**
 * Write the menu to disk.
 *
 * @param       {Object} menu bbq menu
 * @return      {Promise}
 */
async function _writeMenu(menu) {
  function write(resolve, reject) {
    const path = join(__dirname, '/flavors/', 'menu.json');
    const output = JSON.stringify(menu, null, 2);

    bootstrapLogger.log('Writing bbq menu to disk');

    try {
      fs.writeFileSync(path, output);
      resolve();
    } catch (error) {
      reject(error);
    }
  }

  return new Promise(write);
}

const writeMenu = catchErrors(_writeMenu);

/**
 * Initiate the bootstrap process.
 */
async function _bootstrap() {
  bootstrapLogger.log('Starting bootstrap process.');

  const config = await loadConfig();

  await cloneFlavors(config);
  await installFlavors(config);

  const flavors = await readFlavorConfigs(config);
  const menu = await buildMenu(config, flavors);

  await writeMenu(menu);

  const configuredFlavors = Object.keys(menu.flavors).join(', ');

  bootstrapLogger.log(`Bootstrap completed with ${Object.keys(menu.flavors).length} flavor(s) configured (${configuredFlavors}).`);
}

const bootstrap = catchErrors(_bootstrap);

const start = Date.now();

bootstrap().then(() => {
  bootstrapLogger.log(`bbq bootstrap completed in ${(Date.now() - start) / 1000} second(s).`);
  process.exit(0);
});
