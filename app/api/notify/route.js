import { NextResponse } from 'next/server';
import { createClientServer } from '@/lib/supabase';
import { sendAccountEmail } from '@/lib/resend';
import { sendAccountWhatsApp } from '@/lib/fonnte';

export async function POST(request) {
  try {
    const body = await request.json();
    const { orderId } = body;

    if (!orderId) {
      return NextResponse.json({ error: 'orderId wajib diisi' }, { status: 400 });
    }

    const supabase = createClientServer();

    const { data: order, error } = await supabase
      .from('orders')
      .select('*, product:products(*)')
      .eq('id', orderId)
      .eq('status', 'delivered')
      .single();

    if (error || !order) {
      return NextResponse.json({ error: 'Order tidak ditemukan atau belum delivered' }, { status: 404 });
    }

    const results = { email: null, whatsapp: null };

    // Resend email
    results.email = await sendAccountEmail({
      to: order.buyer_email,
      buyerName: order.buyer_name,
      productName: order.product?.name || 'Akun Premium',
      email: order.delivered_email,
      password: order.delivered_password,
      extra: order.delivered_extra,
      orderNumber: order.order_number,
    });

    // Resend WhatsApp
    results.whatsapp = await sendAccountWhatsApp({
      phone: order.buyer_whatsapp,
      buyerName: order.buyer_name,
      productName: order.product?.name || 'Akun Premium',
      email: order.delivered_email,
      password: order.delivered_password,
      extra: order.delivered_extra,
      orderNumber: order.order_number,
    });

    return NextResponse.json({ message: 'Notifikasi terkirim', results });
  } catch (err) {
    console.error('Notify error:', err);
    return NextResponse.json({ error: 'Gagal mengirim notifikasi' }, { status: 500 });
  }
}
