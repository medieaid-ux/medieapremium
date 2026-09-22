'use client';

import { useState, useEffect, useRef } from 'react';
import Navbar from '@/components/Navbar';
import ProductCard from '@/components/ProductCard';

const DEMO_PRODUCTS = [
  { id: '1', name: 'ChatGPT Pro', slug: 'chatgpt-pro', description: 'Akses penuh ke GPT-4o, DALL-E 3, dan semua fitur premium OpenAI tanpa batasan.', price: 95000, duration: '1 Bulan', category: 'AI Tools', is_active: true, stock_count: 24 },
  { id: '2', name: 'Netflix Premium', slug: 'netflix-premium', description: 'Streaming film & series tanpa batas dalam kualitas Ultra HD 4K. Akses semua konten.', price: 45000, duration: '1 Bulan', category: 'Streaming', is_active: true, stock_count: 18 },
  { id: '3', name: 'Canva Pro', slug: 'canva-pro', description: 'Desain grafis profesional dengan 100+ juta template, foto, dan elemen premium.', price: 35000, duration: '1 Bulan', category: 'Design', is_active: true, stock_count: 32 },
  { id: '4', name: 'Zoom Pro', slug: 'zoom-pro', description: 'Meeting tanpa batas waktu, recording cloud, dan fitur kolaborasi lengkap.', price: 55000, duration: '1 Bulan', category: 'Productivity', is_active: true, stock_count: 3 },
  { id: '5', name: 'Spotify Premium', slug: 'spotify-premium', description: 'Streaming musik tanpa iklan, download offline, dan kualitas audio terbaik.', price: 25000, duration: '1 Bulan', category: 'Streaming', is_active: true, stock_count: 40 },
  { id: '6', name: 'YouTube Premium', slug: 'youtube-premium', description: 'Nonton tanpa iklan, download video, dan akses YouTube Music Premium.', price: 30000, duration: '1 Bulan', category: 'Streaming', is_active: true, stock_count: 0 },
  { id: '7', name: 'Grammarly Premium', slug: 'grammarly-premium', description: 'Periksa tata bahasa, tone, dan plagiarisme dengan AI writing assistant terbaik.', price: 65000, duration: '1 Bulan', category: 'AI Tools', is_active: true, stock_count: 12 },
  { id: '8', name: 'Figma Professional', slug: 'figma-pro', description: 'Kolaborasi desain UI/UX real-time dengan unlimited projects dan version history.', price: 75000, duration: '1 Bulan', category: 'Design', is_active: true, stock_count: 8 },
  { id: '9', name: 'Notion Plus', slug: 'notion-plus', description: 'Workspace all-in-one untuk catatan, proyek, database, dan kolaborasi tim.', price: 40000, duration: '1 Bulan', category: 'Productivity', is_active: true, stock_count: 15 },
];

const CATEGORIES = ['Semua', 'AI Tools', 'Streaming', 'Design', 'Productivity'];

export default function HomePage() {
  const [category, setCategory] = useState('Semua');
  const [products, setProducts] = useState(DEMO_PRODUCTS);
  const [loading, setLoading] = useState(false);
  const revealRefs = useRef([]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add('reveal--visible'); }),
      { threshold: 0.1 }
    );
    revealRefs.current.forEach((ref) => { if (ref) observer.observe(ref); });
    return () => observer.disconnect();
  }, [products, category]);

  useEffect(() => {
    async function fetchProducts() {
      try {
        const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
        if (!url || url === 'your_supabase_url') return;
        const { createClientBrowser } = await import('@/lib/supabase');
        const supabase = createClientBrowser();
        const { data } = await supabase.from('products').select('*').eq('is_active', true).order('created_at');
        if (data?.length > 0) setProducts(data);
      } catch (err) { /* use demo */ }
    }
    fetchProducts();
  }, []);

  const filteredProducts = category === 'Semua' ? products : products.filter((p) => p.category === category);

  return (
    <>
      <Navbar />

      {/* ─── Hero ─── */}
      <section className="hero">
        <div className="container">

          <h1 className="hero__title">
            Akses Layanan Digital Premium Secara{' '}
            <span className="hero__title-highlight">Instan dan Terpercaya</span>
          </h1>

          <p className="hero__subtitle">
            Dapatkan akses ke berbagai platform premium untuk kebutuhan hiburan dan produktivitas Anda.
            Selesaikan pembayaran dan terima detail akun dalam hitungan detik melalui sistem otomatis kami,
            tanpa perlu menunggu konfirmasi manual.
          </p>

          <div className="hero__stats">
            <div className="hero__stat">
              <div className="hero__stat-value">500+</div>
              <div className="hero__stat-label">Transaksi Berhasil</div>
            </div>
            <div className="hero__stat">
              <div className="hero__stat-value">&lt;30s</div>
              <div className="hero__stat-label">Waktu Pengiriman</div>
            </div>
            <div className="hero__stat">
              <div className="hero__stat-value">99.9%</div>
              <div className="hero__stat-label">Uptime Layanan</div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Products ─── */}
      <section className="products-section" id="produk">
        <div className="container">
          <div className="categories">
            {CATEGORIES.map((cat) => (
              <button key={cat} className={`category-btn ${category === cat ? 'category-btn--active' : ''}`} onClick={() => setCategory(cat)}>
                {cat}
              </button>
            ))}
          </div>

          {filteredProducts.length > 0 ? (
            <div className="products-grid">
              {filteredProducts.map((product, index) => (
                <div key={product.id} className="reveal" ref={(el) => (revealRefs.current[index] = el)} style={{ transitionDelay: `${index * 0.03}s` }}>
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-state__icon">—</div>
              <h3 className="empty-state__title">Belum ada produk</h3>
              <p className="empty-state__text">Produk untuk kategori ini belum tersedia.</p>
            </div>
          )}
        </div>
      </section>

      {/* ─── How It Works ─── */}
      <section style={{ padding: 'var(--sp-20) 0', borderTop: '1px solid var(--border)' }} id="cara-kerja">
        <div className="container" style={{ maxWidth: '800px' }}>
          <p style={{
            fontSize: 'var(--text-11)', fontWeight: 'var(--weight-medium)', color: 'var(--text-quaternary)',
            letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 'var(--sp-3)', textAlign: 'center',
          }}>
            Cara Kerja
          </p>
          <h2 style={{
            textAlign: 'center', fontSize: 'var(--text-28)', fontWeight: 'var(--weight-bold)',
            letterSpacing: '-0.035em', marginBottom: 'var(--sp-3)',
          }}>
            Tiga langkah.{' '}
            <span style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontWeight: 'var(--weight-normal)' }}>
              Selesai dalam detik.
            </span>
          </h2>
          <p style={{
            textAlign: 'center', color: 'var(--text-quaternary)', fontSize: 'var(--text-13)',
            marginBottom: 'var(--sp-10)', maxWidth: '440px', marginLeft: 'auto', marginRight: 'auto',
          }}>
            Tanpa perlu chat admin, tanpa menunggu konfirmasi. Semuanya berjalan otomatis.
          </p>

          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1px',
            background: 'var(--border)', borderRadius: 'var(--radius-xl)', overflow: 'hidden', border: '1px solid var(--border)',
          }}>
            {[
              { num: '01', title: 'Pilih Produk', desc: 'Telusuri katalog dan pilih layanan premium yang Anda butuhkan.' },
              { num: '02', title: 'Selesaikan Pembayaran', desc: 'Bayar melalui QRIS, transfer bank, atau e-wallet pilihan Anda.' },
              { num: '03', title: 'Terima Detail Akun', desc: 'Data akun langsung tampil di layar dan terkirim ke email serta WhatsApp.' },
            ].map((step, i) => (
              <div key={i} style={{ background: 'var(--bg-surface-0)', padding: 'var(--sp-6)' }}>
                <div style={{
                  fontSize: 'var(--text-11)', fontWeight: 'var(--weight-semibold)', color: 'var(--text-quaternary)',
                  marginBottom: 'var(--sp-4)', fontVariantNumeric: 'tabular-nums',
                }}>
                  {step.num}
                </div>
                <h3 style={{
                  fontSize: 'var(--text-14)', fontWeight: 'var(--weight-semibold)',
                  letterSpacing: '-0.01em', marginBottom: 'var(--sp-2)',
                }}>
                  {step.title}
                </h3>
                <p style={{ fontSize: 'var(--text-13)', color: 'var(--text-tertiary)', lineHeight: '1.65' }}>
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FAQ ─── */}
      <section style={{ padding: 'var(--sp-20) 0', borderTop: '1px solid var(--border)' }} id="faq">
        <div className="container" style={{ maxWidth: '600px' }}>
          <p style={{
            fontSize: 'var(--text-11)', fontWeight: 'var(--weight-medium)', color: 'var(--text-quaternary)',
            letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 'var(--sp-3)', textAlign: 'center',
          }}>
            FAQ
          </p>
          <h2 style={{
            textAlign: 'center', fontSize: 'var(--text-24)', fontWeight: 'var(--weight-bold)',
            letterSpacing: '-0.03em', marginBottom: 'var(--sp-10)',
          }}>
            Pertanyaan yang sering diajukan
          </h2>

          <FAQItem
            q="Apakah akun yang dijual aman?"
            a="Semua akun yang tersedia telah melalui verifikasi dan siap digunakan. Kami memberikan garansi penggantian apabila akun bermasalah di hari pertama penggunaan."
          />
          <FAQItem
            q="Bagaimana proses penerimaan akun setelah pembayaran?"
            a="Begitu pembayaran terkonfirmasi oleh sistem, data akun berupa email dan password akan langsung ditampilkan di halaman Anda. Salinannya juga dikirimkan melalui email dan WhatsApp."
          />
          <FAQItem
            q="Metode pembayaran apa saja yang didukung?"
            a="Kami mendukung QRIS (kompatibel dengan semua e-wallet dan mobile banking), Virtual Account, GoPay, OVO, DANA, dan ShopeePay. Semua diproses melalui Midtrans."
          />
          <FAQItem
            q="Apa yang harus dilakukan jika terjadi kendala?"
            a="Anda dapat menghubungi kami melalui WhatsApp. Tim kami akan merespons dan membantu menyelesaikan masalah Anda secepat mungkin."
          />
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="footer">
        <div className="container">
          <div className="footer__brand">
            mediea<span style={{ color: 'var(--accent-text)' }}>premium</span>
          </div>
          <p className="footer__text">
            Bagian dari{' '}
            <a href="https://www.mediea.co.id" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text-secondary)', textDecoration: 'underline', textDecorationColor: 'var(--border-hover)', textUnderlineOffset: '3px' }}>
              mediea.co.id
            </a>
          </p>
          <div className="footer__links">
            <a href="https://wa.me/6281241511156" target="_blank" rel="noopener noreferrer" className="footer__link">WhatsApp</a>
            <a href="https://www.mediea.co.id" target="_blank" rel="noopener noreferrer" className="footer__link">Website Utama</a>
          </div>
          <p className="footer__text" style={{ marginTop: 'var(--sp-6)', fontSize: 'var(--text-11)', color: 'var(--text-disabled)' }}>
            © {new Date().getFullYear()} Mediea Premium
          </p>
        </div>
      </footer>
    </>
  );
}

function FAQItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ borderBottom: '1px solid var(--border)' }}>
      <button onClick={() => setOpen(!open)} style={{
        width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        background: 'none', border: 'none', color: 'var(--text-primary)',
        fontSize: 'var(--text-14)', fontWeight: 'var(--weight-medium)', textAlign: 'left',
        cursor: 'pointer', padding: 'var(--sp-5) 0', fontFamily: 'var(--font-sans)', letterSpacing: '-0.01em',
      }}>
        {q}
        <svg
          width="16" height="16" viewBox="0 0 16 16" fill="none"
          style={{
            flexShrink: 0, marginLeft: 'var(--sp-4)', color: 'var(--text-quaternary)',
            transition: 'transform 0.2s ease', transform: open ? 'rotate(180deg)' : 'rotate(0)',
          }}
        >
          <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
      <div style={{
        maxHeight: open ? '300px' : '0', overflow: 'hidden',
        transition: 'max-height 0.3s ease, opacity 0.3s ease', opacity: open ? 1 : 0,
      }}>
        <p style={{
          color: 'var(--text-tertiary)', fontSize: 'var(--text-13)', lineHeight: '1.75',
          paddingBottom: 'var(--sp-5)',
        }}>
          {a}
        </p>
      </div>
    </div>
  );
}
