'use client';

import { useState, useEffect } from 'react';
import { parseBulkStock, getStatusColor } from '@/lib/utils';

export default function AdminStockPage() {
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [stockText, setStockText] = useState('');
  const [preview, setPreview] = useState({ accounts: [], errors: [] });
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);

  const [stockList, setStockList] = useState([]);
  const [filterProduct, setFilterProduct] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
    fetchStock();
  }, []);

  async function fetchProducts() {
    try {
      const res = await fetch('/api/admin/products');
      const json = await res.json();
      if (res.ok && json.data) {
        setProducts(json.data.map(p => ({ id: p.id, name: p.name })));
      } else {
        setProducts([
          { id: '1', name: 'ChatGPT Pro' },
          { id: '2', name: 'Netflix Premium' },
          { id: '3', name: 'Canva Pro' },
        ]);
      }
    } catch (err) {
      console.error(err);
    }
  }

  async function fetchStock() {
    try {
      const res = await fetch('/api/admin/stock');
      const json = await res.json();
      if (res.ok && json.data) {
        setStockList(json.data);
      } else {
        setStockList([
          { id: 's1', email: 'user1@chatgpt.com', password: '***', status: 'available', product: { name: 'ChatGPT Pro' }, created_at: new Date().toISOString() },
          { id: 's2', email: 'user2@netflix.com', password: '***', status: 'sold', product: { name: 'Netflix Premium' }, created_at: new Date(Date.now() - 86400000).toISOString() },
          { id: 's3', email: 'user3@canva.com', password: '***', status: 'available', product: { name: 'Canva Pro' }, created_at: new Date(Date.now() - 172800000).toISOString() },
        ]);
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  }

  function handleTextChange(text) {
    setStockText(text);
    if (text.trim()) {
      setPreview(parseBulkStock(text));
    } else {
      setPreview({ accounts: [], errors: [] });
    }
    setUploadResult(null);
  }

  async function handleUpload() {
    if (!selectedProduct) {
      alert('Pilih produk terlebih dahulu');
      return;
    }
    if (preview.accounts.length === 0) {
      alert('Tidak ada akun yang valid untuk diupload');
      return;
    }

    setUploading(true);

    try {
      const res = await fetch('/api/admin/stock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: selectedProduct,
          accounts: preview.accounts,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        setUploadResult({ success: false, error: json.error });
      } else {
        setUploadResult({ success: true, count: json.count });
        setStockText('');
        setPreview({ accounts: [], errors: [] });
        fetchStock();
        fetchProducts(); // refresh stock counts
      }
    } catch (err) {
      setUploadResult({ success: false, error: err.message });
    }
    setUploading(false);
  }

  async function deleteStock(stockId) {
    if (!confirm('Yakin hapus stok ini?')) return;
    try {
      const res = await fetch(`/api/admin/stock?id=${stockId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        fetchStock();
        fetchProducts();
      }
    } catch (err) {
      console.error(err);
    }
  }

  async function bulkDeleteStock() {
    const product = products.find(p => p.name === filterProduct);
    if (!product) {
      alert('Pilih produk terlebih dahulu di filter');
      return;
    }
    const availableCount = stockList.filter(s => s.product?.name === filterProduct && s.status === 'available').length;
    if (availableCount === 0) {
      alert('Tidak ada stok available untuk dihapus');
      return;
    }
    if (!confirm(`Yakin hapus SEMUA ${availableCount} stok available untuk "${filterProduct}"?`)) return;
    try {
      const res = await fetch(`/api/admin/stock?productId=${product.id}`, {
        method: 'DELETE',
      });
      const json = await res.json();
      if (res.ok) {
        alert(`✅ Berhasil hapus ${json.count} stok`);
        fetchStock();
        fetchProducts();
      } else {
        alert(`❌ Gagal: ${json.error}`);
      }
    } catch (err) {
      console.error(err);
    }
  }

  const filteredStock = stockList.filter((s) => {
    if (filterProduct && s.product?.name !== filterProduct) return false;
    if (filterStatus && s.status !== filterStatus) return false;
    return true;
  });
  const availableInFilter = filterProduct
    ? stockList.filter(s => s.product?.name === filterProduct && s.status === 'available').length
    : 0;

  return (
    <div>
      <div className="admin-header">
        <div>
          <h1 className="admin-header__title">Stok Akun</h1>
          <p className="admin-header__subtitle">Upload dan kelola stok akun digital</p>
        </div>
      </div>

      {/* Bulk Upload Section */}
      <div className="card" style={{ marginBottom: 'var(--sp-8)' }}>
        <h3 style={{ fontSize: 'var(--text-18)', fontWeight: 'var(--weight-semibold)', marginBottom: 'var(--sp-5)' }}>
          📤 Upload Stok Massal
        </h3>

        <div className="form-group">
          <label className="form-label">Pilih Produk</label>
          <select
            className="form-input form-select"
            value={selectedProduct}
            onChange={(e) => setSelectedProduct(e.target.value)}
          >
            <option value="">-- Pilih Produk --</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">
            Paste Daftar Akun
            <span style={{ color: 'var(--text-tertiary)', fontWeight: 'var(--weight-normal)', marginLeft: 'var(--sp-2)' }}>
              (Format: email|password|info_tambahan)
            </span>
          </label>
          <textarea
            className="bulk-upload__textarea"
            placeholder={`contoh@mail.com|password123|recovery: rec@mail.com\nuser2@mail.com|pass456\nuser3@mail.com|pass789|PIN: 1234`}
            value={stockText}
            onChange={(e) => handleTextChange(e.target.value)}
          />
        </div>

        {/* Preview */}
        {(preview.accounts.length > 0 || preview.errors.length > 0) && (
          <div style={{ marginBottom: 'var(--sp-4)' }}>
            {preview.accounts.length > 0 && (
              <div style={{
                padding: 'var(--sp-3) var(--sp-4)',
                background: 'var(--accent-subtle)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--accent)',
                fontSize: 'var(--text-13)',
                marginBottom: 'var(--sp-2)',
              }}>
                ✓ {preview.accounts.length} akun siap diupload
              </div>
            )}
            {preview.errors.length > 0 && (
              <div style={{
                padding: 'var(--sp-3) var(--sp-4)',
                background: 'var(--danger-muted)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--danger)',
                fontSize: 'var(--text-13)',
              }}>
                {preview.errors.map((err, i) => (
                  <div key={i}>⚠️ {err}</div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Upload Result */}
        {uploadResult && (
          <div style={{
            padding: 'var(--sp-3) var(--sp-4)',
            background: uploadResult.success ? 'var(--accent-subtle)' : 'var(--danger-muted)',
            borderRadius: 'var(--radius-md)',
            color: uploadResult.success ? 'var(--accent)' : 'var(--danger)',
            fontSize: 'var(--text-13)',
            marginBottom: 'var(--sp-4)',
          }}>
            {uploadResult.success
              ? `✅ Berhasil upload ${uploadResult.count} akun!`
              : `❌ Gagal: ${uploadResult.error}`}
          </div>
        )}

        <button
          className={`btn btn--primary ${uploading ? 'btn--loading' : ''}`}
          onClick={handleUpload}
          disabled={uploading || preview.accounts.length === 0 || !selectedProduct}
        >
          {uploading ? '' : `Upload ${preview.accounts.length} Akun`}
        </button>
      </div>

      {/* Stock List */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--sp-5)', flexWrap: 'wrap', gap: 'var(--sp-3)' }}>
          <h3 style={{ fontSize: 'var(--text-18)', fontWeight: 'var(--weight-semibold)' }}>
            📋 Daftar Stok ({filteredStock.length})
          </h3>
          <div style={{ display: 'flex', gap: 'var(--sp-3)' }}>
            <select
              className="form-input form-select"
              value={filterProduct}
              onChange={(e) => setFilterProduct(e.target.value)}
              style={{ width: 'auto', fontSize: 'var(--text-13)', padding: '6px 30px 6px 10px' }}
            >
              <option value="">Semua Produk</option>
              {products.map((p) => (
                <option key={p.id} value={p.name}>{p.name}</option>
              ))}
            </select>
            <select
              className="form-input form-select"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              style={{ width: 'auto', fontSize: 'var(--text-13)', padding: '6px 30px 6px 10px' }}
            >
              <option value="">Semua Status</option>
              <option value="available">Available</option>
              <option value="sold">Sold</option>
            </select>
            {filterProduct && availableInFilter > 0 && (
              <button
                className="btn btn--danger btn--sm"
                onClick={bulkDeleteStock}
                title={`Hapus semua ${availableInFilter} stok available untuk ${filterProduct}`}
              >
                🗑️ Hapus Semua Available ({availableInFilter})
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="skeleton skeleton--card" style={{ height: '200px' }} />
        ) : filteredStock.length > 0 ? (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Produk</th>
                  <th>Status</th>
                  <th>Tanggal</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredStock.map((stock) => {
                  const statusColor = getStatusColor(stock.status);
                  return (
                    <tr key={stock.id}>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-12)' }}>
                        {stock.email}
                      </td>
                      <td>{stock.product?.name}</td>
                      <td>
                        <span
                          className="badge"
                          style={{ background: statusColor.bg, color: statusColor.text }}
                        >
                          {stock.status}
                        </span>
                      </td>
                      <td style={{ fontSize: 'var(--text-12)', color: 'var(--text-tertiary)' }}>
                        {new Date(stock.created_at).toLocaleDateString('id-ID')}
                      </td>
                      <td>
                        {stock.status === 'available' && (
                          <button className="btn btn--danger btn--sm" onClick={() => deleteStock(stock.id)}>
                            🗑️
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state" style={{ padding: 'var(--sp-8)' }}>
            <div className="empty-state__icon">🔑</div>
            <h3 className="empty-state__title">Belum ada stok</h3>
            <p className="empty-state__text">Upload stok akun di form di atas.</p>
          </div>
        )}
      </div>
    </div>
  );
}
