import { Response, NextFunction } from 'express';
import type { AuthRequest } from './auth';

export const APP_ROLES = [
  'admin',
  'doctor',
  'intern',
  'patient',
  'hospital_staff',
  'moderator'
] as const;

export type AppRole = typeof APP_ROLES[number];

export const APP_PERMISSIONS = [
  'analytics:read',
  'badge:manage',
  'case:create',
  'case:delete',
  'case:follow_up',
  'case:repost',
  'case:update',
  'certificate:issue',
  'comment:create',
  'comment:moderate',
  'import:run',
  'job:manage',
  'profile:verify',
  'rating:create',
  'user:award_points',
  'webinar:attend',
  'webinar:feedback',
  'webinar:manage'
] as const;

export type AppPermission = typeof APP_PERMISSIONS[number];

export const ROLE_PERMISSION_MATRIX: Record<AppRole, readonly AppPermission[]> = {
  admin: APP_PERMISSIONS,
  doctor: [
  'analytics:read',
  'badge:manage',
  'case:create',
  'case:delete',
  'case:follow_up',
  'case:repost',
  'case:update',
  'certificate:issue',
  'comment:create',
  'comment:moderate',
  'import:run', // ✅ Added
  'job:manage',
  'profile:verify',
  'rating:create',
  'user:award_points',
  'webinar:attend',
  'webinar:feedback',
  'webinar:manage'
],
  intern: [
    'analytics:read',
    'case:follow_up',
    'case:repost',
    'comment:create',
    'rating:create',
    'webinar:attend',
    'webinar:feedback'
  ],
  patient: [
    'case:create',
    'case:repost',
    'comment:create',
    'rating:create',
    'webinar:attend',
    'webinar:feedback'
  ],
  hospital_staff: [
    'analytics:read',
    'case:follow_up',
    'case:repost',
    'comment:create',
    'import:run',
    'rating:create',
    'webinar:attend',
    'webinar:feedback'
  ],
  moderator: [
    'analytics:read',
    'case:repost',
    'comment:create',
    'comment:moderate',
    'rating:create',
    'webinar:attend',
    'webinar:feedback'
  ]
};

export const normalizeRole = (role?: string): AppRole | undefined => {
  if (!role) return undefined;

  const normalized = role.toLowerCase().replace(/[-\s]/g, '_');
  return APP_ROLES.includes(normalized as AppRole) ? normalized as AppRole : undefined;
};

export const getUserRole = (req: AuthRequest): AppRole | undefined => {
  const user = req.user as (AuthRequest['user'] & { role?: string }) | undefined;
  return normalizeRole(user?.role) ?? normalizeRole(user?.userType);
};

export const hasPermission = (role: AppRole | undefined, permission: AppPermission) => {
  if (!role) return false;
  return ROLE_PERMISSION_MATRIX[role].includes(permission);
};

export const hasAnyPermission = (role: AppRole | undefined, permissions: readonly AppPermission[]) => {
  return permissions.some(permission => hasPermission(role, permission));
};

const permissionDenied = (
  res: Response,
  requiredPermissions: readonly AppPermission[],
  role?: AppRole
) => {
  return res.status(403).json({
    success: false,
    message: 'Forbidden: this action is not allowed for your role',
    code: 'FORBIDDEN',
    role,
    requiredPermissions
  });
};

export const requirePermission = (permission: AppPermission) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    const role = getUserRole(req);

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    if (!hasPermission(role, permission)) {
      return permissionDenied(res, [permission], role);
    }

    next();
  };
};

export const requireAnyPermission = (...permissions: AppPermission[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    const role = getUserRole(req);

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    if (!hasAnyPermission(role, permissions)) {
      return permissionDenied(res, permissions, role);
    }

    next();
  };
};
