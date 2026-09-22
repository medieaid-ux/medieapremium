import { NextResponse } from 'next/server';
import { createClientServer } from '@/lib/supabase';
import { createSnapTransaction } from '@/lib/midtrans';
import { generateOrderNumber } from '@/lib/utils';

export async function POST(request) {
  try {
    const body = await request.json();
    const { productId, buyerName, buyerEmail, buyerWhatsapp, buyerNotes } = body;

    // Validate input
    if (!productId || !buyerName || !buyerEmail || !buyerWhatsapp) {
      return NextResponse.json(
        { error: 'Semua field wajib diisi' },
        { status: 400 }
      );
    }

    const supabase = createClientServer();

    // Fetch product
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('*')
      .eq('id', productId)
      .eq('is_active', true)
      .single();

    if (productError || !product) {
      return NextResponse.json(
        { error: 'Produk tidak ditemukan atau tidak aktif' },
        { status: 404 }
      );
    }

    // Check stock
    const { count } = await supabase
      .from('account_stock')
      .select('*', { count: 'exact', head: true })
      .eq('product_id', productId)
      .eq('status', 'available');

    if (!count || count === 0) {
      return NextResponse.json(
        { error: 'Maaf, stok untuk produk ini sedang habis' },
        { status: 400 }
      );
    }

    // Generate order number
    const orderNumber = generateOrderNumber();

    // Create order record
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        order_number: orderNumber,
        product_id: productId,
        buyer_name: buyerName,
        buyer_email: buyerEmail,
        buyer_whatsapp: buyerWhatsapp,
        buyer_notes: buyerNotes || null,
        amount: product.price,
        status: 'pending',
        midtrans_order_id: orderNumber,
      })
      .select()
      .single();

    if (orderError) {
      console.error('Order creation error:', orderError);
      return NextResponse.json(
        { error: 'Gagal membuat pesanan. Silakan coba lagi.' },
        { status: 500 }
      );
    }

    // Create Midtrans Snap transaction
    const snapResult = await createSnapTransaction({
      orderId: orderNumber,
      amount: product.price,
      productName: product.name,
      buyer: {
        name: buyerName,
        email: buyerEmail,
        whatsapp: buyerWhatsapp,
      },
    });

    // Save snap token to order
    await supabase
      .from('orders')
      .update({ snap_token: snapResult.token })
      .eq('id', order.id);

    return NextResponse.json({
      snapToken: snapResult.token,
      redirectUrl: snapResult.redirect_url,
      orderId: order.id,
      orderNumber: orderNumber,
    });
  } catch (err) {
    console.error('Create transaction error:', err);
    return NextResponse.json(
      { error: 'Terjadi kesalahan server. Silakan coba lagi.' },
      { status: 500 }
    );
  }
}
