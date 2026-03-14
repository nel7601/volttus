import { z } from "zod"

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(3),
})

export const propertySchema = z.object({
  propertyName: z.string().min(1, "Property name is required"),
  addressLine1: z.string().min(1, "Address is required"),
  addressLine2: z.string().optional(),
  city: z.string().min(1, "City is required"),
  provinceState: z.string().optional(),
  postalCode: z.string().optional(),
  country: z.string().default("HR"),
  timezone: z.string().default("Europe/Zagreb"),
  landlordId: z.string().min(1, "Landlord is required"),
})

export const groupSchema = z.object({
  groupName: z.string().min(1, "Group name is required"),
  groupType: z.enum(["INCOME", "COMMON", "APARTMENT"]),
  apartmentNumber: z.string().optional(),
  displayOrder: z.coerce.number().default(0),
  propertyId: z.string().min(1),
  isVirtual: z.coerce.boolean().default(false),
}).refine(
  (data) => !data.isVirtual || data.groupType !== "INCOME",
  { message: "INCOME groups cannot be virtual", path: ["isVirtual"] }
)

export const userSchema = z.object({
  email: z.string().email(),
  fullName: z.string().min(1, "Name is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["ADMIN", "LANDLORD", "TENANT"]),
  // Landlord fields
  companyName: z.string().optional(),
  phone: z.string().optional(),
  // Tenant fields
  propertyId: z.string().optional(),
  apartmentGroupId: z.string().optional(),
})

export const emporiaAccountSchema = z.object({
  accountEmail: z.string().email(),
  password: z.string().min(1, "Password is required"),
  propertyId: z.string().min(1),
})

export const alectraAccountSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
  accountNumber: z.string().min(1, "Account number is required"),
  meterNumber: z.string().optional(),
  propertyId: z.string().min(1),
})

export const channelMappingSchema = z.object({
  channelId: z.string(),
  displayName: z.string(),
  assignedGroupId: z.string().nullable(),
  isEnabled: z.boolean(),
})
