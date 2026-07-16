import 'dotenv/config';
import { PrismaClient, UserRole } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';
import { Pool } from 'pg';

async function main(): Promise<void> {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter, log: ['warn', 'error'] });

  const existing = await prisma.user.findUnique({
    where: { email: 'superadmin@donorflow.app' },
  });

  if (existing) {
    console.log('Super admin already exists');
    await prisma.$disconnect();
    return;
  }

  const passwordHash = await bcrypt.hash('SuperAdmin123!', 12);

  await prisma.user.create({
    data: {
      email: 'superadmin@donorflow.app',
      passwordHash,
      name: 'Super Admin',
      role: UserRole.SUPER_ADMIN,
      isActive: true,
    },
  });

  console.log('Seeded super admin user');
  await prisma.$disconnect();
}

void main();
