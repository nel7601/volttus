export const ROLES = {
  ADMIN: "ADMIN",
  LANDLORD: "LANDLORD",
  TENANT: "TENANT",
} as const

export const GROUP_TYPES = {
  INCOME: "INCOME",
  COMMON: "COMMON",
  APARTMENT: "APARTMENT",
} as const

export type RoleType = (typeof ROLES)[keyof typeof ROLES]
export type GroupTypeType = (typeof GROUP_TYPES)[keyof typeof GROUP_TYPES]
