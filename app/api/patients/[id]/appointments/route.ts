import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
// appointments

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const userId = parseInt(params.id);
  const appointments = await prisma.appointment.findMany({
    where: { userId },
    orderBy: { datetime: 'asc' },
  });
  return NextResponse.json(appointments);
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const userId = parseInt(params.id);
  const body = await req.json();
  const { provider, datetime, repeat, endDate } = body;

  const appt = await prisma.appointment.create({
    data: {
      userId,
      provider,
      datetime: new Date(datetime),
      repeat: repeat || 'none',
      endDate: endDate ? new Date(endDate) : null,
    },
  });
  return NextResponse.json(appt, { status: 201 });
}
