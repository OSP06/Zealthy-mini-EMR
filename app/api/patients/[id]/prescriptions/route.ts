import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

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
  try {
    const userId = parseInt(params.id);
    if (isNaN(userId)) return NextResponse.json({ error: 'Invalid patient ID' }, { status: 400 });

    const body = await req.json();
    const { medication, dosage, quantity, refillOn, refillSchedule } = body;

    if (!medication?.trim()) return NextResponse.json({ error: 'Medication is required' }, { status: 400 });
    if (!dosage?.trim()) return NextResponse.json({ error: 'Dosage is required' }, { status: 400 });
    if (!refillOn) return NextResponse.json({ error: 'Refill date is required' }, { status: 400 });

    const parsedQty = parseInt(quantity);
    if (isNaN(parsedQty) || parsedQty < 1) return NextResponse.json({ error: 'Quantity must be a positive number' }, { status: 400 });

    const parsedRefill = new Date(refillOn);
    if (isNaN(parsedRefill.getTime())) return NextResponse.json({ error: 'Invalid refill date' }, { status: 400 });

    const validSchedules = ['weekly', 'monthly', 'quarterly'];
    if (refillSchedule && !validSchedules.includes(refillSchedule)) return NextResponse.json({ error: 'Invalid refill schedule' }, { status: 400 });

    const patient = await prisma.user.findUnique({ where: { id: userId } });
    if (!patient) return NextResponse.json({ error: 'Patient not found' }, { status: 404 });

    const rx = await prisma.prescription.create({
      data: {
        userId,
        medication: medication.trim(),
        dosage: dosage.trim(),
        quantity: parsedQty,
        refillOn: parsedRefill,
        refillSchedule: refillSchedule || 'monthly',
      },
    });
    return NextResponse.json(rx, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
