
import { LoggerService, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as winston from 'winston';
import * as Transport from 'winston-transport';
import * as net from 'net';

class TCPTransport extends Transport {
  private client: net.Socket | null = null;
  private logstashHost: string;
  private logstashPort: number;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private reconnectDelay = 2000;

  constructor(opts: any) {
    super(opts);
    this.logstashHost = opts.host || 'localhost';
    this.logstashPort = opts.port || 5000;

    this.connectToLogstash();
  }

  private connectToLogstash() {
    this.client = net.connect({ host: this.logstashHost, port: this.logstashPort }, () => {
      console.log(`🟢 Conectado a Logstash en ${this.logstashHost}:${this.logstashPort}`);
      this.reconnectAttempts = 0;
    });

    this.client.on('error', (err: Error) => {
      console.error(`🔴 Error al conectar con Logstash: ${err.message}`);

      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        this.reconnectAttempts++;
        console.log(`🔁 Reintentando conexión (${this.reconnectAttempts}/${this.maxReconnectAttempts}) en ${this.reconnectDelay}ms...`);
        setTimeout(() => this.connectToLogstash(), this.reconnectDelay);
      } else {
        console.error('❌ Se alcanzó el número máximo de reintentos para conectar a Logstash.');
      }
    });

    this.client.on('close', () => {
      console.warn('🔌 Conexión con Logstash cerrada.');
    });
  }

  log(info: any, callback: () => void) {
    setImmediate(() => this.emit('logged', info));

    if (this.client && !this.client.destroyed) {
      try {
        this.client.write(JSON.stringify(info) + '\n');
      } catch (e) {
        console.error('❗ Error al escribir en el socket TCP:', e.message);
      }
    }

    callback();
  }
}

@Injectable()
export class MyLogger implements LoggerService {
  private logger: winston.Logger;

  constructor(private configService: ConfigService) {
    const logstashHost = this.configService.get<string>('LOGSTASH_HOST', 'localhost');
    const logstashPort = parseInt(this.configService.get<string>('LOGSTASH_PORT', '5000'), 10);

    console.log(`[MyLogger Init] Intentando conectar a Logstash en: ${logstashHost}:${logstashPort}`);

    this.logger = winston.createLogger({
      level: 'info',
      transports: [
        new winston.transports.Console(),
        new TCPTransport({ host: logstashHost, port: logstashPort }),
      ],
    });
  }

  log(message: string, context?: string) {
    this.logger.info({ level: 'info', message, context });
  }

  error(message: string, trace?: string, context?: string) {
    this.logger.error({ level: 'error', message, trace, context });
  }

  warn(message: string, context?: string) {
    this.logger.warn({ level: 'warn', message, context });
  }

  debug(message: string, context?: string) {
    this.logger.debug({ level: 'debug', message, context });
  }

  verbose(message: string, context?: string) {
    this.logger.verbose({ level: 'verbose', message, context });
  }
}
