// load config file (either from disk or remote) based on ENV value
//  - clone all repo's
//  - run npm install in all folders & ignore dev dep's
//  - extrct config data
// store all flavor config data in file & version of config cloned
// ~~~
// Add command to package.json
// Setup test local config w/ Ping flavor

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
 * @return {Promise.<Object>.<Error>} The parsed data from the config or an error.
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
 * @return {Promise.<Object>.<Error>} The parsed data from the config or an error.
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
 * @return {Object}
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

async function _installFlavors(config) {
  const installOperations = validFlavorsFromConfig(config)
    .map(flavor => installFlavor(flavor.name));

  bootstrapLogger.log(`Installing modules for ${installOperations.length} flavor(s).`);

  return Promise.all(installOperations);
}

const installFlavors = catchErrors(_installFlavors);

/**
 * Initiate the bootstrap process.
 */
async function _bootstrap() {
  bootstrapLogger.log('Starting bootstrap process.');

  const config = await loadConfig();

  await cloneFlavors(config);
  await installFlavors(config);
}

const bootstrap = catchErrors(_bootstrap);

const start = Date.now();

bootstrap().then(() => {
  bootstrapLogger.log(`bbq bootstrap completed in ${(Date.now() - start) / 1000} second(s).`);
  process.exit(0);
});
