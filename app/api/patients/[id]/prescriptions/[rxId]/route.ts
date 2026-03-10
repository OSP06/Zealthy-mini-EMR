import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string; rxId: string } }
) {
  try {
    const id = parseInt(params.rxId);
    if (isNaN(id)) return NextResponse.json({ error: 'Invalid prescription ID' }, { status: 400 });

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

    const existing = await prisma.prescription.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: 'Prescription not found' }, { status: 404 });

    const rx = await prisma.prescription.update({
      where: { id },
      data: {
        medication: medication.trim(),
        dosage: dosage.trim(),
        quantity: parsedQty,
        refillOn: parsedRefill,
        refillSchedule: refillSchedule || 'monthly',
      },
    });
    return NextResponse.json(rx);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string; rxId: string } }
) {
  try {
    const id = parseInt(params.rxId);
    if (isNaN(id)) return NextResponse.json({ error: 'Invalid prescription ID' }, { status: 400 });

    const existing = await prisma.prescription.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: 'Prescription not found' }, { status: 404 });

    await prisma.prescription.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string; rxId: string } }
) {
  try {
    const id = parseInt(params.rxId);
    if (isNaN(id)) return NextResponse.json({ error: 'Invalid prescription ID' }, { status: 400 });

    const body = await req.json();
    const { status, notes } = body;

    const validStatuses = ['active', 'discontinued', 'completed'];
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status. Must be active, discontinued, or completed' }, { status: 400 });
    }

    const existing = await prisma.prescription.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: 'Prescription not found' }, { status: 404 });

    const rx = await prisma.prescription.update({
      where: { id },
      data: { status, notes: notes || null },
    });
    return NextResponse.json(rx);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
