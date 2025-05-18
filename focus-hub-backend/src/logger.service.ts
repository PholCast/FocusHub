import { LoggerService } from '@nestjs/common';
import * as winston from 'winston';
import * as Transport from 'winston-transport';
import * as net from 'net';

class TCPTransport extends Transport {
  private client: net.Socket;

  constructor(opts: any) {
    super(opts);
    this.client = net.connect({ port: 5000 }, () => {
      console.log('🟢 Conectado a Logstash');
    });
  }

  log(info: any, callback: () => void) {
    setImmediate(() => this.emit('logged', info));
    this.client.write(JSON.stringify(info) + '\n');
    callback();
  }
}

// export class MyLogger implements LoggerService {
//   private logger = winston.createLogger({
//     level: 'info',
//     transports: [new TCPTransport({})],
//   });

//   log(message: string) {
//     this.logger.info({ message });
//   }

//   error(message: string, trace?: string) {
//     this.logger.error({ message, trace });
//   }

//   warn(message: string) {
//     this.logger.warn({ message });
//   }

//   debug(message: string) {
//     this.logger.debug({ message });
//   }

//   verbose(message: string) {
//     this.logger.verbose({ message });
//   }
// }
export class MyLogger implements LoggerService {
  private logger = winston.createLogger({
    level: 'info',
    transports: [new TCPTransport({})],
  });

  log(message: string) {
    this.logger.info({ level: 'info', message });
  }

  error(message: string, trace?: string) {
    this.logger.error({ level: 'error', message, trace });
  }

  warn(message: string) {
    this.logger.warn({ level: 'warn', message });
  }

  debug(message: string) {
    this.logger.debug({ level: 'debug', message });
  }

  verbose(message: string) {
    this.logger.verbose({ level: 'verbose', message });
  }
}
