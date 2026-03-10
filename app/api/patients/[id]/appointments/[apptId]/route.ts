import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string; apptId: string } }
) {
  const id = parseInt(params.apptId);
  const body = await req.json();
  const { provider, datetime, repeat, endDate } = body;

  const appt = await prisma.appointment.update({
    where: { id },
    data: {
      provider,
      datetime: new Date(datetime),
      repeat,
      endDate: endDate ? new Date(endDate) : null,
    },
  });
  return NextResponse.json(appt);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string; apptId: string } }
) {
  const id = parseInt(params.apptId);
  await prisma.appointment.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
