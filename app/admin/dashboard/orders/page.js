'use client';

import { useState, useEffect } from 'react';
import { formatPrice, getRelativeTime, getStatusColor } from '@/lib/utils';

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

  async function fetchOrders() {
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      if (!supabaseUrl || supabaseUrl === 'your_supabase_url') {
        setOrders([
          {
            id: '1', order_number: 'MP-20260920-AB1CD', buyer_name: 'Ahmad Fadli', buyer_email: 'ahmad@mail.com',
            buyer_whatsapp: '081234567890', amount: 95000, status: 'delivered', payment_type: 'qris',
            delivered_email: 'akun@chatgpt.com', delivered_password: 'Pass123!',
            created_at: new Date().toISOString(), paid_at: new Date().toISOString(),
            product: { name: 'ChatGPT Pro' },
          },
          {
            id: '2', order_number: 'MP-20260920-EF2GH', buyer_name: 'Siti Rahma', buyer_email: 'siti@mail.com',
            buyer_whatsapp: '082345678901', amount: 45000, status: 'delivered', payment_type: 'bank_transfer',
            delivered_email: 'akun@netflix.com', delivered_password: 'Net456!',
            created_at: new Date(Date.now() - 3600000).toISOString(), paid_at: new Date(Date.now() - 3500000).toISOString(),
            product: { name: 'Netflix Premium' },
          },
          {
            id: '3', order_number: 'MP-20260920-IJ3KL', buyer_name: 'Budi Santoso', buyer_email: 'budi@mail.com',
            buyer_whatsapp: '083456789012', amount: 35000, status: 'pending', payment_type: null,
            created_at: new Date(Date.now() - 7200000).toISOString(),
            product: { name: 'Canva Pro' },
          },
        ]);
        setLoading(false);
        return;
      }

      const { createClientBrowser } = await import('@/lib/supabase');
      const supabase = createClientBrowser();
      const { data } = await supabase
        .from('orders')
        .select('*, product:products(name)')
        .order('created_at', { ascending: false })
        .limit(100);

      setOrders(data || []);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  }

  async function resendNotification(orderId) {
    setResending(true);
    try {
      const res = await fetch('/api/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId }),
      });
      const data = await res.json();
      if (res.ok) {
        alert('✅ Notifikasi berhasil dikirim ulang!');
      } else {
        alert(`❌ Gagal: ${data.error}`);
      }
    } catch (err) {
      alert('❌ Terjadi kesalahan');
    }
    setResending(false);
  }

  const filteredOrders = filterStatus
    ? orders.filter((o) => o.status === filterStatus)
    : orders;

  const statusOptions = ['pending', 'paid', 'delivered', 'expired', 'failed'];

  return (
    <div>
      <div className="admin-header">
        <div>
          <h1 className="admin-header__title">Pesanan</h1>
          <p className="admin-header__subtitle">Riwayat semua transaksi</p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <button
            className={`category-btn ${filterStatus === '' ? 'category-btn--active' : ''}`}
            onClick={() => setFilterStatus('')}
          >
            Semua ({orders.length})
          </button>
          {statusOptions.map((status) => {
            const count = orders.filter((o) => o.status === status).length;
            if (count === 0) return null;
            return (
              <button
                key={status}
                className={`category-btn ${filterStatus === status ? 'category-btn--active' : ''}`}
                onClick={() => setFilterStatus(status)}
              >
                {status} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {loading ? (
        <div className="skeleton skeleton--card" style={{ height: '400px' }} />
      ) : filteredOrders.length > 0 ? (
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Order</th>
                <th>Pembeli</th>
                <th>Produk</th>
                <th>Jumlah</th>
                <th>Bayar</th>
                <th>Status</th>
                <th>Waktu</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order) => {
                const statusColor = getStatusColor(order.status);
                return (
                  <tr key={order.id}>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--fs-xs)' }}>
                      {order.order_number}
                    </td>
                    <td>
                      <div style={{ fontWeight: 'var(--fw-medium)' }}>{order.buyer_name}</div>
                      <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-tertiary)' }}>{order.buyer_email}</div>
                    </td>
                    <td>{order.product?.name}</td>
                    <td style={{ color: 'var(--accent)', fontWeight: 'var(--fw-medium)' }}>
                      {formatPrice(order.amount)}
                    </td>
                    <td>
                      {order.payment_type ? (
                        <span className="badge badge--info">{order.payment_type}</span>
                      ) : (
                        <span style={{ color: 'var(--text-tertiary)' }}>-</span>
                      )}
                    </td>
                    <td>
                      <span className="badge" style={{ background: statusColor.bg, color: statusColor.text }}>
                        {order.status}
                      </span>
                    </td>
                    <td style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-tertiary)', whiteSpace: 'nowrap' }}>
                      {getRelativeTime(order.created_at)}
                    </td>
                    <td>
                      <button
                        className="btn btn--ghost btn--sm"
                        onClick={() => setSelectedOrder(order)}
                      >
                        👁️
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="empty-state">
          <div className="empty-state__icon">🧾</div>
          <h3 className="empty-state__title">Belum ada pesanan</h3>
          <p className="empty-state__text">Pesanan akan muncul di sini setelah ada transaksi.</p>
        </div>
      )}

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="modal-overlay" onClick={() => setSelectedOrder(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '550px' }}>
            <div className="modal__header">
              <h3 className="modal__title">Detail Pesanan</h3>
              <button className="modal__close" onClick={() => setSelectedOrder(null)}>✕</button>
            </div>

            <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
              <InfoRow label="Order Number" value={selectedOrder.order_number} mono />
              <InfoRow label="Status">
                <span className="badge" style={{
                  background: getStatusColor(selectedOrder.status).bg,
                  color: getStatusColor(selectedOrder.status).text,
                }}>
                  {selectedOrder.status}
                </span>
              </InfoRow>
              <InfoRow label="Produk" value={selectedOrder.product?.name} />
              <InfoRow label="Jumlah" value={formatPrice(selectedOrder.amount)} accent />
              <InfoRow label="Pembeli" value={selectedOrder.buyer_name} />
              <InfoRow label="Email" value={selectedOrder.buyer_email} />
              <InfoRow label="WhatsApp" value={selectedOrder.buyer_whatsapp} />
              {selectedOrder.payment_type && (
                <InfoRow label="Metode Bayar" value={selectedOrder.payment_type} />
              )}
              {selectedOrder.paid_at && (
                <InfoRow label="Dibayar" value={new Date(selectedOrder.paid_at).toLocaleString('id-ID')} />
              )}

              {selectedOrder.status === 'delivered' && (
                <>
                  <div style={{ borderTop: '1px solid var(--border)', paddingTop: 'var(--space-4)' }}>
                    <h4 style={{ fontSize: 'var(--fs-sm)', fontWeight: 'var(--fw-semibold)', color: 'var(--accent)', marginBottom: 'var(--space-3)' }}>
                      Akun Yang Dikirim
                    </h4>
                    <InfoRow label="Email Akun" value={selectedOrder.delivered_email} mono />
                    <div style={{ marginTop: 'var(--space-2)' }}>
                      <InfoRow label="Password" value={selectedOrder.delivered_password} mono />
                    </div>
                    {selectedOrder.delivered_extra && (
                      <div style={{ marginTop: 'var(--space-2)' }}>
                        <InfoRow label="Info Tambahan" value={selectedOrder.delivered_extra} />
                      </div>
                    )}
                  </div>

                  <button
                    className={`btn btn--secondary btn--full btn--sm ${resending ? 'btn--loading' : ''}`}
                    onClick={() => resendNotification(selectedOrder.id)}
                    disabled={resending}
                  >
                    {resending ? '' : '📩 Kirim Ulang Notifikasi'}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function InfoRow({ label, value, mono, accent, children }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 'var(--fs-sm)' }}>
      <span style={{ color: 'var(--text-tertiary)' }}>{label}</span>
      {children || (
        <span style={{
          fontFamily: mono ? 'var(--font-mono)' : 'inherit',
          color: accent ? 'var(--accent)' : 'var(--text-primary)',
          fontSize: mono ? 'var(--fs-xs)' : 'inherit',
        }}>
          {value}
        </span>
      )}
    </div>
  );
}
