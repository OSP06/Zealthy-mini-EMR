import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

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
  try {
    const userId = parseInt(params.id);
    if (isNaN(userId)) return NextResponse.json({ error: 'Invalid patient ID' }, { status: 400 });

    const body = await req.json();
    const { provider, datetime, repeat, endDate } = body;

    if (!provider?.trim()) return NextResponse.json({ error: 'Provider name is required' }, { status: 400 });
    if (!datetime) return NextResponse.json({ error: 'Date and time is required' }, { status: 400 });

    const parsedDate = new Date(datetime);
    if (isNaN(parsedDate.getTime())) return NextResponse.json({ error: 'Invalid date/time format' }, { status: 400 });

    const validRepeats = ['none', 'daily', 'weekly', 'monthly'];
    if (repeat && !validRepeats.includes(repeat)) return NextResponse.json({ error: 'Invalid repeat value' }, { status: 400 });

    // Check patient exists
    const patient = await prisma.user.findUnique({ where: { id: userId } });
    if (!patient) return NextResponse.json({ error: 'Patient not found' }, { status: 404 });

    const appt = await prisma.appointment.create({
      data: {
        userId,
        provider: provider.trim(),
        datetime: parsedDate,
        repeat: repeat || 'none',
        endDate: endDate ? new Date(endDate) : null,
      },
    });
    return NextResponse.json(appt, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
