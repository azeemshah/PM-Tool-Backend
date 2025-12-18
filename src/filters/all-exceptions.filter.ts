import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  PayloadTooLargeException,
} from '@nestjs/common';
import { Response } from 'express';
import { MulterError } from 'multer';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    // ✅ MulterError directly from Multer (usually works)
    if (exception instanceof MulterError && exception.code === 'LIMIT_FILE_SIZE') {
      const fieldName = exception.field || 'file';
      return response.status(400).json({
        message: 'The given data was invalid.',
        errors: {
          [fieldName]: ['File size exceeds limit.'],
        },
      });
    }

    // ✅ PayloadTooLargeException from NestJS (Multer errors converted)
    if (exception instanceof PayloadTooLargeException) {
      // This may not have field name info, fallback to "file"
      return response.status(400).json({
        message: 'The given data was invalid.',
        errors: {
          file: ['File size exceeds limit.'],
        },
      });
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      return response.status(status).json(exception.getResponse());
    }

    return response.status(500).json({ message: 'Internal server error' });
  }
}
