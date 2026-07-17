export const ROLES = {
  VOLUNTEER: 'VOLUNTEER',
  STAFF: 'STAFF',
  MANAGER: 'MANAGER',
  ADMIN: 'ADMIN',
};

export const roleRouteMap = {
  [ROLES.ADMIN]: '/admin/dashboard',
  [ROLES.VOLUNTEER]: '/home',
  [ROLES.STAFF]: '/staff/events',
  [ROLES.MANAGER]: '/manager/dashboard',
};