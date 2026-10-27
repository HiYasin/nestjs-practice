import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Trim the additional property
      forbidNonWhitelisted: true, // Forbid the request directly
      transform: true, // Convert the object into DTO instance
      transformOptions :{
        enableImplicitConversion: true, // Using enableImplicitConversion we don't need to use Type conversion explicitly in each DTO. Ex- Pagination-query dto
      }
    })
  )


  // Swagger configuration
  const config = new DocumentBuilder()
  .setTitle('NestJS Practice API')
  .setDescription('This is a practice API built with NestJS.')
  .setTermsOfService('https://example.com/terms')
  .setLicense('MIT', 'https://opensource.org/licenses/MIT')
  .setVersion('1.0')
  .addServer('http://localhost:3000', 'Local server')
  .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);


  await app.listen(process.env.PORT ?? 3000);
}
await bootstrap();
