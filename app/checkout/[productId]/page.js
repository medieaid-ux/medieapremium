'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { formatPrice, isValidEmail, isValidWhatsApp } from '@/lib/utils';

// Demo product for fallback
const DEMO_PRODUCTS = {
  '1': { id: '1', name: 'ChatGPT Pro', price: 95000, duration: '1 Bulan', category: 'AI Tools', stock_count: 24, description: 'Akses penuh ke GPT-4o, DALL-E 3, dan semua fitur premium OpenAI.' },
  '2': { id: '2', name: 'Netflix Premium', price: 45000, duration: '1 Bulan', category: 'Streaming', stock_count: 18, description: 'Streaming film & series tanpa batas dalam kualitas Ultra HD 4K.' },
  '3': { id: '3', name: 'Canva Pro', price: 35000, duration: '1 Bulan', category: 'Design', stock_count: 32, description: 'Desain grafis profesional dengan 100+ juta template premium.' },
  '4': { id: '4', name: 'Zoom Pro', price: 55000, duration: '1 Bulan', category: 'Productivity', stock_count: 3, description: 'Meeting tanpa batas waktu, recording cloud, fitur kolaborasi.' },
  '5': { id: '5', name: 'Spotify Premium', price: 25000, duration: '1 Bulan', category: 'Streaming', stock_count: 40, description: 'Streaming musik tanpa iklan, download offline.' },
  '6': { id: '6', name: 'YouTube Premium', price: 30000, duration: '1 Bulan', category: 'Streaming', stock_count: 0, description: 'Nonton tanpa iklan, download video.' },
  '7': { id: '7', name: 'Grammarly Premium', price: 65000, duration: '1 Bulan', category: 'AI Tools', stock_count: 12, description: 'AI writing assistant terbaik.' },
  '8': { id: '8', name: 'Figma Professional', price: 75000, duration: '1 Bulan', category: 'Design', stock_count: 8, description: 'Kolaborasi desain UI/UX real-time.' },
  '9': { id: '9', name: 'Notion Plus', price: 40000, duration: '1 Bulan', category: 'Productivity', stock_count: 15, description: 'Workspace all-in-one.' },
};

export default function CheckoutPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params.productId;

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', whatsapp: '' });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    async function fetchProduct() {
      try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        if (supabaseUrl && supabaseUrl !== 'your_supabase_url') {
          const { createClientBrowser } = await import('@/lib/supabase');
          const supabase = createClientBrowser();
          const { data } = await supabase
            .from('products')
            .select('*')
            .eq('id', productId)
            .single();
          if (data) {
            setProduct(data);
            setLoading(false);
            return;
          }
        }
      } catch (err) {
        console.log('Fallback to demo:', err.message);
      }
      // Fallback to demo
      setProduct(DEMO_PRODUCTS[productId] || null);
      setLoading(false);
    }
    fetchProduct();
  }, [productId]);

  const validate = () => {
    const newErrors = {};
    if (!form.name.trim()) newErrors.name = 'Nama lengkap wajib diisi';
    if (!form.email.trim()) newErrors.email = 'Email wajib diisi';
    else if (!isValidEmail(form.email)) newErrors.email = 'Format email tidak valid';
    if (!form.whatsapp.trim()) newErrors.whatsapp = 'Nomor WhatsApp wajib diisi';
    else if (!isValidWhatsApp(form.whatsapp)) newErrors.whatsapp = 'Nomor WhatsApp tidak valid';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);

    try {
      const res = await fetch('/api/midtrans/create-transaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product.id,
          buyerName: form.name,
          buyerEmail: form.email,
          buyerWhatsapp: form.whatsapp,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || 'Terjadi kesalahan. Silakan coba lagi.');
        setSubmitting(false);
        return;
      }

      // Open Midtrans Snap
      if (window.snap) {
        window.snap.pay(data.snapToken, {
          onSuccess: () => {
            router.push(`/success/${data.orderId}`);
          },
          onPending: () => {
            router.push(`/success/${data.orderId}`);
          },
          onError: () => {
            alert('Pembayaran gagal. Silakan coba lagi.');
            setSubmitting(false);
          },
          onClose: () => {
            setSubmitting(false);
          },
        });
      } else {
        // Fallback: redirect to Midtrans payment page
        if (data.redirectUrl) {
          window.location.href = data.redirectUrl;
        } else {
          alert('Snap tidak tersedia. Pastikan koneksi internet stabil.');
          setSubmitting(false);
        }
      }
    } catch (err) {
      console.error('Checkout error:', err);
      alert('Terjadi kesalahan. Silakan coba lagi.');
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="checkout-page">
          <div className="container">
            <div className="checkout-layout">
              <div className="skeleton skeleton--card" style={{ height: '400px' }} />
              <div className="skeleton skeleton--card" style={{ height: '300px' }} />
            </div>
          </div>
        </div>
      </>
    );
  }

  if (!product) {
    return (
      <>
        <Navbar />
        <div className="checkout-page">
          <div className="container">
            <div className="empty-state">
              <div className="empty-state__icon">🔍</div>
              <h3 className="empty-state__title">Produk tidak ditemukan</h3>
              <p className="empty-state__text">Produk yang kamu cari tidak tersedia.</p>
              <button className="btn btn--primary mt-6" onClick={() => router.push('/')}>
                ← Kembali ke Katalog
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />

      {/* Midtrans Snap Script */}
      <script
        src={
          process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY && process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY !== 'your_client_key'
            ? 'https://app.sandbox.midtrans.com/snap/snap.js'
            : ''
        }
        data-client-key={process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || ''}
        async
      />

      <div className="checkout-page">
        <div className="container">
          <button
            className="btn btn--ghost mb-6"
            onClick={() => router.push('/')}
            style={{ marginBottom: 'var(--space-6)' }}
          >
            ← Kembali
          </button>

          <div className="checkout-layout">
            {/* Checkout Form */}
            <div>
              <div className="card">
                <h2
                  style={{
                    fontSize: 'var(--fs-xl)',
                    fontWeight: 'var(--fw-semibold)',
                    marginBottom: 'var(--space-6)',
                  }}
                >
                  Data Pembeli
                </h2>

                <form onSubmit={handleSubmit}>
                  <div className="form-group">
                    <label className="form-label" htmlFor="name">
                      Nama Lengkap
                    </label>
                    <input
                      id="name"
                      type="text"
                      className={`form-input ${errors.name ? 'form-input--error' : ''}`}
                      placeholder="Masukkan nama lengkap"
                      value={form.name}
                      onChange={(e) => {
                        setForm({ ...form, name: e.target.value });
                        if (errors.name) setErrors({ ...errors, name: '' });
                      }}
                    />
                    {errors.name && <p className="form-error">{errors.name}</p>}
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="email">
                      Email
                    </label>
                    <input
                      id="email"
                      type="email"
                      className={`form-input ${errors.email ? 'form-input--error' : ''}`}
                      placeholder="contoh@email.com"
                      value={form.email}
                      onChange={(e) => {
                        setForm({ ...form, email: e.target.value });
                        if (errors.email) setErrors({ ...errors, email: '' });
                      }}
                    />
                    {errors.email && <p className="form-error">{errors.email}</p>}
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="whatsapp">
                      Nomor WhatsApp
                    </label>
                    <input
                      id="whatsapp"
                      type="tel"
                      className={`form-input ${errors.whatsapp ? 'form-input--error' : ''}`}
                      placeholder="08xxxxxxxxxx"
                      value={form.whatsapp}
                      onChange={(e) => {
                        setForm({ ...form, whatsapp: e.target.value });
                        if (errors.whatsapp) setErrors({ ...errors, whatsapp: '' });
                      }}
                    />
                    {errors.whatsapp && <p className="form-error">{errors.whatsapp}</p>}
                  </div>

                  <button
                    type="submit"
                    className={`btn btn--primary btn--full btn--lg ${submitting ? 'btn--loading' : ''}`}
                    disabled={submitting}
                    style={{ marginTop: 'var(--space-4)' }}
                  >
                    {submitting ? '' : '🔒 Bayar Sekarang'}
                  </button>

                  <p
                    style={{
                      textAlign: 'center',
                      fontSize: 'var(--fs-xs)',
                      color: 'var(--text-tertiary)',
                      marginTop: 'var(--space-3)',
                    }}
                  >
                    Pembayaran diproses secara aman oleh Midtrans
                  </p>
                </form>
              </div>
            </div>

            {/* Order Summary */}
            <div className="checkout-summary">
              <div className="card">
                <h3
                  style={{
                    fontSize: 'var(--fs-sm)',
                    fontWeight: 'var(--fw-semibold)',
                    color: 'var(--text-tertiary)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    marginBottom: 'var(--space-5)',
                  }}
                >
                  Ringkasan Pesanan
                </h3>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-4)',
                    marginBottom: 'var(--space-5)',
                    paddingBottom: 'var(--space-5)',
                    borderBottom: '1px solid var(--border)',
                  }}
                >
                  <div
                    style={{
                      width: '52px',
                      height: '52px',
                      borderRadius: 'var(--radius-lg)',
                      background: 'var(--bg-tertiary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.5rem',
                    }}
                  >
                    {product.category === 'AI Tools'
                      ? '🤖'
                      : product.category === 'Streaming'
                      ? '🎬'
                      : product.category === 'Design'
                      ? '🎨'
                      : '⚡'}
                  </div>
                  <div>
                    <h4 style={{ fontSize: 'var(--fs-lg)', fontWeight: 'var(--fw-semibold)' }}>
                      {product.name}
                    </h4>
                    <p style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-tertiary)' }}>
                      {product.duration || 'Sekali Pakai'}
                    </p>
                  </div>
                </div>

                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: 'var(--space-3)',
                    fontSize: 'var(--fs-sm)',
                  }}
                >
                  <span style={{ color: 'var(--text-secondary)' }}>Harga</span>
                  <span>{formatPrice(product.price)}</span>
                </div>

                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: 'var(--space-5)',
                    fontSize: 'var(--fs-sm)',
                  }}
                >
                  <span style={{ color: 'var(--text-secondary)' }}>Biaya Admin</span>
                  <span style={{ color: 'var(--accent)' }}>GRATIS</span>
                </div>

                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    paddingTop: 'var(--space-4)',
                    borderTop: '1px solid var(--border)',
                    fontSize: 'var(--fs-lg)',
                    fontWeight: 'var(--fw-bold)',
                  }}
                >
                  <span>Total</span>
                  <span style={{ color: 'var(--accent)' }}>{formatPrice(product.price)}</span>
                </div>
              </div>

              {/* Trust Badges */}
              <div
                style={{
                  marginTop: 'var(--space-5)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 'var(--space-3)',
                }}
              >
                {[
                  { icon: '🔒', text: 'Pembayaran Aman (Midtrans)' },
                  { icon: '⚡', text: 'Pengiriman Instan Otomatis' },
                  { icon: '📧', text: 'Kirim via Email & WhatsApp' },
                  { icon: '🛡️', text: 'Garansi Akun' },
                ].map((badge) => (
                  <div
                    key={badge.text}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'var(--space-3)',
                      fontSize: 'var(--fs-sm)',
                      color: 'var(--text-secondary)',
                    }}
                  >
                    <span>{badge.icon}</span>
                    <span>{badge.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
