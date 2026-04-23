import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';

// Animated counter hook
function useCountUp(target, duration = 2000, startOnView = true) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (!startOnView) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;
          const start = performance.now();
          const animate = (now) => {
            const progress = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
            setCount(Math.floor(eased * target));
            if (progress < 1) requestAnimationFrame(animate);
          };
          requestAnimationFrame(animate);
        }
      },
      { threshold: 0.3 }
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target, duration, startOnView]);

  return { count, ref };
}

function ImpactCounter({ value, unit, label, suffix = '' }) {
  const { count, ref } = useCountUp(value);
  return (
    <div ref={ref} className="text-center">
      <p className="text-[36px] sm:text-[48px] font-extrabold text-forest tracking-tight leading-none">
        {count.toLocaleString('id-ID')}{suffix}
      </p>
      <p className="text-[13px] text-stone font-medium mt-1">{unit}</p>
      <p className="text-[11px] text-stone/60 mt-0.5">{label}</p>
    </div>
  );
}

const STEPS = [
  {
    number: '01',
    title: 'Daftarkan Usaha',
    description: 'Buat akun sebagai Waste Sender atau Waste Receiver. Lengkapi profil perusahaan dan lokasi.',
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
      </svg>
    ),
  },
  {
    number: '02',
    title: 'Posting & Cari',
    description: 'Sender posting listing limbah, Receiver buat permintaan material. Sistem auto-matching berdasarkan kategori dan jarak.',
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
      </svg>
    ),
  },
  {
    number: '03',
    title: 'Terhubung & Berdampak',
    description: 'Dapatkan kontak mitra yang cocok, negosiasi langsung. Pantau dampak lingkungan dari setiap koneksi.',
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
      </svg>
    ),
  },
];

const CATEGORIES_ICONS = {
  wood: '🪵', plastic: '♻️', paper: '📦', fabric: '🧵', metal: '⚙️',
  glass: '🪟', oil: '🛢️', rubber: '🛞', ash: 'ite💨', electronic: '🔌',
};

export default function LandingPage() {
  const [impact, setImpact] = useState(null);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    api.get('/api/impact/global').then(r => setImpact(r.data.data)).catch(() => {});
    api.get('/api/categories').then(r => setCategories(r.data.data?.categories || [])).catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-parchment">
      {/* Navbar */}
      <nav className="sticky top-0 z-30 bg-parchment/90 backdrop-blur-xl border-b border-outline">
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between h-14">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-md bg-forest flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </div>
            <span className="text-forest font-bold text-[16px] tracking-tight">MaterialFlow</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link to="/impact" className="text-stone text-[13px] font-medium hover:text-soil transition-colors hidden sm:block">
              Impact
            </Link>
            <Link to="/login" className="btn-secondary !py-2 !px-4 !text-[13px]">
              Masuk
            </Link>
            <Link to="/register" className="btn-cta !py-2 !px-4 !text-[13px]">
              Daftar
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 pt-20 pb-16 sm:pt-28 sm:pb-24">
        <div className="max-w-2xl">
          <p className="label-caps mb-4 text-moss">Platform Sirkuler Jabodetabek</p>
          <h1 className="text-[36px] sm:text-[52px] font-extrabold text-forest leading-[1.1] tracking-tight mb-5">
            Limbah Anda,<br />
            <span className="text-moss">bahan baku mereka.</span>
          </h1>
          <p className="text-stone text-[16px] sm:text-[18px] leading-relaxed mb-8 max-w-lg">
            MaterialFlow menghubungkan industri penghasil limbah dengan industri yang membutuhkan material daur ulang. Gratis, tanpa komisi.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link to="/register" className="btn-cta !py-3 !px-8 !text-[15px]">
              Mulai Sekarang
            </Link>
            <Link to="/impact" className="btn-secondary !py-3 !px-8 !text-[15px]">
              Lihat Impact
            </Link>
          </div>
        </div>
      </section>

      {/* Impact counters */}
      {impact && (
        <section className="bg-cream border-y border-outline py-14">
          <div className="max-w-6xl mx-auto px-6">
            <p className="label-caps text-center mb-10">Dampak Kolektif</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-8">
              <ImpactCounter
                value={Math.round(impact.total_waste_kg || 0)}
                unit="kg limbah"
                label="Tersalurkan"
              />
              <ImpactCounter
                value={Math.round(impact.economic_value || 0)}
                unit="Rupiah"
                label="Nilai ekonomi"
                suffix=""
              />
              <ImpactCounter
                value={Math.round((impact.co2_saved_ton || 0) * 1000)}
                unit="kg CO₂"
                label="Emisi dicegah"
              />
              <ImpactCounter
                value={Math.round(impact.pohon_equivalent || 0)}
                unit="pohon"
                label="Setara ditanam"
              />
            </div>
          </div>
        </section>
      )}

      {/* Cara Kerja */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <div className="text-center mb-14">
          <p className="label-caps mb-3 text-moss">Cara Kerja</p>
          <h2 className="text-headline-lg text-forest">Tiga langkah sederhana</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {STEPS.map((step) => (
            <div key={step.number} className="card text-center">
              <div className="w-14 h-14 rounded-lg bg-moss/10 flex items-center justify-center text-moss mx-auto mb-5">
                {step.icon}
              </div>
              <p className="text-[11px] font-bold text-moss/60 tracking-widest uppercase mb-2">
                Langkah {step.number}
              </p>
              <h3 className="text-[18px] font-bold text-forest mb-2">{step.title}</h3>
              <p className="text-body-sm text-stone leading-relaxed">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Kategori limbah */}
      {categories.length > 0 && (
        <section className="bg-cream border-y border-outline py-20">
          <div className="max-w-6xl mx-auto px-6">
            <div className="text-center mb-12">
              <p className="label-caps mb-3 text-moss">Kategori</p>
              <h2 className="text-headline-lg text-forest">Jenis limbah yang didukung</h2>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
              {categories.map((cat) => (
                <div key={cat.id} className="card-white text-center !p-4">
                  <p className="text-[28px] mb-2">
                    {CATEGORIES_ICONS[cat.icon] || '📦'}
                  </p>
                  <p className="text-[13px] font-semibold text-soil leading-tight">{cat.name}</p>
                  <p className="text-[11px] text-stone mt-1">
                    Rp {Number(cat.price_per_kg).toLocaleString('id-ID')}/kg
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <div
          className="rounded-xl p-10 sm:p-14 text-center bg-forest"
        >
          <h2 className="text-white text-[28px] sm:text-[36px] font-extrabold tracking-tight mb-4">
            Siap mengubah limbah jadi nilai?
          </h2>
          <p className="text-white/60 text-[15px] mb-8 max-w-md mx-auto">
            Bergabunglah dengan jaringan sirkuler Jabodetabek. Proses pendaftaran hanya 2 menit.
          </p>
          <Link
            to="/register"
            className="inline-flex items-center gap-2 py-3 px-8 rounded-md text-white font-semibold text-[15px] transition-all bg-terracotta hover:bg-terracotta/90"
          >
            Daftar Gratis
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-outline py-8">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-forest flex items-center justify-center">
              <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </div>
            <span className="text-soil font-bold text-[13px] tracking-tight">MaterialFlow</span>
          </div>
          <p className="text-[12px] text-stone">
            &copy; 2026 MaterialFlow. Platform sirkuler Jabodetabek.
          </p>
        </div>
      </footer>
    </div>
  );
}
