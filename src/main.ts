import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Trim the additional property
      forbidNonWhitelisted: true, // Forbid the request directly
      transform: true // Convert the object into DTO instance
    })
  )
  await app.listen(process.env.PORT ?? 3000);
}
await bootstrap();
