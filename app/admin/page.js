'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      if (!supabaseUrl || supabaseUrl === 'your_supabase_url') {
        // Demo mode: accept any credentials
        if (email && password) {
          localStorage.setItem('admin_session', JSON.stringify({ email, demo: true }));
          router.push('/admin/dashboard');
          return;
        }
      }

      const { createClientBrowser } = await import('@/lib/supabase');
      const supabase = createClientBrowser();
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        setError('Email atau password salah');
        setLoading(false);
        return;
      }

      router.push('/admin/dashboard');
    } catch (err) {
      setError('Terjadi kesalahan. Silakan coba lagi.');
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card card">
        <div className="login-card__header">
          <h1 className="login-card__title">
            MEDIEA<span className="text-accent"> PREMIUM</span>
          </h1>
          <p className="login-card__subtitle">Admin Dashboard</p>
        </div>

        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label className="form-label" htmlFor="admin-email">
              Email
            </label>
            <input
              id="admin-email"
              type="email"
              className="form-input"
              placeholder="admin@mediapremium.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="admin-password">
              Password
            </label>
            <input
              id="admin-password"
              type="password"
              className="form-input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && (
            <p
              style={{
                color: 'var(--danger)',
                fontSize: 'var(--fs-sm)',
                marginBottom: 'var(--space-4)',
                textAlign: 'center',
              }}
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            className={`btn btn--primary btn--full ${loading ? 'btn--loading' : ''}`}
            disabled={loading}
          >
            {loading ? '' : 'Masuk →'}
          </button>
        </form>
      </div>
    </div>
  );
}
