import { useAuth } from '../../contexts/AuthContext';
import { useLocation } from 'react-router-dom';

const pageTitles = {
  '/dashboard': 'Dashboard',
  '/listings': 'Daftar Limbah',
  '/listings/create': 'Buat Listing Baru',
  '/listings/my': 'Listing Saya',
  '/requests': 'Permintaan Material',
  '/requests/create': 'Buat Permintaan Baru',
  '/requests/my': 'Permintaan Saya',
  '/impact': 'Impact Dashboard',
  '/profile': 'Profil',
};

const breadcrumbs = {
  '/listings/create': 'Listing Saya › Buat Listing Baru',
  '/listings/my': 'Dashboard › Listing Saya',
  '/requests/create': 'Permintaan Saya › Buat Permintaan Baru',
  '/requests/my': 'Dashboard › Permintaan Saya',
};

function getPageTitle(pathname) {
  if (pageTitles[pathname]) return pageTitles[pathname];
  if (/^\/listings\/\d+\/matches$/.test(pathname)) return 'Hasil Pencocokan';
  if (/^\/listings\/\d+\/edit$/.test(pathname)) return 'Edit Listing';
  if (/^\/listings\/\d+$/.test(pathname)) return 'Detail Listing';
  if (/^\/requests\/\d+\/edit$/.test(pathname)) return 'Edit Permintaan';
  if (/^\/requests\/\d+$/.test(pathname)) return 'Detail Permintaan';
  return 'MaterialFlow';
}

function getBreadcrumb(pathname) {
  if (breadcrumbs[pathname]) return breadcrumbs[pathname];
  if (/^\/listings\/\d+\/matches$/.test(pathname)) return 'Listing Saya › Hasil Pencocokan';
  if (/^\/listings\/\d+\/edit$/.test(pathname)) return 'Listing Saya › Edit Listing';
  if (/^\/listings\/\d+$/.test(pathname)) return 'Listings › Detail Listing';
  if (/^\/requests\/\d+$/.test(pathname)) return 'Permintaan › Detail Permintaan';
  return null;
}

export default function Navbar() {
  const { user } = useAuth();
  const location = useLocation();
  const title = getPageTitle(location.pathname);
  const breadcrumb = getBreadcrumb(location.pathname);

  return (
    <header className="py-4 px-10 border-b border-outline-strong sticky top-0 bg-parchment z-20">
      {breadcrumb && (
        <div className="mb-1">
          <span className="text-[12px] text-stone">{breadcrumb}</span>
        </div>
      )}
      <div className="flex items-center justify-between">
        <h1 className="text-[28px] font-bold text-soil">{title}</h1>

        <div className="flex items-center gap-4">
          {/* Avatar */}
          <div className="w-8 h-8 rounded-full bg-moss flex items-center justify-center text-white text-[12px] font-bold">
            {user?.profile?.company_name?.charAt(0)?.toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'U'}
          </div>
        </div>
      </div>
    </header>
  );
}
