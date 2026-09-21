import { NextResponse } from 'next/server';
import { createClientServer } from '@/lib/supabase';
import { verifySignature } from '@/lib/midtrans';
import { sendAccountEmail } from '@/lib/resend';
import { sendAccountWhatsApp } from '@/lib/fonnte';

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      order_id,
      transaction_status,
      fraud_status,
      status_code,
      gross_amount,
      signature_key,
      payment_type,
      transaction_id,
    } = body;

    console.log(`[Webhook] Order: ${order_id}, Status: ${transaction_status}, Payment: ${payment_type}`);

    // Verify signature
    const isValid = verifySignature({
      orderId: order_id,
      statusCode: status_code,
      grossAmount: gross_amount,
      signatureKey: signature_key,
    });

    if (!isValid) {
      console.error('[Webhook] Invalid signature for order:', order_id);
      return NextResponse.json({ error: 'Invalid signature' }, { status: 403 });
    }

    const supabase = createClientServer();

    // Payment success: settlement or capture (for credit card)
    if (
      transaction_status === 'settlement' ||
      (transaction_status === 'capture' && fraud_status === 'accept')
    ) {
      // Fetch the order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .select('*, product:products(*)')
        .eq('midtrans_order_id', order_id)
        .single();

      if (orderError || !order) {
        console.error('[Webhook] Order not found:', order_id);
        return NextResponse.json({ error: 'Order not found' }, { status: 404 });
      }

      // Skip if already delivered
      if (order.status === 'delivered') {
        console.log('[Webhook] Order already delivered:', order_id);
        return NextResponse.json({ message: 'Already delivered' });
      }

      // Update order to paid
      await supabase
        .from('orders')
        .update({
          status: 'paid',
          paid_at: new Date().toISOString(),
          midtrans_transaction_id: transaction_id,
          payment_type: payment_type,
        })
        .eq('id', order.id);

      // Claim stock using RPC (atomic, anti-collision)
      const { data: stockData, error: stockError } = await supabase.rpc('claim_stock', {
        p_product_id: order.product_id,
        p_order_id: order.id,
      });

      if (stockError) {
        console.error('[Webhook] Stock claim error:', stockError);
        // Mark order as paid but not delivered (needs manual intervention)
        await supabase
          .from('orders')
          .update({ status: 'paid' })
          .eq('id', order.id);
        return NextResponse.json({ message: 'Paid but stock unavailable' });
      }

      const claimed = stockData[0];

      // Update order with delivered account data
      await supabase
        .from('orders')
        .update({
          status: 'delivered',
          account_stock_id: claimed.stock_id,
          delivered_email: claimed.account_email,
          delivered_password: claimed.account_password,
          delivered_extra: claimed.account_extra,
          delivered_at: new Date().toISOString(),
        })
        .eq('id', order.id);

      // Send notifications (async, don't block response)
      const notifyPromises = [];

      // Send email
      notifyPromises.push(
        sendAccountEmail({
          to: order.buyer_email,
          buyerName: order.buyer_name,
          productName: order.product?.name || 'Akun Premium',
          email: claimed.account_email,
          password: claimed.account_password,
          extra: claimed.account_extra,
          orderNumber: order.order_number,
        }).catch((err) => console.error('[Webhook] Email error:', err))
      );

      // Send WhatsApp
      notifyPromises.push(
        sendAccountWhatsApp({
          phone: order.buyer_whatsapp,
          buyerName: order.buyer_name,
          productName: order.product?.name || 'Akun Premium',
          email: claimed.account_email,
          password: claimed.account_password,
          extra: claimed.account_extra,
          orderNumber: order.order_number,
        }).catch((err) => console.error('[Webhook] WhatsApp error:', err))
      );

      await Promise.allSettled(notifyPromises);

      console.log(`[Webhook] ✅ Order ${order_id} delivered successfully`);
      return NextResponse.json({ message: 'OK - Delivered' });
    }

    // Payment expired
    if (transaction_status === 'expire') {
      await supabase
        .from('orders')
        .update({ status: 'expired' })
        .eq('midtrans_order_id', order_id);

      console.log(`[Webhook] ⏰ Order ${order_id} expired`);
      return NextResponse.json({ message: 'OK - Expired' });
    }

    // Payment failed/cancelled/denied
    if (['cancel', 'deny', 'failure'].includes(transaction_status)) {
      await supabase
        .from('orders')
        .update({ status: 'failed' })
        .eq('midtrans_order_id', order_id);

      console.log(`[Webhook] ❌ Order ${order_id} failed: ${transaction_status}`);
      return NextResponse.json({ message: `OK - ${transaction_status}` });
    }

    // Pending or other status
    console.log(`[Webhook] ⏳ Order ${order_id} status: ${transaction_status}`);
    return NextResponse.json({ message: `OK - ${transaction_status}` });
  } catch (err) {
    console.error('[Webhook] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
