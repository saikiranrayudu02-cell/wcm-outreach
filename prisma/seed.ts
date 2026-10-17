import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  const usersToCreate = [
    {
      username: "admin",
      password: "Password@123",
      role: "ADMIN",
      name: "System Admin",
      email: "admin@wmlrs.com",
      phoneNumber: "+91 98480 12345",
    },
    {
      username: "leader_john",
      password: "Password@123",
      role: "COORDINATOR",
      name: "John Coordinator",
      email: "john@wmlrs.com",
      phoneNumber: "+91 98480 23456",
      state: "AP",
      part: "Part-1",
      zone: "Zone-1",
    },
    {
      username: "state_ap",
      password: "Password@123",
      role: "STATE_LEADER",
      name: "AP State Leader",
      email: "state_ap@wmlrs.com",
      phoneNumber: "+91 98480 34567",
      state: "AP",
    },
    {
      username: "zone_1",
      password: "Password@123",
      role: "ZONE_LEADER",
      name: "Zone 1 Leader",
      email: "zone_1@wmlrs.com",
      phoneNumber: "+91 98480 45678",
      zone: "Zone-1",
    },
  ];

  for (const u of usersToCreate) {
    const existing = await prisma.user.findUnique({
      where: { username: u.username },
    });
    if (!existing) {
      const passwordHash = await bcrypt.hash(u.password, 10);
      
      const user = await prisma.user.create({
        data: {
          username: u.username,
          passwordHash: passwordHash,
          role: u.role as any,
          name: u.name,
          email: u.email,
          phoneNumber: u.phoneNumber,
          emailVerified: true,
          state: u.state || null,
          part: u.part || null,
          zone: u.zone || null,
        },
      });

      // Create corresponding Better Auth Account
      await prisma.account.create({
        data: {
          accountId: u.email,
          providerId: "credential",
          userId: user.id,
          password: passwordHash,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });
      console.log(`Created user ${u.username}`);
    } else {
      await prisma.user.update({
        where: { id: existing.id },
        data: {
          phoneNumber: u.phoneNumber,
        },
      });
      console.log(`Updated user ${u.username} with phone number ${u.phoneNumber}`);
    }
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
