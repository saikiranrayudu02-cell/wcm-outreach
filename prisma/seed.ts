import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

interface SeedUserData {
  username: string;
  password: string;
  role: Role;
  name: string;
  email: string;
  phoneNumber: string;
  state: string;
  zone: string;
  part: string;
}

const defaultUsers: SeedUserData[] = [
  {
    username: "admin",
    password: "Password@123",
    role: Role.ADMIN,
    name: "Rev. Dr. David Raj",
    email: "admin@wmlrs.com",
    phoneNumber: "+91 98480 12345",
    state: "National Headquarters",
    zone: "Central",
    part: "HQ",
  },
  {
    username: "coordinator",
    password: "Password@123",
    role: Role.COORDINATOR,
    name: "Pastor Samuel Joseph",
    email: "coordinator@wmlrs.com",
    phoneNumber: "+91 98480 23456",
    state: "Tamil Nadu",
    zone: "South",
    part: "Chennai",
  },
  {
    username: "zoneleader",
    password: "Password@123",
    role: Role.ZONE_LEADER,
    name: "Pastor John Timothy",
    email: "zoneleader@wmlrs.com",
    phoneNumber: "+91 98480 34567",
    state: "Tamil Nadu",
    zone: "South",
    part: "HQ",
  },
  {
    username: "stateleader",
    password: "Password@123",
    role: Role.STATE_LEADER,
    name: "Rev. Daniel Joshua",
    email: "stateleader@wmlrs.com",
    phoneNumber: "+91 98480 45678",
    state: "Tamil Nadu",
    zone: "South",
    part: "HQ",
  },
];

async function main() {
  console.log("🌱 Seeding standard system accounts (Admin, Coordinator, Zonal Leader, State Leader)...");

  for (const u of defaultUsers) {
    const passwordHash = await bcrypt.hash(u.password, 10);
    
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { username: u.username },
          { email: u.email }
        ]
      },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          username: u.username,
          passwordHash: passwordHash,
          role: u.role,
          name: u.name,
          email: u.email,
          phoneNumber: u.phoneNumber,
          emailVerified: true,
          state: u.state,
          part: u.part,
          zone: u.zone,
        },
      });

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

      console.log(`✓ Created account: ${u.username} (${u.role}) - ${u.email}`);
    } else {
      // Ensure user details and password hash are up to date
      await prisma.user.update({
        where: { id: user.id },
        data: {
          username: u.username,
          passwordHash: passwordHash,
          role: u.role,
          name: u.name,
          email: u.email,
          phoneNumber: u.phoneNumber,
          emailVerified: true,
          state: u.state,
          part: u.part,
          zone: u.zone,
        },
      });

      // Ensure Account record exists and has valid password hash
      const account = await prisma.account.findFirst({
        where: {
          userId: user.id,
          providerId: "credential",
        },
      });

      if (!account) {
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
      } else {
        await prisma.account.update({
          where: { id: account.id },
          data: {
            accountId: u.email,
            password: passwordHash,
            updatedAt: new Date(),
          },
        });
      }

      console.log(`✓ Updated / synchronized account: ${u.username} (${u.role}) - ${u.email}`);
    }
  }

  console.log("✅ Seeding completed: All 4 key role accounts are ready and active.");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

