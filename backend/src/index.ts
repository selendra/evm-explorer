
// @ts-check
import * as Sentry from '@sentry/node';
import pino from 'pino';
import { spawn } from 'child_process';
import { wait } from './utils';
import { backendConfig } from './config';
// import * as Tracing from '@sentry/tracing';

Sentry.init({
  dsn: backendConfig.sentryDSN,
  tracesSampleRate: 1.0,
});

const logger = pino({
  level: backendConfig.logLevel,
});

const runScaner = async (scaner: string) => {
  const child = spawn('node', [`${scaner}`]);
  child.stdout.pipe(process.stdout);
  child.stderr.pipe(process.stderr);
  const loggerOptions = {
    scaner,
  };
  child.on('error', (error) => {
    logger.error(loggerOptions, `Scaner error: ${error}`);
  });
  child.on('close', (code) => {
    logger.error(loggerOptions, `Scaner closed with code ${code}`);
    // attempt to restart scaner
    // runScaner(scaner);
  });
  child.on('exit', (code) => {
    logger.error(loggerOptions, `Scaner exited with code ${code}`);
    // attempt to restart scaner
    // runScaner(scaner);
  });
};

const runScaners = async () => {
  logger.debug('Starting backend, waiting 10s...');
  await wait(10000);

  logger.debug('Running scaners');
  await Promise.all(
    backendConfig.scaners
      .filter(({ enabled }) => enabled)
      .map(({ scaner }) => runScaner(scaner)),
  );
};

runScaners().catch((error) => {
  logger.debug(`Error while trying to run scaners: ${error}`);
  Sentry.captureException(error);
  process.exit(-1);
});
