import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Ensuring primary Admin user exists...");

  const adminUser = {
    username: "admin",
    password: "Password@123",
    role: "ADMIN" as const,
    name: "Rev. Dr. David Raj",
    email: "admin@wmlrs.com",
    phoneNumber: "+91 98480 12345",
    state: "National Headquarters",
    zone: "Central",
    part: "HQ",
  };

  const passwordHash = await bcrypt.hash(adminUser.password, 10);
  let user = await prisma.user.findUnique({
    where: { username: adminUser.username },
  });

  if (!user) {
    user = await prisma.user.create({
      data: {
        username: adminUser.username,
        passwordHash: passwordHash,
        role: adminUser.role,
        name: adminUser.name,
        email: adminUser.email,
        phoneNumber: adminUser.phoneNumber,
        emailVerified: true,
        state: adminUser.state,
        part: adminUser.part,
        zone: adminUser.zone,
      },
    });

    await prisma.account.create({
      data: {
        accountId: adminUser.email,
        providerId: "credential",
        userId: user.id,
        password: passwordHash,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
    console.log(`✓ Created primary Admin user: ${adminUser.username}`);
  } else {
    console.log(`✓ Admin user already exists: ${adminUser.username}`);
  }

  console.log("✅ Seed completed: Database is clean with only the primary Admin account.");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
