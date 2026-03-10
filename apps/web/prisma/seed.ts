import "dotenv/config"
import { PrismaClient } from "../src/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import pg from "pg"
import bcrypt from "bcryptjs"

const pool = new pg.Pool({
  connectionString: process.env.DIRECT_URL,
})
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter } as never)

async function main() {
  const existingAdmin = await prisma.user.findFirst({
    where: { role: "ADMIN" },
  })

  if (existingAdmin) {
    console.log("Admin user already exists, skipping seed.")
    return
  }

  const passwordHash = await bcrypt.hash("admin123", 10)

  await prisma.user.create({
    data: {
      email: "admin@volttus.com",
      passwordHash,
      fullName: "System Admin",
      role: "ADMIN",
    },
  })

  console.log("Seed complete: admin@volttus.com / admin123")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
    await pool.end()
  })
