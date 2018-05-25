const http = require('http');
const chalk = require('chalk');
const { LOG_DEBUG } = process.env;

function Logger(prefix, color) {
  const red = chalk.hex('#ff4c4d');
  const darkCyan = chalk.hex('#072c34');
  const logColor = chalk.hex(color);

  function buildPrefix() {
    return `${darkCyan(new Date().toString())} [${red(prefix)}${darkCyan(']')}`;
  }

  return {
    debug: (message) => {
      if (! LOG_DEBUG || LOG_DEBUG.toLowerCase() !== 'true') {
        return;
      }

      console.log(`${buildPrefix()} (${darkCyan('DEBUG')}): ${logColor(message)}`);
    },
    log: (message) => {
      console.log(`${buildPrefix()}: ${logColor(message)}`);
    },
    error: (error) => {
      console.error(`${buildPrefix()} (${red('ERROR')}): ${logColor(error)}`);
    },
  }
}

module.exports = Logger;
