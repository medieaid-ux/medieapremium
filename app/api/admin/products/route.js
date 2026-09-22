import { NextResponse } from 'next/server';
import { createClientServer } from '@/lib/supabase';

export async function GET() {
  try {
    const supabase = createClientServer();
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at');

    if (error) {
      console.error('Fetch products error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (err) {
    console.error('Products GET error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const supabase = createClientServer();
    const contentType = request.headers.get('content-type') || '';

    let productData;
    let iconFile = null;

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      productData = {
        name: formData.get('name'),
        slug: formData.get('slug') || formData.get('name')?.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
        description: formData.get('description') || null,
        price: parseInt(formData.get('price')),
        duration: formData.get('duration') || null,
        category: formData.get('category') || null,
        is_active: formData.get('is_active') === 'true',
      };
      iconFile = formData.get('icon_file');
    } else {
      const body = await request.json();
      productData = {
        name: body.name,
        slug: body.slug || body.name?.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
        description: body.description || null,
        price: parseInt(body.price),
        duration: body.duration || null,
        category: body.category || null,
        icon_url: body.icon_url || null,
        is_active: body.is_active !== false,
      };
    }

    if (!productData.name || !productData.price) {
      return NextResponse.json({ error: 'Nama dan harga wajib diisi' }, { status: 400 });
    }

    // Upload icon if provided
    if (iconFile && iconFile.size > 0) {
      const iconUrl = await uploadIcon(supabase, iconFile, productData.slug);
      if (iconUrl) {
        productData.icon_url = iconUrl;
      }
    }

    const { data, error } = await supabase
      .from('products')
      .insert(productData)
      .select()
      .single();

    if (error) {
      console.error('Insert product error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (err) {
    console.error('Products POST error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const supabase = createClientServer();
    const contentType = request.headers.get('content-type') || '';

    let productId;
    let productData;
    let iconFile = null;

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      productId = formData.get('id');
      productData = {
        name: formData.get('name'),
        slug: formData.get('slug') || formData.get('name')?.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
        description: formData.get('description') || null,
        price: parseInt(formData.get('price')),
        duration: formData.get('duration') || null,
        category: formData.get('category') || null,
        is_active: formData.get('is_active') === 'true',
        updated_at: new Date().toISOString(),
      };
      iconFile = formData.get('icon_file');
      // Keep existing icon_url if no new file
      const existingIconUrl = formData.get('existing_icon_url');
      if (!iconFile || iconFile.size === 0) {
        productData.icon_url = existingIconUrl || null;
      }
    } else {
      const body = await request.json();
      productId = body.id;
      productData = {
        name: body.name,
        slug: body.slug || body.name?.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
        description: body.description || null,
        price: parseInt(body.price),
        duration: body.duration || null,
        category: body.category || null,
        icon_url: body.icon_url || null,
        is_active: body.is_active !== false,
        updated_at: new Date().toISOString(),
      };
    }

    if (!productId) {
      return NextResponse.json({ error: 'Product ID wajib' }, { status: 400 });
    }

    // Upload icon if provided
    if (iconFile && iconFile.size > 0) {
      const slug = productData.slug || productId;
      const iconUrl = await uploadIcon(supabase, iconFile, slug);
      if (iconUrl) {
        productData.icon_url = iconUrl;
      }
    }

    const { data, error } = await supabase
      .from('products')
      .update(productData)
      .eq('id', productId)
      .select()
      .single();

    if (error) {
      console.error('Update product error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (err) {
    console.error('Products PUT error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const body = await request.json();
    const { id, is_active } = body;

    if (!id) {
      return NextResponse.json({ error: 'Product ID wajib' }, { status: 400 });
    }

    const supabase = createClientServer();
    const { data, error } = await supabase
      .from('products')
      .update({ is_active, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Toggle product error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (err) {
    console.error('Products PATCH error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function uploadIcon(supabase, file, slug) {
  try {
    const ext = file.name?.split('.').pop() || 'png';
    const fileName = `${slug}-${Date.now()}.${ext}`;
    const filePath = `icons/${fileName}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { data, error } = await supabase.storage
      .from('product-icons')
      .upload(filePath, buffer, {
        contentType: file.type || 'image/png',
        upsert: true,
      });

    if (error) {
      console.error('Upload icon error:', error);
      // If bucket doesn't exist, try creating it
      if (error.message?.includes('not found') || error.statusCode === 404) {
        console.log('Bucket not found, attempting to create...');
        await supabase.storage.createBucket('product-icons', {
          public: true,
          fileSizeLimit: 2097152, // 2MB
          allowedMimeTypes: ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml', 'image/gif'],
        });
        // Retry upload
        const { data: retryData, error: retryError } = await supabase.storage
          .from('product-icons')
          .upload(filePath, buffer, {
            contentType: file.type || 'image/png',
            upsert: true,
          });
        if (retryError) {
          console.error('Retry upload error:', retryError);
          return null;
        }
      } else {
        return null;
      }
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('product-icons')
      .getPublicUrl(filePath);

    return urlData?.publicUrl || null;
  } catch (err) {
    console.error('Upload icon exception:', err);
    return null;
  }
}
