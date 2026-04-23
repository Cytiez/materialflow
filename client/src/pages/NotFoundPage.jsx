import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-parchment flex items-center justify-center">
      <div className="text-center max-w-md px-6">
        <div className="grotesque-num text-[120px] text-soil leading-none">404</div>
        <div className="h-[1px] bg-moss w-32 mx-auto my-4" />
        <h1 className="text-[20px] font-bold text-forest mb-2">Halaman Tidak Ditemukan</h1>
        <p className="text-[14px] text-stone mb-8">
          Halaman yang Anda cari tidak ada atau telah dipindahkan.
        </p>
        <Link to="/" className="btn-primary inline-flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px]">home</span>
          Kembali ke Beranda
        </Link>
      </div>
    </div>
  );
}
