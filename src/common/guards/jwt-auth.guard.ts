import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    // Check if the route is marked as public
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // For public routes, try to authenticate if token is provided, but allow access regardless
    if (isPublic) {
      // Convert to promise and catch errors, allowing access even if auth fails
      const authResult = super.canActivate(context);
      if (authResult instanceof Promise) {
        return authResult.catch(() => true);
      }
      return authResult;
    }

    return super.canActivate(context);
  }

  handleRequest(err: any, user: any, info: any, context?: ExecutionContext) {
    // Check if this is a public route
    const isPublic =
      context &&
      this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
        context.getHandler(),
        context.getClass(),
      ]);

    // For public routes, allow null user (but attach user if auth succeeded)
    if (isPublic) {
      return user || null;
    }

    // For protected routes, require authentication
    if (err || !user) {
      throw err || new UnauthorizedException('Authentication required');
    }
    return user;
  }
}
