'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { formatPrice } from '@/lib/utils';

export default function SuccessPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.orderId;

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copiedField, setCopiedField] = useState(null);
  const [polling, setPolling] = useState(false);

  useEffect(() => {
    let interval;

    async function fetchOrder() {
      try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        if (!supabaseUrl || supabaseUrl === 'your_supabase_url') {
          // Demo mode
          setOrder({
            id: orderId,
            order_number: 'MP-20260920-DEMO1',
            status: 'delivered',
            buyer_name: 'Demo User',
            buyer_email: 'demo@test.com',
            delivered_email: 'akun.premium@demo.com',
            delivered_password: 'P@ssw0rd!Demo',
            delivered_extra: 'Recovery: recovery@demo.com',
            product: { name: 'ChatGPT Pro', price: 95000 },
            paid_at: new Date().toISOString(),
          });
          setLoading(false);
          return;
        }

        const { createClientBrowser } = await import('@/lib/supabase');
        const supabase = createClientBrowser();
        const { data, error } = await supabase
          .from('orders')
          .select('*, product:products(*)')
          .eq('id', orderId)
          .single();

        if (data) {
          setOrder(data);
          setLoading(false);

          // If still pending/paid, poll for delivery
          if (data.status === 'pending' || data.status === 'paid') {
            setPolling(true);
          } else {
            setPolling(false);
            if (interval) clearInterval(interval);
          }
        } else {
          setLoading(false);
        }
      } catch (err) {
        console.error('Fetch order error:', err);
        setLoading(false);
      }
    }

    fetchOrder();

    // Poll every 3 seconds if payment is pending
    interval = setInterval(fetchOrder, 3000);

    // Stop polling after 5 minutes
    const timeout = setTimeout(() => {
      if (interval) clearInterval(interval);
      setPolling(false);
    }, 300000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [orderId]);

  const copyToClipboard = async (text, field) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch {
      // Fallback
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="success-page">
          <div className="success-card card">
            <div className="skeleton" style={{ width: '80px', height: '80px', borderRadius: '50%', margin: '0 auto var(--space-6)' }} />
            <div className="skeleton skeleton--title" style={{ margin: '0 auto var(--space-3)' }} />
            <div className="skeleton skeleton--text" style={{ width: '80%', margin: '0 auto' }} />
          </div>
        </div>
      </>
    );
  }

  if (!order) {
    return (
      <>
        <Navbar />
        <div className="success-page">
          <div className="card success-card">
            <div className="empty-state">
              <div className="empty-state__icon">🔍</div>
              <h3 className="empty-state__title">Pesanan tidak ditemukan</h3>
              <p className="empty-state__text">ID pesanan yang kamu cari tidak valid.</p>
              <button className="btn btn--primary mt-6" onClick={() => router.push('/')}>
                ← Kembali ke Katalog
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  const isDelivered = order.status === 'delivered';
  const isPending = order.status === 'pending';
  const isPaid = order.status === 'paid';

  return (
    <>
      <Navbar />

      <div className="success-page">
        <div className="success-card">
          <div className="card">
            {isDelivered ? (
              <>
                {/* Success State */}
                <div className="success-icon">✅</div>
                <h1 style={{ fontSize: 'var(--fs-2xl)', fontWeight: 'var(--fw-bold)', marginBottom: 'var(--space-2)' }}>
                  Pembayaran Berhasil!
                </h1>
                <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--fs-sm)', marginBottom: 'var(--space-2)' }}>
                  Halo <strong>{order.buyer_name}</strong>, berikut data akun kamu:
                </p>
                <p style={{ color: 'var(--text-tertiary)', fontSize: 'var(--fs-xs)' }}>
                  Order: {order.order_number}
                </p>

                {/* Account Credentials */}
                <div className="account-box">
                  <div className="account-field">
                    <div className="account-field__label">Email / Username</div>
                    <div className="account-field__value">
                      <span style={{ wordBreak: 'break-all' }}>{order.delivered_email}</span>
                      <button
                        className={`account-field__copy-btn ${copiedField === 'email' ? 'account-field__copy-btn--copied' : ''}`}
                        onClick={() => copyToClipboard(order.delivered_email, 'email')}
                      >
                        {copiedField === 'email' ? '✓' : '📋'}
                      </button>
                    </div>
                  </div>

                  <div className="account-field">
                    <div className="account-field__label">Password</div>
                    <div className="account-field__value">
                      <span style={{ wordBreak: 'break-all' }}>{order.delivered_password}</span>
                      <button
                        className={`account-field__copy-btn ${copiedField === 'password' ? 'account-field__copy-btn--copied' : ''}`}
                        onClick={() => copyToClipboard(order.delivered_password, 'password')}
                      >
                        {copiedField === 'password' ? '✓' : '📋'}
                      </button>
                    </div>
                  </div>

                  {order.delivered_extra && (
                    <div className="account-field">
                      <div className="account-field__label">Info Tambahan</div>
                      <div className="account-field__value">
                        <span style={{ wordBreak: 'break-all' }}>{order.delivered_extra}</span>
                        <button
                          className={`account-field__copy-btn ${copiedField === 'extra' ? 'account-field__copy-btn--copied' : ''}`}
                          onClick={() => copyToClipboard(order.delivered_extra, 'extra')}
                        >
                          {copiedField === 'extra' ? '✓' : '📋'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Notification info */}
                <div
                  style={{
                    marginTop: 'var(--space-5)',
                    padding: 'var(--space-4)',
                    background: 'var(--accent-glow)',
                    borderRadius: 'var(--radius-lg)',
                    fontSize: 'var(--fs-sm)',
                    color: 'var(--accent)',
                    textAlign: 'center',
                  }}
                >
                  📧 Data akun juga sudah dikirim ke Email & WhatsApp kamu
                </div>

                {/* Warning */}
                <div
                  style={{
                    marginTop: 'var(--space-4)',
                    padding: 'var(--space-4)',
                    background: 'var(--danger-bg)',
                    borderRadius: 'var(--radius-lg)',
                    fontSize: 'var(--fs-xs)',
                    color: 'var(--danger)',
                    textAlign: 'center',
                  }}
                >
                  ⚠️ Jangan bagikan data akun ini kepada siapapun. Screenshot halaman ini sebagai bukti.
                </div>
              </>
            ) : isPending || isPaid ? (
              <>
                {/* Waiting State */}
                <div className="success-icon" style={{ background: 'var(--warning-bg)' }}>
                  ⏳
                </div>
                <h1 style={{ fontSize: 'var(--fs-2xl)', fontWeight: 'var(--fw-bold)', marginBottom: 'var(--space-2)' }}>
                  {isPending ? 'Menunggu Pembayaran...' : 'Memproses Pesanan...'}
                </h1>
                <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--fs-sm)' }}>
                  {isPending
                    ? 'Silakan selesaikan pembayaran. Halaman ini akan otomatis berubah begitu pembayaran diterima.'
                    : 'Pembayaran sudah diterima! Sedang memproses pengiriman akun...'}
                </p>
                {polling && (
                  <div style={{ marginTop: 'var(--space-4)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-2)' }}>
                    <div style={{
                      width: '8px', height: '8px', borderRadius: '50%',
                      background: 'var(--accent)', animation: 'pulse 1s infinite'
                    }} />
                    <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-tertiary)' }}>
                      Memantau status pembayaran...
                    </span>
                  </div>
                )}
              </>
            ) : (
              <>
                {/* Failed/Expired State */}
                <div className="success-icon" style={{ background: 'var(--danger-bg)' }}>
                  ❌
                </div>
                <h1 style={{ fontSize: 'var(--fs-2xl)', fontWeight: 'var(--fw-bold)', marginBottom: 'var(--space-2)' }}>
                  Pembayaran {order.status === 'expired' ? 'Kedaluwarsa' : 'Gagal'}
                </h1>
                <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--fs-sm)' }}>
                  Silakan coba lagi atau hubungi kami jika butuh bantuan.
                </p>
              </>
            )}

            {/* Back Button */}
            <button
              className="btn btn--secondary btn--full mt-6"
              onClick={() => router.push('/')}
            >
              ← Kembali ke Katalog
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
