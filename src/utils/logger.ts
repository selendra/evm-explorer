import { backendConfig } from '../config';
import pino from 'pino';

export const logger = pino({
  level: backendConfig.logLevel,
})