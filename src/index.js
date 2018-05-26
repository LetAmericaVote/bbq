const cluster = require('cluster');
const http = require('http');
const Koa = require('koa');
const Logger = require('./logger');
const { catchErrors } = require('./utils');

const platformLogger = Logger('platform', '#0080ff');
const app = new Koa();
const bbq = require('./bbq');

const forks = process.env.FORKS || 1;
const port = process.env.PORT || 5050;

async function _init() {
  const { menu, use } = await bbq();

  async function _routeHandler(ctx) {
    await use(menu.flavors.ping.name)(ctx);
  };

  const routeHandler = catchErrors(_routeHandler, platformLogger);

  app.use(routeHandler);
  app.listen(port);

  platformLogger.log(`Worker process (PID:${process.pid}) started on port ${port}.`);
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
