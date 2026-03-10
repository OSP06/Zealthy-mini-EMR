import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = parseInt(params.id);
  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      appointments: { orderBy: { datetime: 'asc' } },
      prescriptions: { orderBy: { refillOn: 'asc' } },
    },
  });

  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const { password, ...safe } = user;
  return NextResponse.json(safe);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = parseInt(params.id);
  const body = await req.json();
  const { name, email, password, dateOfBirth, phone, address } = body;

  const updateData: any = { name, email, dateOfBirth, phone, address };
  if (password) {
    updateData.password = await bcrypt.hash(password, 10);
  }

  const user = await prisma.user.update({
    where: { id },
    data: updateData,
  });

  const { password: _, ...safe } = user;
  return NextResponse.json(safe);
}
