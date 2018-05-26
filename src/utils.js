/**
 * Wrap an async function in a catch statement.
 *
 * @param  {Function} fn Actual function to call
 * @param  {Logger} logger Logging instance to use
 * @return {Function}
 */
function catchErrors(fn, logger) {
  return function(...args) {
    return fn(...args).catch((err) => {
      if (typeof err === 'object') {
        logger.error(err.stack);
      } else if (err) {
        logger.error(err);
      } else {
        logger.error('error without message thrown');
        console.trace();
      }
    });
  }
}

/**
 * Wrap an async function in a catch statement and
 * exit the process if an error is caught.
 *
 * @param  {Function} fn Actual function to call
 * @param  {Logger} logger Logging instance to use
 * @return {Function}
 */
function catchErrorsAndExit(fn, logger) {
  return function(...args) {
    return fn(...args).catch((err) => {
      logger.error(err);

      process.exit(0);
    });
  }
}

module.exports = {
  catchErrors,
  catchErrorsAndExit,
};
