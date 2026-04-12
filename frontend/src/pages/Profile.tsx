import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Mail, Phone, Shield, User } from 'lucide-react';
import { getProfile } from '../api/endpoints';
import { useAuth } from '../context/AuthContext';
import type { UserProfile } from '../types';

function maskPhone(value: string) {
  if (value.length < 7) {
    return value;
  }

  return `${value.slice(0, 3)} **** ${value.slice(-4)}`;
}

export default function ProfilePage() {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    getProfile()
      .then((data) => {
        if (active) {
          setProfile(data);
        }
      })
      .catch(() => {
        if (active) {
          setError(t('profile.loadError'));
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [t]);

  const createdAtLabel = useMemo(() => {
    if (!profile?.createdAt) {
      return t('profile.unavailable');
    }

    return new Date(profile.createdAt).toLocaleDateString('zh-CN');
  }, [profile?.createdAt, t]);

  const displayName = profile?.username || t('profile.unavailable');
  const displayPhone = profile?.phone ? maskPhone(profile.phone) : t('profile.unavailable');
  const roleLabel = profile?.role ? t(`profile.roles.${profile.role}`, profile.role) : t('profile.unavailable');
  const avatarSeed = (profile?.username || '?').trim().charAt(0).toUpperCase() || '?';

  return (
    <div className="w-full max-w-4xl mx-auto animate-fade-in pb-12">
      <div className="mb-8 border-b border-white/5 pb-8">
        <h2 className="text-3xl font-bold text-white mb-2">{t('dashboard.profile')}</h2>
        <p className="text-slate-400">{t('profile.subtitle')}</p>
      </div>

      {error ? (
        <div className="mb-6 rounded-2xl border border-amber-500/20 bg-amber-500/10 px-5 py-4 text-sm text-amber-200">
          {error}
        </div>
      ) : null}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="col-span-1">
          <div className="bg-slate-900/40 rounded-2xl border border-slate-800 p-6 flex flex-col items-center text-center shadow-xl backdrop-blur-sm">
            <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 mb-4 ring-4 ring-slate-900 ring-offset-2 ring-offset-slate-950 flex items-center justify-center text-4xl text-white font-bold">
              {avatarSeed}
            </div>
            <h3 className="text-xl font-bold text-white mb-1">
              {loading ? t('profile.loading') : displayName}
            </h3>
            <p className="text-slate-400 mb-4 leading-tight text-sm">
              {t('profile.memberSince', { date: createdAtLabel })}
            </p>
            <span className="px-3 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full text-xs font-medium">
              {roleLabel}
            </span>
          </div>
        </div>

        <div className="col-span-2 space-y-6">
          <div className="bg-slate-900/40 rounded-2xl border border-slate-800 p-6 shadow-xl backdrop-blur-sm">
            <h4 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
              <User size={20} className="text-blue-500" />
              Identity Information
            </h4>
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-slate-950/50 rounded-xl border border-slate-800">
                <div>
                  <p className="text-sm font-medium text-slate-400 mb-1">{t('profile.displayName')}</p>
                  <p className="text-slate-100 font-medium tracking-wide">
                    {loading ? t('profile.loading') : displayName}
                  </p>
                </div>
                <button
                  type="button"
                  disabled
                  className="text-slate-500 text-sm font-medium mt-2 sm:mt-0 cursor-not-allowed"
                >
                  {t('profile.actions.pending')}
                </button>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-slate-950/50 rounded-xl border border-slate-800">
                <div>
                  <p className="text-sm font-medium text-slate-400 flex items-center gap-2 mb-1">
                    <Phone size={14} /> {t('profile.phone')}
                  </p>
                  <p className="text-slate-100 font-medium tracking-wide">
                    {loading ? t('profile.loading') : displayPhone}
                  </p>
                </div>
                <button
                  type="button"
                  disabled
                  className="text-slate-500 text-sm font-medium mt-2 sm:mt-0 cursor-not-allowed"
                >
                  {t('profile.actions.pending')}
                </button>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-slate-950/50 rounded-xl border border-slate-800">
                <div>
                  <p className="text-sm font-medium text-slate-400 flex items-center gap-2 mb-1">
                    <Mail size={14} /> {t('profile.email')}
                  </p>
                  <p className="text-slate-100 font-medium tracking-wide">{t('profile.emailUnavailable')}</p>
                </div>
                <button
                  type="button"
                  disabled
                  className="text-slate-500 text-sm font-medium mt-2 sm:mt-0 cursor-not-allowed"
                >
                  {t('profile.actions.pending')}
                </button>
              </div>
            </div>
          </div>
          
          <div className="bg-slate-900/40 rounded-2xl border border-slate-800 p-6 shadow-xl backdrop-blur-sm">
             <h4 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
              <Shield size={20} className="text-purple-500" />
              {t('profile.securityTitle')}
            </h4>
            <p className="text-slate-400 text-sm leading-relaxed mb-4">
              {t('profile.securityDescription')}
            </p>
            <div className={`p-4 rounded-xl border flex items-center justify-between ${isAuthenticated ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
              <div className="flex items-center gap-3">
                 <div className={`w-2 h-2 rounded-full ${isAuthenticated ? 'bg-emerald-400' : 'bg-red-400'}`}></div>
                 <span className="font-medium text-sm">{t('profile.activeSession')}</span>
              </div>
              <span className="text-xs">{isAuthenticated ? t('profile.valid') : t('profile.invalid')}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
