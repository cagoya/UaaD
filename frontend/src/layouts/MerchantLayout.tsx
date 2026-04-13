import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, ListChecks, PlusCircle, LogOut, ArrowLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import LanguageToggle from '../components/LanguageToggle';
import { useAuth } from '../context/AuthContext';

export default function MerchantLayout() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();

  const menuItems = [
    { icon: LayoutDashboard, label: t('merchant.dashboard'), path: '/merchant/dashboard' },
    { icon: ListChecks, label: t('merchant.activityList'), path: '/merchant/activities' },
    { icon: PlusCircle, label: t('merchant.createActivity'), path: '/merchant/activities/new' },
  ];

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-50">
      <aside className="w-72 border-r border-slate-800 bg-slate-900/40 p-5">
        <button
          type="button"
          onClick={() => navigate('/')}
          className="mb-8 inline-flex items-center gap-2 rounded-full border border-slate-700 px-3 py-2 text-sm text-slate-300 transition hover:border-rose-400 hover:text-rose-300"
        >
          <ArrowLeft size={14} />
          {t('merchant.backToPublic')}
        </button>

        <div className="mb-8">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{t('merchant.panel')}</p>
          <h1 className="mt-2 text-xl font-black text-white">UAAD Merchant</h1>
        </div>

        <nav className="space-y-2">
          {menuItems.map((item) => {
            const isActive = location.pathname.startsWith(item.path);
            return (
              <button
                key={item.path}
                type="button"
                onClick={() => navigate(item.path)}
                className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm font-semibold transition ${
                  isActive
                    ? 'border-rose-400/40 bg-rose-500/10 text-rose-200'
                    : 'border-transparent text-slate-400 hover:border-slate-700 hover:bg-slate-800/60 hover:text-white'
                }`}
              >
                <item.icon size={18} />
                {item.label}
              </button>
            );
          })}
        </nav>

        <button
          type="button"
          onClick={() => {
            logout();
            navigate('/', { replace: true });
          }}
          className="mt-10 inline-flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-300 transition hover:bg-red-500/20"
        >
          <LogOut size={16} />
          {t('dashboard.logout')}
        </button>
      </aside>

      <main className="flex-1 bg-[radial-gradient(circle_at_top_right,_rgba(244,63,94,0.14),_transparent_40%)]">
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-white/5 bg-slate-950/65 px-6 py-4 backdrop-blur">
          <div>
            <p className="text-sm font-semibold text-slate-400">{t('merchant.panel')}</p>
          </div>
          <LanguageToggle />
        </header>
        <div className="p-6 lg:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
