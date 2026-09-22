'use client';

import { useState, useEffect, useRef } from 'react';
import { formatPrice } from '@/lib/utils';

export default function AdminProductsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [form, setForm] = useState({
    name: '', slug: '', description: '', price: '', duration: '', category: '', icon_url: '', is_active: true,
  });
  const [iconFile, setIconFile] = useState(null);
  const [iconPreview, setIconPreview] = useState(null);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef(null);

  const categories = ['AI Tools', 'Streaming', 'Design', 'Productivity', 'Education', 'Other'];

  useEffect(() => {
    fetchProducts();
  }, []);

  async function fetchProducts() {
    try {
      const res = await fetch('/api/admin/products');
      const json = await res.json();
      if (res.ok && json.data) {
        setProducts(json.data);
      } else {
        // Fallback demo
        setProducts([
          { id: '1', name: 'ChatGPT Pro', slug: 'chatgpt-pro', price: 95000, duration: '1 Bulan', category: 'AI Tools', is_active: true, stock_count: 24 },
          { id: '2', name: 'Netflix Premium', slug: 'netflix-premium', price: 45000, duration: '1 Bulan', category: 'Streaming', is_active: true, stock_count: 18 },
          { id: '3', name: 'Canva Pro', slug: 'canva-pro', price: 35000, duration: '1 Bulan', category: 'Design', is_active: true, stock_count: 32 },
        ]);
      }
    } catch (err) {
      console.error(err);
      setProducts([]);
    }
    setLoading(false);
  }

  function openAddModal() {
    setEditingProduct(null);
    setForm({ name: '', slug: '', description: '', price: '', duration: '', category: '', icon_url: '', is_active: true });
    setIconFile(null);
    setIconPreview(null);
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
    setIconFile(null);
    setIconPreview(product.icon_url || null);
    setShowModal(true);
  }

  function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert('Ukuran file maksimal 2MB');
        return;
      }
      setIconFile(file);
      const reader = new FileReader();
      reader.onload = (ev) => setIconPreview(ev.target.result);
      reader.readAsDataURL(file);
    }
  }

  function removeIcon() {
    setIconFile(null);
    setIconPreview(null);
    setForm({ ...form, icon_url: '' });
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);

    try {
      const formData = new FormData();
      formData.append('name', form.name);
      formData.append('slug', form.slug || form.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''));
      formData.append('description', form.description);
      formData.append('price', form.price);
      formData.append('duration', form.duration);
      formData.append('category', form.category);
      formData.append('is_active', form.is_active.toString());

      if (iconFile) {
        formData.append('icon_file', iconFile);
      }

      if (editingProduct) {
        formData.append('id', editingProduct.id);
        formData.append('existing_icon_url', form.icon_url || '');

        const res = await fetch('/api/admin/products', {
          method: 'PUT',
          body: formData,
        });
        const json = await res.json();
        if (!res.ok) {
          alert(`Gagal update: ${json.error}`);
          setSaving(false);
          return;
        }
      } else {
        const res = await fetch('/api/admin/products', {
          method: 'POST',
          body: formData,
        });
        const json = await res.json();
        if (!res.ok) {
          alert(`Gagal tambah: ${json.error}`);
          setSaving(false);
          return;
        }
      }

      setShowModal(false);
      setIconFile(null);
      setIconPreview(null);
      fetchProducts();
    } catch (err) {
      console.error(err);
      alert('Gagal menyimpan produk');
    }
    setSaving(false);
  }

  async function toggleActive(product) {
    try {
      const res = await fetch('/api/admin/products', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: product.id, is_active: !product.is_active }),
      });
      if (res.ok) {
        fetchProducts();
      }
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
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-3)' }}>
                      <div style={{
                        width: '32px', height: '32px', borderRadius: 'var(--radius-md)',
                        background: 'var(--bg-surface-2)', border: '1px solid var(--border)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        overflow: 'hidden', flexShrink: 0,
                      }}>
                        {product.icon_url ? (
                          <img src={product.icon_url} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <span style={{ fontSize: 'var(--text-11)', fontWeight: 'var(--weight-semibold)', color: 'var(--text-tertiary)' }}>
                            {product.name.slice(0, 2).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <span style={{ fontWeight: 'var(--weight-medium)' }}>{product.name}</span>
                    </div>
                  </td>
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
          <p className="empty-state__text">Klik tombol &quot;Tambah Produk&quot; untuk mulai.</p>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px' }}>
            <div className="modal__header">
              <h3 className="modal__title">
                {editingProduct ? 'Edit Produk' : 'Tambah Produk Baru'}
              </h3>
              <button className="modal__close" onClick={() => setShowModal(false)}>
                ✕
              </button>
            </div>

            <form onSubmit={handleSave}>
              {/* Icon Upload */}
              <div className="form-group">
                <label className="form-label">Ikon / Gambar Produk</label>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 'var(--sp-4)',
                }}>
                  <div style={{
                    width: '64px', height: '64px', borderRadius: 'var(--radius-lg)',
                    background: 'var(--bg-surface-2)', border: '2px dashed var(--border-hover)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    overflow: 'hidden', flexShrink: 0, position: 'relative',
                    cursor: 'pointer',
                  }} onClick={() => fileInputRef.current?.click()}>
                    {iconPreview ? (
                      <img src={iconPreview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" style={{ color: 'var(--text-quaternary)' }}>
                        <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                      </svg>
                    )}
                  </div>
                  <div style={{ flex: 1 }}>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/svg+xml,image/gif"
                      onChange={handleFileChange}
                      style={{ display: 'none' }}
                    />
                    <div style={{ display: 'flex', gap: 'var(--sp-2)' }}>
                      <button
                        type="button"
                        className="btn btn--secondary btn--sm"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        📷 Upload Gambar
                      </button>
                      {iconPreview && (
                        <button
                          type="button"
                          className="btn btn--danger btn--sm"
                          onClick={removeIcon}
                        >
                          🗑️ Hapus
                        </button>
                      )}
                    </div>
                    <p style={{ fontSize: 'var(--text-11)', color: 'var(--text-quaternary)', marginTop: 'var(--sp-1)' }}>
                      PNG, JPG, WebP, SVG. Maks 2MB.
                    </p>
                  </div>
                </div>
              </div>

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

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--sp-4)' }}>
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

              <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-3)' }}>
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
