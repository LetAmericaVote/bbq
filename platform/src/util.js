const http = require('http');
const chalk = require('chalk');
const randomColor = require('randomcolor');

function Logger(prefix) {
  const red = chalk.hex('#ff4c4d');
  const darkCyan = chalk.hex('#072c34');
  const logColor = chalk.hex(randomColor());

  function buildPrefix() {
    return `${darkCyan(new Date().toString())} [${red(prefix)}${darkCyan(']:')}`;
  }

  return {
    log: (message) => {
      console.log(`${buildPrefix()} ${logColor(message)}`);
    },
    error: (error) => {
      console.log(`${buildPrefix()} ${logColor(error)}`);
    },
  }
}

function BufferLogger(prefix, onLog) {
  const logger = Logger(prefix);

  function covert(data) {
    return Buffer.from(data).toString('utf8').trim();
  }

  return {
    log: (data) => {
      const message = covert(data);
      logger.log(message);

      onLog ? onLog(message) : null;
    },
    error: (errorData) => {
      const error = covert(errorData);
      logger.error(error);
    },
    logger,
  };
}

async function isPortBound(port) {
  return new Promise((resolve, reject) => {
    http.get('http://localhost:5000', (response) => {
      resolve(true);
    }).on('error', error => {
      if (error.code === 'ECONNREFUSED') {
        resolve(false);
      } else {
        resolve(true);
      }
    });
  });
}

module.exports = {
  Logger,
  BufferLogger,
  isPortBound,
};
