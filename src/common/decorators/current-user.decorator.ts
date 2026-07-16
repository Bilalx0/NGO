import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { UserRole } from '@prisma/client';

export interface JwtUserPayload {
  sub: number;
  email: string;
  role: UserRole;
  organizationId: number | null;
}

export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext) => {
    const request = context.switchToHttp().getRequest<{ user?: JwtUserPayload }>();
    return request.user;
  },
);
