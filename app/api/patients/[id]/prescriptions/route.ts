import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
// prescriptions 
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const userId = parseInt(params.id);
  const prescriptions = await prisma.prescription.findMany({
    where: { userId },
    orderBy: { refillOn: 'asc' },
  });
  return NextResponse.json(prescriptions);
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const userId = parseInt(params.id);
  const body = await req.json();
  const { medication, dosage, quantity, refillOn, refillSchedule } = body;

  const rx = await prisma.prescription.create({
    data: {
      userId,
      medication,
      dosage,
      quantity: parseInt(quantity),
      refillOn: new Date(refillOn),
      refillSchedule: refillSchedule || 'monthly',
    },
  });
  return NextResponse.json(rx, { status: 201 });
}
