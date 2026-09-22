'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [theme, setTheme] = useState('dark');

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem('mediea-theme') || 'dark';
    setTheme(saved);
    document.documentElement.setAttribute('data-theme', saved);
  }, []);

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('mediea-theme', next);
  };

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

        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <button
            className="theme-toggle"
            onClick={toggleTheme}
            aria-label="Toggle theme"
            title={theme === 'dark' ? 'Mode Terang' : 'Mode Gelap'}
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
          <button className="navbar__menu-btn" onClick={() => setIsOpen(!isOpen)} aria-label="Toggle menu">
            {isOpen ? '✕' : '☰'}
          </button>
        </div>
      </div>
    </nav>
  );
}
