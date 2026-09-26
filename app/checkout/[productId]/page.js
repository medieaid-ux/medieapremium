'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Script from 'next/script';
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
  const [form, setForm] = useState({ name: '', whatsapp: '', email: '', notes: '' });
  const [errors, setErrors] = useState({});
  const [snapReady, setSnapReady] = useState(false);

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
          buyerNotes: form.notes,
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

  const midtransClientKey = process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY;
  const hasMidtransKey = midtransClientKey && midtransClientKey !== 'your_client_key';
  // Detect production: production client keys DON'T contain 'SB'
  const isProduction = hasMidtransKey && !midtransClientKey.includes('SB');
  const snapUrl = isProduction
    ? 'https://app.midtrans.com/snap/snap.js'
    : 'https://app.sandbox.midtrans.com/snap/snap.js';

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
              <div className="empty-state__icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
              </div>
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

      {/* Midtrans Snap Script — using next/script for proper loading */}
      {hasMidtransKey && (
        <Script
          src={snapUrl}
          data-client-key={midtransClientKey}
          strategy="lazyOnload"
          onLoad={() => setSnapReady(true)}
        />
      )}

      <div className="checkout-page">
        <div className="container">
          <button
            className="btn btn--ghost mb-6"
            onClick={() => router.push('/')}
            style={{ marginBottom: 'var(--sp-6)' }}
          >
            ← Kembali
          </button>

          <div className="checkout-layout">
            {/* Checkout Form */}
            <div>
              <div className="card">
                <h2
                  style={{
                    fontSize: 'var(--text-20)',
                    fontWeight: 'var(--weight-semibold)',
                    marginBottom: 'var(--sp-6)',
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
                    <label className="form-label" htmlFor="notes">
                      Catatan <span style={{ color: 'var(--text-quaternary)', fontWeight: 'var(--weight-normal)' }}>(opsional)</span>
                    </label>
                    <textarea
                      id="notes"
                      className="form-input form-textarea"
                      placeholder="Tambahkan catatan atau permintaan khusus..."
                      value={form.notes}
                      onChange={(e) => setForm({ ...form, notes: e.target.value })}
                      rows={3}
                    />
                  </div>

                  <button
                    type="submit"
                    className={`btn btn--primary btn--full btn--lg ${submitting ? 'btn--loading' : ''}`}
                    disabled={submitting}
                    style={{ marginTop: 'var(--sp-4)' }}
                  >
                    {submitting ? '' : (<><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{marginRight:'8px'}}><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>Bayar Sekarang</>)}
                  </button>

                  <p
                    style={{
                      textAlign: 'center',
                      fontSize: 'var(--text-12)',
                      color: 'var(--text-tertiary)',
                      marginTop: 'var(--sp-3)',
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
                    fontSize: 'var(--text-13)',
                    fontWeight: 'var(--weight-semibold)',
                    color: 'var(--text-tertiary)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    marginBottom: 'var(--sp-5)',
                  }}
                >
                  Ringkasan Pesanan
                </h3>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--sp-4)',
                    marginBottom: 'var(--sp-5)',
                    paddingBottom: 'var(--sp-5)',
                    borderBottom: '1px solid var(--border)',
                  }}
                >
                  <div
                    style={{
                      width: '52px',
                      height: '52px',
                      borderRadius: 'var(--radius-lg)',
                      background: 'var(--bg-surface-2)',
                      border: '1px solid var(--border)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden',
                      flexShrink: 0,
                    }}
                  >
                    {product.icon_url ? (
                      <img src={product.icon_url} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <span style={{
                        fontSize: 'var(--text-11)',
                        fontWeight: 'var(--weight-bold)',
                        color: 'var(--accent)',
                        letterSpacing: '0.05em',
                      }}>
                        {product.name.slice(0, 2).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div>
                    <h4 style={{ fontSize: 'var(--text-16)', fontWeight: 'var(--weight-semibold)' }}>
                      {product.name}
                    </h4>
                    <p style={{ fontSize: 'var(--text-13)', color: 'var(--text-tertiary)' }}>
                      {product.duration || 'Sekali Pakai'}
                    </p>
                  </div>
                </div>

                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: 'var(--sp-3)',
                    fontSize: 'var(--text-13)',
                  }}
                >
                  <span style={{ color: 'var(--text-secondary)' }}>Harga</span>
                  <span>{formatPrice(product.price)}</span>
                </div>

                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: 'var(--sp-5)',
                    fontSize: 'var(--text-13)',
                  }}
                >
                  <span style={{ color: 'var(--text-secondary)' }}>Biaya Admin</span>
                  <span style={{ color: 'var(--accent)' }}>GRATIS</span>
                </div>

                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    paddingTop: 'var(--sp-4)',
                    borderTop: '1px solid var(--border)',
                    fontSize: 'var(--text-16)',
                    fontWeight: 'var(--weight-bold)',
                  }}
                >
                  <span>Total</span>
                  <span style={{ color: 'var(--accent)' }}>{formatPrice(product.price)}</span>
                </div>
              </div>

              {/* Trust Badges */}
              <div
                style={{
                  marginTop: 'var(--sp-5)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 'var(--sp-3)',
                }}
              >
                {[
                  { icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>, text: 'Pembayaran Aman (Midtrans)' },
                  { icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>, text: 'Pengiriman Instan Otomatis' },
                  { icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>, text: 'Kirim via Email & WhatsApp' },
                  { icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>, text: 'Garansi Akun' },
                ].map((badge, i) => (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'var(--sp-3)',
                      fontSize: 'var(--text-13)',
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
