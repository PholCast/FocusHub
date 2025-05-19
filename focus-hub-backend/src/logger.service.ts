// import { LoggerService } from '@nestjs/common';
// import * as winston from 'winston';
// import * as Transport from 'winston-transport';
// import * as net from 'net';

// class TCPTransport extends Transport {
//   private client: net.Socket;

//   constructor(opts: any) {
//     super(opts);
//     this.client = net.connect({ port: 5000 }, () => {
//       console.log('🟢 Conectado a Logstash');
//     });
//   }

//   log(info: any, callback: () => void) {
//     setImmediate(() => this.emit('logged', info));
//     this.client.write(JSON.stringify(info) + '\n');
//     callback();
//   }
// }

// // export class MyLogger implements LoggerService {
// //   private logger = winston.createLogger({
// //     level: 'info',
// //     transports: [new TCPTransport({})],
// //   });

// //   log(message: string) {
// //     this.logger.info({ message });
// //   }

// //   error(message: string, trace?: string) {
// //     this.logger.error({ message, trace });
// //   }

// //   warn(message: string) {
// //     this.logger.warn({ message });
// //   }

// //   debug(message: string) {
// //     this.logger.debug({ message });
// //   }

// //   verbose(message: string) {
// //     this.logger.verbose({ message });
// //   }
// // }
// export class MyLogger implements LoggerService {
//   private logger = winston.createLogger({
//     level: 'info',
//     transports: [new TCPTransport({})],
//   });

//   log(message: string) {
//     this.logger.info({ level: 'info', message });
//   }

//   error(message: string, trace?: string) {
//     this.logger.error({ level: 'error', message, trace });
//   }

//   warn(message: string) {
//     this.logger.warn({ level: 'warn', message });
//   }

//   debug(message: string) {
//     this.logger.debug({ level: 'debug', message });
//   }

//   verbose(message: string) {
//     this.logger.verbose({ level: 'verbose', message });
//   }
// }



// focus-hub-backend/src/logger.service.ts
import { LoggerService, Injectable } from '@nestjs/common'; // Asegúrate de importar Injectable
import { ConfigService } from '@nestjs/config'; // <-- Importa ConfigService
import * as winston from 'winston';
import * as Transport from 'winston-transport';
import * as net from 'net';

// 1. Modifica TCPTransport para aceptar host y port
class TCPTransport extends Transport {
  private client: net.Socket;
  private logstashHost: string;
  private logstashPort: number;

  constructor(opts: any) {
    super(opts);
    this.logstashHost = opts.host || 'localhost'; // Usa el host pasado, o localhost por defecto
    this.logstashPort = opts.port || 5000;       // Usa el puerto pasado, o 5000 por defecto

    this.client = net.connect({ host: this.logstashHost, port: this.logstashPort }, () => {
      console.log(`🟢 Conectado a Logstash en ${this.logstashHost}:${this.logstashPort}`);
    });

    this.client.on('error', (err: Error) => {
      console.error(`🔴 Error en conexión con Logstash (${this.logstashHost}:${this.logstashPort}):`, err.message);
      // Opcional: Reintentar conexión, etc.
    });
  }

  log(info: any, callback: () => void) {
    setImmediate(() => this.emit('logged', info));
    try {
      this.client.write(JSON.stringify(info) + '\n');
    } catch (e) {
      console.error('Error al escribir en el socket TCP:', e.message);
    }
    callback();
  }
}

// 2. Modifica MyLogger para inyectar ConfigService y pasar los valores
@Injectable() // <-- Importante: Marca MyLogger como inyectable
export class MyLogger implements LoggerService {
  private logger: winston.Logger;

  // Inyecta ConfigService en el constructor
  constructor(private configService: ConfigService) {
    // Obtiene los valores del host y puerto de Logstash desde las variables de entorno
    // Usa 'logstash' como host por defecto si no se encuentra la variable (para el entorno Docker)
    const logstashHost = this.configService.get<string>('LOGSTASH_HOST', 'logstash');
    const logstashPort = parseInt(this.configService.get<string>('LOGSTASH_PORT', '5000'), 10);

    console.log(`[MyLogger Init] Intentando conectar a Logstash en: ${logstashHost}:${logstashPort}`);

    this.logger = winston.createLogger({
      level: 'info',
      transports: [
        new winston.transports.Console(), // Para ver los logs en la consola del contenedor
        new TCPTransport({ host: logstashHost, port: logstashPort }), // Pasa host y port al TCPTransport
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