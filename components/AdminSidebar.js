'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';

const NAV_ITEMS = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="1" y="1" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5"/><rect x="9" y="1" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5"/><rect x="1" y="9" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5"/><rect x="9" y="9" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5"/></svg>
  )},
  { href: '/admin/dashboard/products', label: 'Produk', icon: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 4l6-3 6 3v8l-6 3-6-3V4z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/><path d="M8 7v8M2 4l6 3 6-3" stroke="currentColor" strokeWidth="1.5"/></svg>
  )},
  { href: '/admin/dashboard/stock', label: 'Stok Akun', icon: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="3" y="2" width="10" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.5"/><path d="M6 5h4M6 8h4M6 11h2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
  )},
  { href: '/admin/dashboard/orders', label: 'Pesanan', icon: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 3h12M2 8h12M2 13h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
  )},
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = async () => {
    try {
      const { createClientBrowser } = await import('@/lib/supabase');
      const supabase = createClientBrowser();
      await supabase.auth.signOut();
    } catch (e) {}
    localStorage.removeItem('admin_session');
    router.push('/admin');
  };

  return (
    <>
      <button className="admin-sidebar__toggle" onClick={() => setIsOpen(!isOpen)}>
        {isOpen ? '✕' : '☰'}
      </button>

      {isOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 49 }} onClick={() => setIsOpen(false)} />
      )}

      <aside className={`admin-sidebar ${isOpen ? 'admin-sidebar--open' : ''}`}>
        <div className="admin-sidebar__brand">
          mediea<span className="text-accent">premium</span>
        </div>
        <div className="admin-sidebar__subtitle">Admin Panel</div>

        <nav>
          <ul className="admin-sidebar__nav">
            {NAV_ITEMS.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`admin-sidebar__link ${pathname === item.href ? 'admin-sidebar__link--active' : ''}`}
                  onClick={() => setIsOpen(false)}
                >
                  <span style={{ display: 'flex', opacity: 0.7 }}>{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div style={{ marginTop: 'auto', paddingTop: 'var(--sp-6)', display: 'flex', flexDirection: 'column', gap: '1px' }}>
          <Link href="/" className="admin-sidebar__link">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ opacity: 0.7 }}><circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5"/><path d="M4 8h8M8 4v8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
            <span>Lihat Website</span>
          </Link>
          <button onClick={handleLogout} className="admin-sidebar__link" style={{ width: '100%', color: 'var(--danger)' }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ opacity: 0.7 }}><path d="M6 2H3a1 1 0 00-1 1v10a1 1 0 001 1h3M11 11l3-3-3-3M5 8h9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}
