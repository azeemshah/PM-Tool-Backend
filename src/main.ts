import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import * as express from 'express';
import { validationExceptionFactory } from './../utils/validation-exception.factory';
import { join } from 'path';
import { AllExceptionsFilter } from './filters/all-exceptions.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Allowed origins list
  const allowedOrigins = ['http://localhost:3000'];

  // Helmet setup (very important for images)
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      crossOriginEmbedderPolicy: false,
    }),
  );

  // Global CORS (for API requests)
  app.enableCors({
    origin: (
      origin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void,
    ) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(
          new Error('CORS not allowed for this origin: ' + origin),
          false,
        );
      }
    },
    credentials: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      stopAtFirstError: true,
      transform: true,
      exceptionFactory: validationExceptionFactory,
    }),
  );

  app.use(express.json({ limit: '500mb' }));
  app.use(express.urlencoded({ extended: true, limit: '500mb' }));

  app.useGlobalFilters(new AllExceptionsFilter());

  // Static file serving with dynamic CORS headers for multiple origins
  const staticCorsMiddleware = (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction,
  ): void => {
    const origin = req.headers.origin;
    if (origin && allowedOrigins.includes(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
    }
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    next();
  };

  app.use(
    `/${process.env.STORAGE_PATH}`,
    staticCorsMiddleware,
    express.static(join(__dirname, '..', `${process.env.STORAGE_PATH}`)),
  );

  await app.listen(process.env.PORT ?? 5001);
}
bootstrap();
