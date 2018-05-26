const Logger = require('./logger');
const { catchErrors } = require('./utils');

const bbqLogger = new Logger('bbq engine', '#ff7f00');

/**
 * Load the bbq menu from disk.
 * @return {Object} bbq menu
 */
async function _loadMenu() {
  try {
    const menu = require('./flavors/menu.json');

    if (! menu.flavors || ! menu.meta || ! menu.paths) {
      bbqLogger.error('bbq menu has invalid format, aborting.');
      process.exit(0);
    }

    bbqLogger.log(`Loading bbq menu v${menu.meta.version}.`);

    return menu;
  } catch (error) {
    bbqLogger.error('Failed to load bbq menu, aborting.');
    process.exit(0);
  }
}

const loadMenu = catchErrors(_loadMenu, bbqLogger);

/**
 * Initialize the bbq engine and return core components.
 *
 * @return {Object} Object containing the menu and use function.
 */
async function _init() {
  const menu = await loadMenu();

  /**
   * Use the given flavor.
   *
   * @param  {String} name Flavor name
   * @return {Function}    Returns a function that when called with arguments
   *                       passes them to the flavor and returns a promise containing
   *                       the flavor output.
   */
  function use(name) {
    async function _wrap(...args) {
      if (! menu.flavors[name]) {
        bbqLogger.error(`Flavor by the name of '${name}' was invoked but does not exist in the menu.`);
        return null;
      }

      const flavorLogger = new Logger(`bbq flavor - ${name}`, '#ff7f00');

      const config = menu.flavors[name];
      if (! config || ! config.modulePath) {
        bbqLogger.error(`Flavor ${name} was invoked but is missing the required values in the menu.`);
        return null;
      }

      const { modulePath } = config;

      bbqLogger.debug(`Loading flavor ${name} from path ${modulePath}.`);

      const flavor = require(modulePath);

      if (! flavor) {
        bbqLogger.error(`Flavor ${name} was invoked but it does not return a default export.`);
        return null;
      }

      if (flavor[Symbol.toStringTag] !== 'AsyncFunction') {
        bbqLogger.error(`Flavor ${name} was invoked but it does not return an async function as the default export.`);
        return null;
      }

      const catchErrorWrappedFlavor = catchErrors(flavor, flavorLogger);
      const flavorFunction = await catchErrorWrappedFlavor(use, menu, flavorLogger);

      if (! flavorFunction) {
        bbqLogger.error(`Flavor ${name} was invoked but it did not return an inner function.`);
        return null;
      }

      if (flavorFunction[Symbol.toStringTag] !== 'AsyncFunction') {
        bbqLogger.error(`Flavor ${name} was invoked but it does not return an inner async function.`);
        return null;
      }

      const catchErrorWrappedFlavorFunction = catchErrors(flavorFunction, flavorLogger);

      bbqLogger.log(`Invoking flavor ${name}`);

      const start = Date.now();
      const result = await catchErrorWrappedFlavorFunction(...args);

      bbqLogger.log(`Flavor ${name} execution completed in ${(Date.now() - start)} millisecond(s).`);

      return result;
    }

    const wrap = catchErrors(_wrap, bbqLogger);

    return wrap;
  }

  return {
    menu,
    use,
  };
}

const init = catchErrors(_init, bbqLogger);

module.exports = init;
