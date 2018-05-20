const { spawn } = require('child_process');
const { join } = require('path');
const express = require('express');
const request = require('request');
const { Logger, BufferLogger, isPortBound } = require('./util');

const logger = Logger('http proxy');
const proxy = express();

const flavorName = 'ping';
const pingPath = join(__dirname, '../../core/ping');

proxy.all('*', (req, res) => {
  const flavorPort = 5001;
  const flavorConfirmation = `${flavorName} ready to accept requests`;

  const { url } = req;
  const params = url.split('/');
  if (params.length < 3) {
    res.send('not enough params'); // TODO, send error
    return;
  }

  const proxyPath = url.replace(`/${params[1]}/${params[2]}`, params.length === 3 ? '/' : '');
  const proxyUrl = `http://localhost:${flavorPort}${proxyPath}`;

  // TODO: get flavor based on params

  let isReady = false;
  let start = 0;

  function proxyRequest() {
    const proxyRequestStart = Date.now();
    logger.log(`Proxing request to ${flavorName}`);

    // TODO: Timeout?
    const proxyStream = req
      .pipe(request(proxyUrl))
      .pipe(res)
      .on('finish', () => {
        killFlavor();
        logger.log(`Proxied request to ${flavorName} completed after ${Date.now() - proxyRequestStart} milliseconds`);
      })
      .on('error', () => {
        killFlavor();
        // TODO: I'm assuming I should return a new response here?
        logger.log(`Proxied request to ${flavorName} failed after ${Date.now() - proxyRequestStart} milliseconds`);
      });
  }

  const flavorLogger = BufferLogger(`flavor - ${flavorName}`, (message) => {
    if (message === flavorConfirmation) {
      isReady = true;

      logger.log(`Flavor '${flavorName}' launched in ${(Date.now() - start)} milliseconds`);

      proxyRequest();
    }
  });

  start = Date.now();
  const flavorProcess = spawn('make start', {
    shell: true,
    cwd: pingPath,
    detached: true,
    env: {
      PORT: flavorPort,
      ON_READY: flavorConfirmation,
      ...process.env,
    },
  });

  flavorProcess.stdout.on('data', (data) => {
    flavorLogger.log(data);
  });

  flavorProcess.stderr.on('data', (data) => {
    flavorLogger.error(data);
  });

  flavorProcess.on('close', (code) => {
    logger.log(`Flavor '${flavorName}' was shutdown${code ? ` with code ${code}` : ''}`);
  });

  function killFlavor() {
    process.kill(-flavorProcess.pid, 'SIGKILL');
  }

  setTimeout(() => {
    if (! isReady) {
      killFlavor();
      logger.log(`Flavor '${flavorName}' failed to start within 500 milliseconds and has been terminated`);
      res.send('ok'); // TODO: send generic 500 response
    }
  }, 500);
});

module.exports = {
  listen: () => {
    const PORT = process.env.PORT || 5000;
    proxy.listen(PORT, () => {
      logger.log(`Proxy listening on port ${PORT}`);
    });
  },
}
