import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { USER_TYPE_KEY } from '../decorators/user_types.decorator';
import { UserType } from 'src/enum';

@Injectable()
export class UserTypesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredTypes = this.reflector.getAllAndOverride<UserType[]>(USER_TYPE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredTypes || requiredTypes.length === 0) {
      return true; // no role restriction
    }

    const { user } = context.switchToHttp().getRequest();
    if (!user) throw new ForbiddenException('Unauthorized');

    if (!requiredTypes.includes(user.user_type)) {
      throw new ForbiddenException('You do not have permission to perform this action');
    }

    return true;
  }
}
