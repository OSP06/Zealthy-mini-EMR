import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    if (isNaN(id)) return NextResponse.json({ error: 'Invalid patient ID' }, { status: 400 });

    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        appointments: { orderBy: { datetime: 'asc' } },
        prescriptions: { orderBy: { refillOn: 'asc' } },
      },
    });

    if (!user) return NextResponse.json({ error: 'Patient not found' }, { status: 404 });

    const { password, ...safe } = user;
    return NextResponse.json(safe);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    if (isNaN(id)) return NextResponse.json({ error: 'Invalid patient ID' }, { status: 400 });

    const body = await req.json();
    const { name, email, password, dateOfBirth, phone, address } = body;

    if (!name?.trim()) return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    if (!email?.trim()) return NextResponse.json({ error: 'Email is required' }, { status: 400 });

    // Check email not taken by a DIFFERENT patient
    const emailConflict = await prisma.user.findFirst({
      where: { email: email.trim(), NOT: { id } },
    });
    if (emailConflict) return NextResponse.json({ error: 'Email already in use by another patient' }, { status: 409 });

    const updateData: any = {
      name: name.trim(),
      email: email.trim(),
      dateOfBirth: dateOfBirth || null,
      phone: phone || null,
      address: address || null,
    };

    if (password?.trim()) {
      updateData.password = await bcrypt.hash(password.trim(), 10);
    }

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
    });

    const { password: _, ...safe } = user;
    return NextResponse.json(safe);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
