import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { JwtPayload } from '@athenagrid/shared';

/** Injects the authenticated user (JwtPayload) attached by JwtAuthGuard. */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): JwtPayload => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
