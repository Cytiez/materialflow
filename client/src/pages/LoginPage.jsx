import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import ErrorMessage from '../components/common/ErrorMessage';
import LoadingSpinner from '../components/common/LoadingSpinner';

export default function LoginPage() {
  const { login } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.email || !form.password) {
      setError('Email dan password wajib diisi.');
      return;
    }

    setLoading(true);
    try {
      await login(form.email, form.password);
    } catch (err) {
      setError(err.response?.data?.message || 'Login gagal. Coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-parchment flex">
      {/* Left — branding panel */}
      <div
        className="hidden lg:flex lg:w-[480px] flex-col justify-between p-10 bg-forest"
      >
        <div>
          <div className="flex items-center gap-2 mb-16">
            <div className="w-9 h-9 rounded-md bg-white/15 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </div>
            <span className="text-white font-bold text-[17px] tracking-tight">MaterialFlow</span>
          </div>

          <h1 className="text-white text-[32px] font-extrabold leading-tight tracking-tight mb-4">
            Ubah limbah jadi<br />peluang baru.
          </h1>
          <p className="text-white/60 text-[15px] leading-relaxed max-w-xs">
            Platform penghubung industri penghasil limbah dengan industri yang membutuhkan material daur ulang di Jabodetabek.
          </p>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-3 text-white/50 text-[13px]">
            <svg className="w-5 h-5 text-white/40 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <span>Gratis &amp; tanpa komisi</span>
          </div>
          <div className="flex items-center gap-3 text-white/50 text-[13px]">
            <svg className="w-5 h-5 text-white/40 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064" />
            </svg>
            <span>Kurangi emisi karbon bersama</span>
          </div>
          <div className="flex items-center gap-3 text-white/50 text-[13px]">
            <svg className="w-5 h-5 text-white/40 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span>Matching otomatis pengirim &amp; penerima</span>
          </div>
        </div>
      </div>

      {/* Right — login form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 mb-10">
            <div className="w-8 h-8 rounded-md bg-forest flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </div>
            <span className="text-forest font-bold text-[17px] tracking-tight">MaterialFlow</span>
          </div>

          <h2 className="text-headline-md text-forest mb-1">Masuk</h2>
          <p className="text-stone text-body mb-8">
            Masuk ke akun Anda untuk mengelola limbah dan permintaan material.
          </p>

          {error && (
            <div className="mb-6">
              <ErrorMessage message={error} onClose={() => setError('')} />
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="label-caps mb-1.5 block">Email</label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="nama@perusahaan.com"
                className="input-field"
                autoComplete="email"
              />
            </div>

            <div>
              <label className="label-caps mb-1.5 block">Password</label>
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Masukkan password"
                className="input-field"
                autoComplete="current-password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2 py-3"
            >
              {loading ? (
                <LoadingSpinner size="sm" text="" />
              ) : (
                'Masuk'
              )}
            </button>
          </form>

          {/* Demo accounts */}
          <div className="mt-8 p-4 rounded-md bg-cream border border-outline">
            {/* FIX 9: Tombol demo hanya muncul di development */}
            {import.meta.env.DEV && (
              <>
                <p className="text-label-sm text-stone font-semibold uppercase tracking-wide mb-3">
                  Akun Demo
                </p>
                <div className="grid grid-cols-2 gap-3 text-[12px]">
                  <div>
                    <p className="text-stone mb-0.5 font-medium">Sender</p>
                    <button
                      type="button"
                      onClick={() => setForm({ email: 'mebeljaya@demo.com', password: 'Demo1234!' })}
                      className="text-moss hover:underline text-left"
                    >
                      mebeljaya@demo.com
                    </button>
                  </div>
                  <div>
                    <p className="text-stone mb-0.5 font-medium">Receiver</p>
                    <button
                      type="button"
                      onClick={() => setForm({ email: 'papanjaya@demo.com', password: 'Demo1234!' })}
                      className="text-moss hover:underline text-left"
                    >
                      papanjaya@demo.com
                    </button>
                  </div>
                </div>
                <p className="text-[11px] text-stone/50 mt-2">Password: Demo1234!</p>
              </>
            )}
          </div>

          <p className="text-center text-body-sm text-stone mt-8">
            Belum punya akun?{' '}
            <Link to="/register" className="text-moss font-semibold hover:underline">
              Daftar sekarang
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
