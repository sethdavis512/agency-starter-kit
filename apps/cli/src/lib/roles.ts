export const USER_ROLES = ["user", "admin"] as const;

export type UserRole = (typeof USER_ROLES)[number];

export function isValidRole(role: string): role is UserRole {
  return (USER_ROLES as readonly string[]).includes(role);
}
