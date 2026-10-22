type LogLevel = 'info' | 'warn' | 'error';

interface LogPayload {
  level: LogLevel;
  message: string;
  context?: Record<string, unknown>;
  timestamp: string;
}

function writeLog(level: LogLevel, message: string, context?: Record<string, unknown>): void {
  const payload: LogPayload = {
    level,
    message,
    context,
    timestamp: new Date().toISOString(),
  };

  const output = JSON.stringify(payload);
  if (level === 'error') {
    process.stderr.write(`${output}\n`);
  } else {
    process.stdout.write(`${output}\n`);
  }
}

export const logger = {
  info(message: string, context?: Record<string, unknown>): void {
    writeLog('info', message, context);
  },
  warn(message: string, context?: Record<string, unknown>): void {
    writeLog('warn', message, context);
  },
  error(message: string, context?: Record<string, unknown>): void {
    writeLog('error', message, context);
  },
};
