import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Habilita CORS
  // Para desarrollo, puedes dejarlo así para permitir todas las solicitudes.
  app.enableCors();

  // *** MEJORES PRÁCTICAS PARA PRODUCCIÓN: ***
  // En un entorno de producción, es muy recomendable especificar los orígenes permitidos.
  /*
  app.enableCors({
    origin: 'http://localhost:4200', // O la URL de tu aplicación Angular en producción
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true, // Si tu aplicación Angular envía cookies o encabezados de autorización
  });
  */

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