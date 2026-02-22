import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
// import { MyLogger } from './logger.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);



  // const myLoggerInstance = app.get(MyLogger);


  // app.useLogger(myLoggerInstance);

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
