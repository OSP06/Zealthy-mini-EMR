import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string; apptId: string } }
) {
  try {
    const id = parseInt(params.apptId);
    if (isNaN(id)) return NextResponse.json({ error: 'Invalid appointment ID' }, { status: 400 });

    const body = await req.json();
    const { provider, datetime, repeat, endDate } = body;

    if (!provider?.trim()) return NextResponse.json({ error: 'Provider name is required' }, { status: 400 });
    if (!datetime) return NextResponse.json({ error: 'Date and time is required' }, { status: 400 });

    const parsedDate = new Date(datetime);
    if (isNaN(parsedDate.getTime())) return NextResponse.json({ error: 'Invalid date format' }, { status: 400 });

    const validRepeats = ['none', 'daily', 'weekly', 'monthly'];
    if (repeat && !validRepeats.includes(repeat)) return NextResponse.json({ error: 'Invalid repeat value' }, { status: 400 });

    const existing = await prisma.appointment.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });

    const appt = await prisma.appointment.update({
      where: { id },
      data: {
        provider: provider.trim(),
        datetime: parsedDate,
        repeat: repeat || 'none',
        endDate: endDate ? new Date(endDate) : null,
      },
    });
    return NextResponse.json(appt);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string; apptId: string } }
) {
  try {
    const id = parseInt(params.apptId);
    if (isNaN(id)) return NextResponse.json({ error: 'Invalid appointment ID' }, { status: 400 });

    const existing = await prisma.appointment.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });

    await prisma.appointment.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string; apptId: string } }
) {
  try {
    const id = parseInt(params.apptId);
    if (isNaN(id)) return NextResponse.json({ error: 'Invalid appointment ID' }, { status: 400 });

    const body = await req.json();
    const { status, notes } = body;

    const validStatuses = ['active', 'completed', 'cancelled'];
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status. Must be active, completed, or cancelled' }, { status: 400 });
    }

    const existing = await prisma.appointment.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });

    const appt = await prisma.appointment.update({
      where: { id },
      data: { status, notes: notes || null },
    });
    return NextResponse.json(appt);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
