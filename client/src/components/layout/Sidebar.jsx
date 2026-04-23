import { NavLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

function SidebarLink({ to, icon, label }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center gap-3 px-4 py-3 text-[14px] transition-colors rounded-lg ${
          isActive
            ? 'text-white bg-white/5 font-semibold'
            : 'text-[#A3B8A8] hover:text-white'
        }`
      }
    >
      <span className="material-symbols-outlined text-[18px]">{icon}</span>
      <span>{label}</span>
    </NavLink>
  );
}

export default function Sidebar() {
  const { user, isSender, isReceiver, logout } = useAuth();

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-sidebar bg-forest text-white flex flex-col z-40">
      {/* Logo */}
      <div className="p-6">
        <NavLink to="/dashboard" className="flex items-center gap-2">
          <span className="material-symbols-outlined text-moss scale-75">potted_plant</span>
          <span className="text-[15px] font-semibold tracking-tight">MaterialFlow</span>
        </NavLink>
        <div className="text-[10px] tracking-[0.15em] text-[#A3B8A8] mt-1 font-bold uppercase">
          {isSender ? 'Portal Pengirim' : isReceiver ? 'Portal Penerima' : 'Platform'}
        </div>
      </div>

      {/* Navigation */}
      <nav className="mt-8 flex-1 px-4 space-y-1">
        <SidebarLink to="/dashboard" icon="dashboard" label="Dashboard" />
        <SidebarLink to="/listings" icon="list_alt" label="Listings" />

        {isSender && (
          <SidebarLink to="/listings/my" icon="inventory_2" label="Listing Saya" />
        )}

        {isReceiver && (
          <SidebarLink to="/requests/my" icon="assignment" label="Permintaan Saya" />
        )}

        <SidebarLink to="/requests" icon="description" label="Permintaan" />
        <SidebarLink to="/impact" icon="analytics" label="Impact" />
        <SidebarLink to="/profile" icon="person" label="Profil" />
      </nav>

      {/* CTA Button */}
      <div className="p-4 mt-auto">
        {isSender && (
          <NavLink
            to="/listings/create"
            className="w-full bg-terracotta hover:brightness-110 transition-all text-white py-3 rounded-lg text-[11px] font-bold tracking-widest flex items-center justify-center gap-2 uppercase"
          >
            <span className="material-symbols-outlined text-[16px]">add</span>
            Buat Listing
          </NavLink>
        )}
        {isReceiver && (
          <NavLink
            to="/requests/create"
            className="w-full bg-terracotta hover:brightness-110 transition-all text-white py-3 rounded-lg text-[11px] font-bold tracking-widest flex items-center justify-center gap-2 uppercase"
          >
            <span className="material-symbols-outlined text-[16px]">add</span>
            Buat Permintaan
          </NavLink>
        )}
      </div>

      {/* User info + logout */}
      <div className="px-4 py-4 border-t border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-moss flex items-center justify-center text-white text-[12px] font-bold">
            {user?.email?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-[12px] font-medium truncate">{user?.email}</p>
            <p className="text-[#A3B8A8] text-[10px] uppercase tracking-wide font-bold">
              {user?.role === 'sender' ? 'Pengirim' : 'Penerima'}
            </p>
          </div>
          <button
            onClick={logout}
            className="text-[#A3B8A8] hover:text-white transition-colors"
            title="Logout"
          >
            <span className="material-symbols-outlined text-[18px]">logout</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
