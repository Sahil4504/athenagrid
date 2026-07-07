import { SetMetadata } from '@nestjs/common';
import { UserRole } from '@athenagrid/shared';

export const ROLES_KEY = 'roles';
/** Restrict a route to one or more roles. Used with RolesGuard. */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
