import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function GET() {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      _count: { select: { appointments: true, prescriptions: true } },
    },
  });
  // Strip passwords
  return NextResponse.json(
    users.map(({ password, ...u }) => u)
  );
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, password, dateOfBirth, phone, address } = body;

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Name, email, and password are required' }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: 'Email already in use' }, { status: 409 });
    }

    const hashed = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { name, email, password: hashed, dateOfBirth, phone, address },
    });

    const { password: _, ...safe } = user;
    return NextResponse.json(safe, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
