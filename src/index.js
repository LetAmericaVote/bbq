const cluster = require('cluster');
const http = require('http');
const Koa = require('koa');
const Logger = require('./logger');

const platformLogger = Logger('platform', '#0080ff');
const app = new Koa();

const forks = process.env.FORKS || 1;
const port = process.env.PORT || 5050;

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
  app.use(ctx => {
    ctx.body = 'Hello';
  });

  app.listen(port);

  platformLogger.log(`Worker process (PID:${process.pid}) started on port ${port}.`);
}
