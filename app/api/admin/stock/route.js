import { NextResponse } from 'next/server';
import { createClientServer } from '@/lib/supabase';

export async function GET() {
  try {
    const supabase = createClientServer();
    const { data, error } = await supabase
      .from('account_stock')
      .select('*, product:products(name)')
      .order('created_at', { ascending: false })
      .limit(200);

    if (error) {
      console.error('Fetch stock error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (err) {
    console.error('Stock GET error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { productId, accounts } = body;

    if (!productId) {
      return NextResponse.json({ error: 'Product ID wajib' }, { status: 400 });
    }

    if (!accounts || accounts.length === 0) {
      return NextResponse.json({ error: 'Tidak ada akun untuk diupload' }, { status: 400 });
    }

    const supabase = createClientServer();

    const { data, error } = await supabase.rpc('bulk_insert_stock', {
      p_product_id: productId,
      p_accounts: accounts,
    });

    if (error) {
      console.error('Bulk insert stock error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ count: data });
  } catch (err) {
    console.error('Stock POST error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const stockId = searchParams.get('id');
    const productId = searchParams.get('productId');

    const supabase = createClientServer();

    // Bulk delete all available stock for a product
    if (productId) {
      const { data: count, error } = await supabase.rpc('bulk_delete_available_stock', {
        p_product_id: productId,
      });

      if (error) {
        console.error('Bulk delete stock error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ success: true, count });
    }

    // Single delete
    if (!stockId) {
      return NextResponse.json({ error: 'Stock ID atau Product ID wajib' }, { status: 400 });
    }

    // First, get the stock item to know its product_id
    const { data: stockItem, error: fetchError } = await supabase
      .from('account_stock')
      .select('id, product_id')
      .eq('id', stockId)
      .eq('status', 'available')
      .single();

    if (fetchError || !stockItem) {
      return NextResponse.json({ error: 'Stok tidak ditemukan atau sudah terjual' }, { status: 404 });
    }

    // Delete the stock item
    const { error } = await supabase
      .from('account_stock')
      .delete()
      .eq('id', stockId)
      .eq('status', 'available');

    if (error) {
      console.error('Delete stock error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Decrement stock_count on the product
    await supabase.rpc('decrement_stock_count', { p_product_id: stockItem.product_id });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Stock DELETE error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

