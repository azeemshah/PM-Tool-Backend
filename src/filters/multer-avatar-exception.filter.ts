import { ExceptionFilter, Catch, ArgumentsHost } from '@nestjs/common';
import { MulterError } from 'multer';

@Catch(MulterError)
export class MulterAvatarExceptionFilter implements ExceptionFilter {
  catch(exception: MulterError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();

    console.log(
      'MulterAvatarExceptionFilter caught an exception:',
      exception.code,
    );
    if (exception.code === 'LIMIT_FILE_SIZE') {
      response.status(400).json({
        message: 'The given data was invalid.',
        errors: {
          avatar: ['Avatar file size must not exceed 5MB.'],
        },
      });
    } else {
      // Other multer errors (rare)
      response.status(400).json({
        message: 'File upload error.',
        error: exception.message,
      });
    }
  }
}
