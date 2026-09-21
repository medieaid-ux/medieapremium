'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className="navbar" style={scrolled ? { borderBottomColor: 'var(--border-hover)' } : {}}>
      <div className="navbar__inner">
        <Link href="/" className="navbar__brand">
          <span className="navbar__logo">
            mediea<span className="navbar__logo-accent">premium</span>
          </span>
        </Link>

        <div className={`navbar__links ${isOpen ? 'navbar__links--open' : ''}`}>
          <Link href="/" className="navbar__link" onClick={() => setIsOpen(false)}>
            Produk
          </Link>
          <Link href="/#cara-kerja" className="navbar__link" onClick={() => setIsOpen(false)}>
            Cara Kerja
          </Link>
          <Link href="/#faq" className="navbar__link" onClick={() => setIsOpen(false)}>
            FAQ
          </Link>
          <a href="https://wa.me/6281241511156" target="_blank" rel="noopener noreferrer" className="navbar__cta">
            Hubungi Kami
          </a>
        </div>

        <button className="navbar__menu-btn" onClick={() => setIsOpen(!isOpen)} aria-label="Toggle menu">
          {isOpen ? '✕' : '☰'}
        </button>
      </div>
    </nav>
  );
}
