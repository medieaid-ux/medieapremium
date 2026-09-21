'use client';

import { useState, useEffect } from 'react';
import { formatPrice } from '@/lib/utils';

export default function AdminProductsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [form, setForm] = useState({
    name: '', slug: '', description: '', price: '', duration: '', category: '', icon_url: '', is_active: true,
  });
  const [saving, setSaving] = useState(false);

  const categories = ['AI Tools', 'Streaming', 'Design', 'Productivity', 'Education', 'Other'];

  useEffect(() => {
    fetchProducts();
  }, []);

  async function fetchProducts() {
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      if (!supabaseUrl || supabaseUrl === 'your_supabase_url') {
        setProducts([
          { id: '1', name: 'ChatGPT Pro', slug: 'chatgpt-pro', price: 95000, duration: '1 Bulan', category: 'AI Tools', is_active: true, stock_count: 24 },
          { id: '2', name: 'Netflix Premium', slug: 'netflix-premium', price: 45000, duration: '1 Bulan', category: 'Streaming', is_active: true, stock_count: 18 },
          { id: '3', name: 'Canva Pro', slug: 'canva-pro', price: 35000, duration: '1 Bulan', category: 'Design', is_active: true, stock_count: 32 },
        ]);
        setLoading(false);
        return;
      }
      const { createClientBrowser } = await import('@/lib/supabase');
      const supabase = createClientBrowser();
      const { data } = await supabase.from('products').select('*').order('created_at');
      setProducts(data || []);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  }

  function openAddModal() {
    setEditingProduct(null);
    setForm({ name: '', slug: '', description: '', price: '', duration: '', category: '', icon_url: '', is_active: true });
    setShowModal(true);
  }

  function openEditModal(product) {
    setEditingProduct(product);
    setForm({
      name: product.name,
      slug: product.slug,
      description: product.description || '',
      price: product.price.toString(),
      duration: product.duration || '',
      category: product.category || '',
      icon_url: product.icon_url || '',
      is_active: product.is_active,
    });
    setShowModal(true);
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);

    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      if (!supabaseUrl || supabaseUrl === 'your_supabase_url') {
        alert('Demo mode: Produk tidak bisa disimpan. Hubungkan Supabase terlebih dahulu.');
        setSaving(false);
        setShowModal(false);
        return;
      }

      const { createClientBrowser } = await import('@/lib/supabase');
      const supabase = createClientBrowser();

      const productData = {
        name: form.name,
        slug: form.slug || form.name.toLowerCase().replace(/\s+/g, '-'),
        description: form.description,
        price: parseInt(form.price),
        duration: form.duration,
        category: form.category,
        icon_url: form.icon_url || null,
        is_active: form.is_active,
      };

      if (editingProduct) {
        await supabase.from('products').update(productData).eq('id', editingProduct.id);
      } else {
        await supabase.from('products').insert(productData);
      }

      setShowModal(false);
      fetchProducts();
    } catch (err) {
      console.error(err);
      alert('Gagal menyimpan produk');
    }
    setSaving(false);
  }

  async function toggleActive(product) {
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      if (!supabaseUrl || supabaseUrl === 'your_supabase_url') return;

      const { createClientBrowser } = await import('@/lib/supabase');
      const supabase = createClientBrowser();
      await supabase.from('products').update({ is_active: !product.is_active }).eq('id', product.id);
      fetchProducts();
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <div>
      <div className="admin-header">
        <div>
          <h1 className="admin-header__title">Produk</h1>
          <p className="admin-header__subtitle">Kelola daftar produk digital</p>
        </div>
        <button className="btn btn--primary" onClick={openAddModal}>
          + Tambah Produk
        </button>
      </div>

      {loading ? (
        <div className="skeleton skeleton--card" />
      ) : products.length > 0 ? (
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Produk</th>
                <th>Kategori</th>
                <th>Harga</th>
                <th>Durasi</th>
                <th>Stok</th>
                <th>Status</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id}>
                  <td style={{ fontWeight: 'var(--fw-medium)' }}>{product.name}</td>
                  <td>
                    <span className="badge badge--info">{product.category}</span>
                  </td>
                  <td style={{ color: 'var(--accent)' }}>{formatPrice(product.price)}</td>
                  <td>{product.duration || '-'}</td>
                  <td>
                    <span className={`badge ${product.stock_count > 0 ? 'badge--success' : 'badge--danger'}`}>
                      {product.stock_count || 0}
                    </span>
                  </td>
                  <td>
                    <button
                      className={`badge ${product.is_active ? 'badge--success' : 'badge--neutral'}`}
                      onClick={() => toggleActive(product)}
                      style={{ cursor: 'pointer', border: 'none' }}
                    >
                      {product.is_active ? 'Aktif' : 'Nonaktif'}
                    </button>
                  </td>
                  <td>
                    <button className="btn btn--ghost btn--sm" onClick={() => openEditModal(product)}>
                      ✏️ Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="empty-state">
          <div className="empty-state__icon">📦</div>
          <h3 className="empty-state__title">Belum ada produk</h3>
          <p className="empty-state__text">Klik tombol "Tambah Produk" untuk mulai.</p>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal__header">
              <h3 className="modal__title">
                {editingProduct ? 'Edit Produk' : 'Tambah Produk Baru'}
              </h3>
              <button className="modal__close" onClick={() => setShowModal(false)}>
                ✕
              </button>
            </div>

            <form onSubmit={handleSave}>
              <div className="form-group">
                <label className="form-label">Nama Produk</label>
                <input
                  className="form-input"
                  placeholder="ChatGPT Pro"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Slug (URL)</label>
                <input
                  className="form-input"
                  placeholder="chatgpt-pro"
                  value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Deskripsi</label>
                <textarea
                  className="form-input form-textarea"
                  placeholder="Deskripsi singkat produk..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                <div className="form-group">
                  <label className="form-label">Harga (Rp)</label>
                  <input
                    className="form-input"
                    type="number"
                    placeholder="95000"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Durasi</label>
                  <input
                    className="form-input"
                    placeholder="1 Bulan"
                    value={form.duration}
                    onChange={(e) => setForm({ ...form, duration: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Kategori</label>
                <select
                  className="form-input form-select"
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                >
                  <option value="">Pilih kategori</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">URL Ikon (opsional)</label>
                <input
                  className="form-input"
                  placeholder="https://example.com/icon.png"
                  value={form.icon_url}
                  onChange={(e) => setForm({ ...form, icon_url: e.target.value })}
                />
              </div>

              <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                <input
                  type="checkbox"
                  id="is_active"
                  checked={form.is_active}
                  onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                  style={{ width: '18px', height: '18px', accentColor: 'var(--accent)' }}
                />
                <label htmlFor="is_active" className="form-label" style={{ margin: 0 }}>
                  Produk Aktif
                </label>
              </div>

              <button
                type="submit"
                className={`btn btn--primary btn--full ${saving ? 'btn--loading' : ''}`}
                disabled={saving}
              >
                {saving ? '' : editingProduct ? 'Simpan Perubahan' : 'Tambah Produk'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
