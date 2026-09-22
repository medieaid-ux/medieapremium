import { NextResponse } from 'next/server';
import { createClientServer } from '@/lib/supabase';

export async function GET() {
  try {
    const supabase = createClientServer();
    const { data, error } = await supabase
      .from('orders')
      .select('*, product:products(name)')
      .order('created_at', { ascending: false })
      .limit(200);

    if (error) {
      console.error('Fetch orders error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (err) {
    console.error('Orders GET error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
