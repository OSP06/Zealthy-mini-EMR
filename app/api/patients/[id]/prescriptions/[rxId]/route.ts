import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string; rxId: string } }
) {
  const id = parseInt(params.rxId);
  const body = await req.json();
  const { medication, dosage, quantity, refillOn, refillSchedule } = body;

  const rx = await prisma.prescription.update({
    where: { id },
    data: {
      medication,
      dosage,
      quantity: parseInt(quantity),
      refillOn: new Date(refillOn),
      refillSchedule,
    },
  });
  return NextResponse.json(rx);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string; rxId: string } }
) {
  const id = parseInt(params.rxId);
  await prisma.prescription.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
