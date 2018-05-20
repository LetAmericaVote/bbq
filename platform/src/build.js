const { spawn } = require('child_process');
const { Logger, BufferLogger } = require('./util');

const logger = Logger('build manager');

async function buildNextInLine(buildQueue) {
  const instruction = buildQueue.pop();
  const { flavorId, srcPath } = instruction;

  logger.log(`Starting build process for ${flavorId}, ${buildQueue.length} flavors remaining in queue...`);

  const buildLogger = BufferLogger(`build - ${flavorId}`);

  const pipeline = spawn('make install', {
    shell: true,
    cwd: srcPath,
  });

  const buildPromise = new Promise((resolve, reject) => {
    pipeline.stdout.on('data', (data) => {
      buildLogger.log(data);
    });

    pipeline.stderr.on('data', (data) => {
      buildLogger.error(data);
    });

    pipeline.on('close', (code) => {
      logger.log(`Build completed for ${flavorId}`);

      if (buildQueue.length !== 0) {
        resolve(buildNextInLine(buildQueue));
      } else {
        resolve();
      }
    });
  });

  return buildPromise;
}

module.exports = {
  async build (instructions) {
    try {
      return buildNextInLine(instructions);
    } catch (error) {
      logger.error('Error executing build queue');
      logger.error(error);
    }
  },
};
