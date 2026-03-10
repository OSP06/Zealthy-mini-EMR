import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Clean existing data
  await prisma.prescription.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.user.deleteMany();

  const hash1 = await bcrypt.hash('Password123!', 10);

  const mark = await prisma.user.create({
    data: {
      name: 'Mark Johnson',
      email: 'mark@some-email-provider.net',
      password: hash1,
      appointments: {
        create: [
          {
            provider: 'Dr Kim West',
            datetime: new Date('2025-09-16T16:30:00.000-07:00'),
            repeat: 'weekly',
          },
          {
            provider: 'Dr Lin James',
            datetime: new Date('2025-09-19T18:30:00.000-07:00'),
            repeat: 'monthly',
          },
        ],
      },
      prescriptions: {
        create: [
          {
            medication: 'Lexapro',
            dosage: '5mg',
            quantity: 2,
            refillOn: new Date('2025-10-05'),
            refillSchedule: 'monthly',
          },
          {
            medication: 'Ozempic',
            dosage: '1mg',
            quantity: 1,
            refillOn: new Date('2025-10-10'),
            refillSchedule: 'monthly',
          },
        ],
      },
    },
  });

  const lisa = await prisma.user.create({
    data: {
      name: 'Lisa Smith',
      email: 'lisa@some-email-provider.net',
      password: hash1,
      appointments: {
        create: [
          {
            provider: 'Dr Sally Field',
            datetime: new Date('2025-09-22T18:15:00.000-07:00'),
            repeat: 'monthly',
          },
          {
            provider: 'Dr Lin James',
            datetime: new Date('2025-09-25T20:00:00.000-07:00'),
            repeat: 'weekly',
          },
        ],
      },
      prescriptions: {
        create: [
          {
            medication: 'Metformin',
            dosage: '500mg',
            quantity: 2,
            refillOn: new Date('2025-10-15'),
            refillSchedule: 'monthly',
          },
          {
            medication: 'Diovan',
            dosage: '100mg',
            quantity: 1,
            refillOn: new Date('2025-10-25'),
            refillSchedule: 'monthly',
          },
        ],
      },
    },
  });

  console.log('Seeded users:', mark.name, lisa.name);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
