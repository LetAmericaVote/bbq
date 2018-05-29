const cluster = require('cluster');
const http = require('http');
const express = require('express');
const Logger = require('./logger');
const { catchErrors } = require('./utils');

const platformLogger = Logger('platform', '#0080ff');
const app = express();
const bbq = require('./bbq');

const forks = process.env.FORKS || 1;
const port = process.env.PORT || 5050;

async function _init() {
  const { menu, use } = await bbq();

  function wrapRouteHandler(name) {
    async function _routeHandler(req, res) {
      await use(menu.flavors.ping.name)(req, res);
    };

    const routeHandler = catchErrors(_routeHandler, platformLogger);

    return routeHandler;
  }

  Object.keys(menu.flavors).forEach(name => {
    const { path, method } = menu.flavors[name];

    // TODO: Optional middleware... OR do we let flavors define this?
    // Like we could have a flavor that just wraps over express cors.
    // - CORS
    // - JSON Body parser
    // - Cookies?
    // - Static files?
    app[method.toLowerCase()](path, wrapRouteHandler(name));
  });

  app.listen(port, () => {
    platformLogger.log(`Worker process (PID:${process.pid}) started on port ${port}.`);
  });
}

const init = catchErrors(_init, platformLogger);

if (cluster.isMaster) {
  platformLogger.log(`Master process (PID:${process.pid}) is running.`);
  platformLogger.log(`Decided on ${forks} fork(s).`);

  for (let i = 0; i < forks; i++) {
    cluster.fork();
  }

  cluster.on('exit', (worker, code, signal) => {
    platformLogger.log(`Worker process (PID:${worker.process.pid}) died.`);
  });
} else {
  init();
}
