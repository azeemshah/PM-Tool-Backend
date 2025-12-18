import { BadRequestException, ValidationError } from '@nestjs/common';
import { getFieldLabel } from 'src/decorators/label.decorator';
import { I18nContext } from 'nestjs-i18n';

export function validationExceptionFactory(errors: ValidationError[]) {
  const i18n = I18nContext.current();
  const formattedErrors: Record<string, string[]> = {};

  errors.forEach((error) => {
    const label = getFieldLabel(error.target, error.property) || error.property;

    if (error.constraints) {
      formattedErrors[error.property] = Object.values(error.constraints).map(
        (msg) => i18n?.t(msg) || '',
      );
    }
  });

  return new BadRequestException({
    message: 'Validation failed',
    errors: formattedErrors,
  });
}
