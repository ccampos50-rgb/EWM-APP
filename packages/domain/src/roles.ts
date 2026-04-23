export const ROLES = [
  "super_admin",
  "rvp",
  "area_manager",
  "site_manager",
  "worker",
] as const;

export type Role = (typeof ROLES)[number];

export const ROLE_LABELS: Record<Role, string> = {
  super_admin: "Super Admin",
  rvp: "Regional VP",
  area_manager: "Area Manager",
  site_manager: "Site Manager",
  worker: "Field Worker",
};

export const ROLE_RANK: Record<Role, number> = {
  super_admin: 100,
  rvp: 80,
  area_manager: 60,
  site_manager: 40,
  worker: 10,
};

export function canManage(actor: Role, target: Role): boolean {
  return ROLE_RANK[actor] > ROLE_RANK[target];
}
