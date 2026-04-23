import { useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import LoadingSpinner from '../components/common/LoadingSpinner';

function ImpactStat({ value, unit, label, description, large = false }) {
  return (
    <div className="text-center">
      <div className={`grotesque-num ${large ? 'text-[80px]' : 'text-[56px]'} text-soil`}>
        {value}
      </div>
      {unit && (
        <span className={`${large ? 'text-[24px]' : 'text-[18px]'} font-light text-moss`}>{unit}</span>
      )}
      <div className="mt-2">
        <div className="h-[1px] bg-moss w-full mb-2" />
        <span className="text-[10px] tracking-[0.15em] font-bold text-moss uppercase">{label}</span>
        {description && (
          <p className="text-[13px] text-stone italic mt-0.5">{description}</p>
        )}
      </div>
    </div>
  );
}

function timeAgo(isoString) {
  if (!isoString) return '';
  const diff = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000);
  if (diff < 60) return 'Baru saja';
  const mins = Math.floor(diff / 60);
  if (mins < 60) return `${mins} menit lalu`;
  return `${Math.floor(mins / 60)} jam lalu`;
}

export default function ImpactPage() {
  const [impact, setImpact] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchImpact = useCallback(() => {
    api.get('/api/impact/global')
      .then(r => setImpact(r.data.data?.impact || r.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchImpact();
    // Auto-refresh setiap 60 detik
    const interval = setInterval(fetchImpact, 60000);
    return () => clearInterval(interval);
  }, [fetchImpact]);

  if (loading) return <LoadingSpinner />;

  const totalWaste = Math.round(impact?.total_waste_kg || 0);
  const economicValue = Math.round(impact?.economic_value || 0);
  const co2Kg = ((impact?.co2_saved_ton || 0) * 1000).toFixed(1);
  const pohon = Math.round(impact?.pohon_equivalent || 0);
  const bensin = Math.round(impact?.bensin_liter || 0);
  const totalMatches = impact?.total_matches || 0;
  const lastUpdated = impact?.last_updated;

  return (
    <div className="space-y-12">
      {/* Hero section */}
      <section className="relative py-12 overflow-hidden">
        {/* Organic blob background */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[850px] h-[850px] organic-blob pointer-events-none" />

        {/* Wobbly line decoration */}
        <div className="absolute left-10 top-[10%] bottom-[10%] w-[1px]">
          <svg width="10" height="100%" viewBox="0 0 10 500" preserveAspectRatio="none">
            <path d="M5,0 Q8,125 2,250 T5,500" fill="none" stroke="var(--moss)" strokeOpacity="0.2" strokeWidth="1.5" className="wobbly-line" />
          </svg>
        </div>

        <div className="relative z-10 max-w-5xl mx-auto flex flex-col gap-12">
          {/* Main economic value */}
          <div className="text-center">
            <div className="inline-block relative">
              <span className="absolute -top-4 -left-12 text-[28px] font-light text-moss">Rp</span>
              <div className="grotesque-num text-[120px] text-soil">
                {economicValue.toLocaleString('id-ID')}
              </div>
            </div>
            <div className="max-w-3xl mx-auto mt-2">
              <div className="h-[1px] bg-moss w-full mb-2" />
              <div className="flex justify-between items-baseline px-2">
                <span className="text-[10px] tracking-[0.15em] font-bold text-moss uppercase">NILAI EKONOMI SIRKULAR</span>
                <span className="text-[13px] text-stone italic">Total nilai dari seluruh material tersalurkan</span>
              </div>
            </div>
          </div>

          {/* CO2 and Pohon */}
          <div className="grid grid-cols-2 gap-16 md:gap-32">
            <div className="text-right flex flex-col items-end">
              <div className="flex items-baseline justify-end gap-3">
                <div className="grotesque-num text-[72px] text-soil">{co2Kg}</div>
                <span className="text-[24px] font-light text-moss">kg</span>
              </div>
              <div className="w-full mt-2">
                <div className="h-[1px] bg-moss w-full mb-2" />
                <div className="flex flex-col items-end">
                  <span className="text-[10px] tracking-[0.15em] font-bold text-moss uppercase">CO₂ DICEGAH DARI TPA</span>
                  <span className="text-[13px] text-stone italic">Emisi karbon yang berhasil dihindari</span>
                </div>
              </div>
            </div>
            <div className="text-left flex flex-col items-start">
              <div className="flex flex-col">
                <div className="grotesque-num text-[72px] text-moss">{pohon.toLocaleString('id-ID')}</div>
                <span className="text-[20px] font-light text-soil -mt-2">pohon</span>
              </div>
              <div className="w-full mt-2">
                <div className="h-[1px] bg-moss w-full mb-2" />
                <div className="flex flex-col items-start">
                  <span className="text-[10px] tracking-[0.15em] font-bold text-moss uppercase">KESETARAAN REBOISASI</span>
                  <span className="text-[13px] text-stone italic">Nilai oksigen terjaga melalui penggunaan kembali</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quote */}
          <div className="text-center mt-4">
            <p className="text-[15px] text-stone italic">
              &ldquo;Setiap kilogram yang tersalurkan adalah napas baru bagi bumi kita.&rdquo;
            </p>
            <div className="flex justify-center mt-2">
              <svg width="400" height="12" fill="none" viewBox="0 0 400 12">
                <path d="M2 10C50 2 350 12 398 4" stroke="var(--moss)" strokeOpacity="0.4" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </div>
          </div>
        </div>
      </section>

      {/* Last updated */}
      {lastUpdated && (
        <p className="text-center text-[11px] text-stone/50 -mt-8">
          Terakhir diperbarui: {timeAgo(lastUpdated)}
        </p>
      )}

      {/* Wave divider */}
      <div className="relative -mt-4">
        <svg width="100%" height="40" viewBox="0 0 1440 40" fill="none" preserveAspectRatio="none">
          <path d="M0 40C200 10 500 0 720 20C940 40 1240 10 1440 40V40H0V40Z" fill="var(--cream)" />
          <path d="M0 40C200 10 500 0 720 20C940 40 1240 10 1440 40" stroke="var(--moss)" strokeOpacity="0.15" strokeWidth="2" />
        </svg>
      </div>

      {/* Detail cards */}
      <section className="bg-cream rounded-2xl p-8">
        <span className="text-[11px] tracking-[0.15em] font-bold text-moss uppercase block mb-8">RINGKASAN DAMPAK PLATFORM</span>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          <div className="card-white text-center py-8">
            <div className="grotesque-num text-[48px] text-forest">{totalWaste.toLocaleString('id-ID')}</div>
            <p className="text-[12px] text-stone mt-1">kg limbah tersalurkan</p>
          </div>
          <div className="card-white text-center py-8">
            <div className="grotesque-num text-[48px] text-forest">{bensin.toLocaleString('id-ID')}</div>
            <p className="text-[12px] text-stone mt-1">liter bensin ekuivalen</p>
          </div>
          <div className="card-white text-center py-8">
            <div className="grotesque-num text-[48px] text-forest">{totalMatches}</div>
            <p className="text-[12px] text-stone mt-1">koneksi berhasil</p>
          </div>
        </div>
      </section>
    </div>
  );
}
