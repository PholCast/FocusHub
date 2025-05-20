import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { MyLogger } from './logger.service'; // 👈 Agrega esta línea

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Una vez que la aplicación está creada, puedes obtener instancias
  // de los proveedores (providers) desde su contexto de DI.
  const myLoggerInstance = app.get(MyLogger); // <-- ¡Aquí obtenemos la instancia correcta!

  // Luego, le dices a la aplicación que use esta instancia de tu logger.
  app.useLogger(myLoggerInstance); // <-- Usamos el método useLogger

  app.enableCors();

  const config = new DocumentBuilder()
    .setTitle('Ejemplo de API')
    .setDescription('Documentación generada automáticamente con Swagger')
    .setVersion('1.0')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.listen(3000);
}
bootstrap();
