import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import * as compression from 'compression';
import * as cookieParser from 'cookie-parser';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Security
  app.use(helmet());
  app.use(compression());

  // CORS for HTTP and WebSocket
  const corsOptions = {
    origin: configService.get('FRONTEND_URL') || 'http://localhost:5000',
    credentials: true,
  };
  app.enableCors(corsOptions);

  // Cookie parser for reading refresh token cookies
  app.use(cookieParser());

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      stopAtFirstError: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // API prefix
  const apiPrefix = configService.get('API_PREFIX') || 'api/v1';
  app.setGlobalPrefix(apiPrefix);

  const port = configService.get('PORT') || 5000;
  await app.listen(port, '0.0.0.0');

  console.log(`🚀 Application is running on: http://127.0.0.1:${port}/${apiPrefix}`);
  console.log(`🔌 WebSocket available at: ws://127.0.0.1:${port}/${apiPrefix}/issues`);
}

bootstrap();
