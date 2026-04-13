import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  BellRing,
  CalendarDays,
  Clock3,
  ExternalLink,
  Loader2,
  MapPin,
  Ticket,
  Users,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  createEnrollment,
  findOrderByOrderNo,
  getActivityDetail,
  getActivityStock,
} from '../api/endpoints';
import { useAuth } from '../context/AuthContext';
import type { ActivityDetail } from '../types';
import { formatCurrency, formatLongDate } from '../utils/formatters';
import { hasActivityReminder, saveActivityReminder } from '../utils/activityReminderState';

type CountdownState = 'upcoming' | 'selling' | 'closed';

function getCountdownTarget(activity: ActivityDetail): {
  state: CountdownState;
  target: number;
} {
  const now = Date.now();
  const openAt = new Date(activity.enrollOpenAt).getTime();
  const closeAt = new Date(activity.enrollCloseAt).getTime();

  if (now < openAt) {
    return { state: 'upcoming', target: openAt };
  }

  if (now <= closeAt) {
    return { state: 'selling', target: closeAt };
  }

  return { state: 'closed', target: now };
}

function formatRemain(ms: number) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return { days, hours, minutes, seconds };
}

function buildMapModel(activity: ActivityDetail | null) {
  if (!activity) {
    return {
      hasCoordinates: false,
      openUrl: '',
      embedUrl: null,
      latitudeLabel: null,
      longitudeLabel: null,
    };
  }

  const hasCoordinates =
    typeof activity.latitude === 'number' && typeof activity.longitude === 'number';

  if (!hasCoordinates) {
    return {
      hasCoordinates: false,
      openUrl: `https://www.openstreetmap.org/search?query=${encodeURIComponent(activity.location)}`,
      embedUrl: null,
      latitudeLabel: null,
      longitudeLabel: null,
    };
  }

  const latitude = Number(activity.latitude);
  const longitude = Number(activity.longitude);
  const delta = 0.03;
  const bbox = [
    (longitude - delta).toFixed(5),
    (latitude - delta).toFixed(5),
    (longitude + delta).toFixed(5),
    (latitude + delta).toFixed(5),
  ].join('%2C');

  return {
    hasCoordinates: true,
    openUrl: `https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}#map=15/${latitude}/${longitude}`,
    embedUrl: `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${latitude}%2C${longitude}`,
    latitudeLabel: latitude.toFixed(4),
    longitudeLabel: longitude.toFixed(4),
  };
}

export default function ActivityDetailPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, session } = useAuth();
  const { id } = useParams();
  const activityId = Number(id);
  const [activity, setActivity] = useState<ActivityDetail | null>(null);
  const [stockRemaining, setStockRemaining] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [now, setNow] = useState(Date.now());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isReminderSet, setIsReminderSet] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<{
    tone: 'success' | 'error';
    message: string;
  } | null>(null);

  useEffect(() => {
    if (!Number.isFinite(activityId)) {
      setError(t('activityDetail.invalidId'));
      setLoading(false);
      return;
    }

    let active = true;

    async function load() {
      try {
        setLoading(true);
        setError('');
        const detail = await getActivityDetail(activityId);
        if (!active) {
          return;
        }

        setActivity(detail);
        setStockRemaining(detail.stockRemaining);

        const stock = await getActivityStock(activityId).catch(() => null);
        if (!active || !stock) {
          return;
        }
        setStockRemaining(stock.stockRemaining);
      } catch {
        if (!active) {
          return;
        }
        setError(t('activityDetail.loadError'));
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      active = false;
    };
  }, [activityId, t]);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [activityId]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    setIsReminderSet(hasActivityReminder(session?.userId, activityId));
  }, [activityId, session?.userId]);

  useEffect(() => {
    if (!activity) {
      return;
    }

    const poll = window.setInterval(async () => {
      const stock = await getActivityStock(activity.id).catch(() => null);
      if (stock) {
        setStockRemaining(stock.stockRemaining);
      }
    }, 15000);

    return () => window.clearInterval(poll);
  }, [activity]);

  const stockMeta = useMemo(() => {
    if (!activity) {
      return { percent: 0, tone: 'bg-emerald-500', textTone: 'text-emerald-600' };
    }

    const remain = Math.max(0, stockRemaining ?? activity.stockRemaining);
    const percent = activity.maxCapacity > 0 ? Math.round((remain / activity.maxCapacity) * 100) : 0;

    if (percent <= 10) {
      return { percent, tone: 'bg-rose-500', textTone: 'text-rose-600' };
    }
    if (percent <= 35) {
      return { percent, tone: 'bg-amber-500', textTone: 'text-amber-600' };
    }
    return { percent, tone: 'bg-emerald-500', textTone: 'text-emerald-600' };
  }, [activity, stockRemaining]);

  const currentStock = Math.max(0, stockRemaining ?? activity?.stockRemaining ?? 0);
  const mapModel = useMemo(() => buildMapModel(activity), [activity]);

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl space-y-5 px-4 py-8">
        <div className="h-72 animate-pulse rounded-3xl bg-rose-100/60" />
        <div className="h-48 animate-pulse rounded-3xl bg-slate-100" />
      </div>
    );
  }

  if (error || !activity) {
    return (
      <div className="mx-auto flex min-h-[50vh] max-w-3xl flex-col items-center justify-center gap-5 px-4 text-center">
        <p className="text-2xl font-bold text-slate-900">{t('public.errorTitle')}</p>
        <p className="text-slate-500">{error || t('activityDetail.notFound')}</p>
        <Link
          to="/activities"
          className="rounded-full bg-rose-500 px-5 py-2 text-sm font-semibold text-white transition hover:bg-rose-600"
        >
          {t('activityDetail.backToList')}
        </Link>
      </div>
    );
  }

  const countdown = getCountdownTarget(activity);
  const remain = formatRemain(countdown.target - now);
  const ctaConfig = (() => {
    if (activity.status === 'SOLD_OUT' || currentStock <= 0) {
      return {
        mode: 'sold_out' as const,
        label: t('activityDetail.soldOut'),
        description: t('activityDetail.soldOutHint'),
        disabled: true,
        className:
          'border border-slate-200 bg-slate-100 text-slate-400',
      };
    }

    if (activity.status === 'CANCELLED' || activity.status === 'OFFLINE' || countdown.state === 'closed') {
      return {
        mode: 'closed' as const,
        label: t('activityDetail.enrollUnavailable'),
        description: t('activityDetail.closedHint'),
        disabled: true,
        className:
          'border border-slate-200 bg-slate-100 text-slate-400',
      };
    }

    if (activity.status === 'PREHEAT' || countdown.state === 'upcoming') {
      return {
        mode: 'remind' as const,
        label: isReminderSet ? t('activityDetail.reminderSet') : t('activityDetail.remindMe'),
        description: isReminderSet
          ? t('activityDetail.reminderSavedHint')
          : isAuthenticated
            ? t('activityDetail.reminderHintReady')
            : t('activityDetail.reminderHint'),
        disabled: false,
        className: isReminderSet
          ? 'border border-emerald-200 bg-emerald-50 text-emerald-700'
          : 'bg-slate-900 text-white hover:bg-slate-800',
      };
    }

    if (countdown.state === 'selling') {
      return {
        mode: 'enroll' as const,
        label: t('activityDetail.enrollNow'),
        description: isAuthenticated
          ? t('activityDetail.paymentHint')
          : t('activityDetail.loginHint'),
        disabled: false,
        className: 'bg-rose-500 text-white hover:bg-rose-600',
      };
    }

    return {
      mode: 'disabled' as const,
      label: t('activityDetail.enrollUnavailable'),
      description: t('activityDetail.closedHint'),
      disabled: true,
      className: 'border border-slate-200 bg-slate-100 text-slate-400',
    };
  })();

  const handleAuthRedirect = () => {
    navigate('/login', {
      state: {
        from: {
          pathname: location.pathname,
          search: location.search,
        },
      },
    });
  };

  const handlePrimaryAction = async () => {
    setActionFeedback(null);

    if (!isAuthenticated) {
      handleAuthRedirect();
      return;
    }

    if (ctaConfig.mode === 'remind') {
      const created = saveActivityReminder(session?.userId, {
        activityId: activity.id,
        title: activity.title,
        openAt: activity.enrollOpenAt,
      });

      setIsReminderSet(true);
      setActionFeedback({
        tone: 'success',
        message: created
          ? t('activityDetail.reminderSaved', { time: formatLongDate(activity.enrollOpenAt) })
          : t('activityDetail.reminderExists'),
      });
      return;
    }

    if (ctaConfig.mode !== 'enroll') {
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await createEnrollment(activity.id);

      if (result.code === 1101) {
        setActionFeedback({
          tone: 'error',
          message: result.message,
        });

        const stock = await getActivityStock(activity.id).catch(() => null);
        if (stock) {
          setStockRemaining(stock.stockRemaining);
        }
        return;
      }

      if (result.orderNo) {
        const order = await findOrderByOrderNo(result.orderNo).catch(() => null);
        if (order) {
          navigate(`/app/orders/${order.id}`, {
            state: { activityTitle: activity.title },
          });
          return;
        }
      }

      if (result.enrollmentId) {
        navigate(`/app/enroll-status/${result.enrollmentId}`, {
          state: { activityTitle: activity.title },
        });
        return;
      }

      setActionFeedback({
        tone: 'success',
        message: t('activityDetail.enrollSubmitted'),
      });
    } catch (err) {
      const errorWithResponse = err as { response?: { data?: { message?: string } } };
      setActionFeedback({
        tone: 'error',
        message: errorWithResponse.response?.data?.message || t('activityDetail.enrollError'),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8">
      <section className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-sm">
        <div className="relative h-[320px] bg-slate-100">
          {activity.coverUrl ? (
            <img src={activity.coverUrl} alt={activity.title} className="h-full w-full object-cover" />
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-rose-100 via-white to-orange-100" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/65 to-black/10" />
          <div className="absolute bottom-0 left-0 right-0 p-6 lg:p-8">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-rose-100">
              {t(`categories.${activity.category}`)}
            </p>
            <h1 className="mt-2 text-3xl font-black leading-tight text-white lg:text-4xl">
              {activity.title}
            </h1>
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <article className="space-y-6 rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm lg:p-8">
          <div className="grid gap-4 text-sm text-slate-600 md:grid-cols-2">
            <a href="#activity-location" className="flex items-center gap-2 transition hover:text-rose-600">
              <MapPin size={16} className="text-rose-500" />
              {activity.location}
            </a>
            <p className="flex items-center gap-2">
              <CalendarDays size={16} className="text-rose-500" />
              {formatLongDate(activity.activityAt)}
            </p>
            <p className="flex items-center gap-2">
              <Clock3 size={16} className="text-rose-500" />
              {t('activityDetail.enrollWindow')} {formatLongDate(activity.enrollOpenAt)} - {formatLongDate(activity.enrollCloseAt)}
            </p>
            <p className="flex items-center gap-2">
              <Users size={16} className="text-rose-500" />
              {t('activityDetail.enrolledCount', { count: activity.enrollCount })}
            </p>
          </div>

          <div>
            <h2 className="text-xl font-black text-slate-900">{t('activityDetail.descriptionTitle')}</h2>
            <p className="mt-3 leading-8 text-slate-600">{activity.description}</p>
          </div>

          <section id="activity-location" className="space-y-4 border-t border-slate-100 pt-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="max-w-2xl">
                <h2 className="text-xl font-black text-slate-900">
                  {t('activityDetail.locationTitle')}
                </h2>
                <p className="mt-3 leading-8 text-slate-600">{activity.location}</p>
                <p className="mt-2 text-sm leading-7 text-slate-500">
                  {t('activityDetail.locationDescription')}
                </p>
                {mapModel.hasCoordinates ? (
                  <p className="mt-2 text-sm text-slate-400">
                    {t('activityDetail.latitude')}: {mapModel.latitudeLabel}
                    {' · '}
                    {t('activityDetail.longitude')}: {mapModel.longitudeLabel}
                  </p>
                ) : null}
              </div>

              <a
                href={mapModel.openUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-rose-200 hover:text-rose-600"
              >
                {t('activityDetail.openMap')}
                <ExternalLink size={14} />
              </a>
            </div>

            {mapModel.embedUrl ? (
              <div className="overflow-hidden rounded-[24px] border border-slate-200">
                <iframe
                  title={t('activityDetail.mapFrameTitle', { location: activity.location })}
                  src={mapModel.embedUrl}
                  className="h-[320px] w-full border-0"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
            ) : (
              <div className="rounded-[24px] border border-dashed border-slate-200 px-5 py-8 text-center text-sm leading-7 text-slate-500">
                {t('activityDetail.mapUnavailable')}
              </div>
            )}
          </section>
        </article>

        <aside className="space-y-5 rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
          <div>
            <p className="text-sm font-semibold text-slate-400">{t('activityDetail.ticketPrice')}</p>
            <p className="mt-2 text-4xl font-black text-rose-600">{formatCurrency(activity.price)}</p>
          </div>

          <div className="space-y-3 rounded-2xl bg-rose-50 p-4">
            <p className="text-sm font-semibold text-slate-500">{t('activityDetail.stockLabel')}</p>
            <p className={`text-2xl font-black ${stockMeta.textTone}`}>
              {Math.max(0, stockRemaining ?? activity.stockRemaining).toLocaleString()}
            </p>
            <div className="h-2 rounded-full bg-white">
              <div
                className={`h-2 rounded-full transition-all ${stockMeta.tone}`}
                style={{ width: `${Math.max(0, Math.min(100, stockMeta.percent))}%` }}
              />
            </div>
            <p className="text-xs text-slate-500">
              {t('activityDetail.capacityLabel', { count: activity.maxCapacity })}
            </p>
          </div>

          <div className="rounded-2xl border border-rose-100 bg-white p-4">
            <p className="text-sm font-semibold text-slate-500">
              {countdown.state === 'upcoming'
                ? t('activityDetail.countdownOpen')
                : countdown.state === 'selling'
                  ? t('activityDetail.countdownClose')
                  : t('activityDetail.countdownClosed')}
            </p>
            {countdown.state === 'closed' ? (
              <p className="mt-3 text-lg font-bold text-slate-700">{t('activityDetail.closed')}</p>
            ) : (
              <div className="mt-3 grid grid-cols-4 gap-2 text-center">
                <div className="rounded-xl bg-slate-50 py-2">
                  <p className="text-lg font-black text-slate-900">{remain.days}</p>
                  <p className="text-[10px] text-slate-500">{t('activityDetail.day')}</p>
                </div>
                <div className="rounded-xl bg-slate-50 py-2">
                  <p className="text-lg font-black text-slate-900">{remain.hours}</p>
                  <p className="text-[10px] text-slate-500">{t('activityDetail.hour')}</p>
                </div>
                <div className="rounded-xl bg-slate-50 py-2">
                  <p className="text-lg font-black text-slate-900">{remain.minutes}</p>
                  <p className="text-[10px] text-slate-500">{t('activityDetail.minute')}</p>
                </div>
                <div className="rounded-xl bg-slate-50 py-2">
                  <p className="text-lg font-black text-slate-900">{remain.seconds}</p>
                  <p className="text-[10px] text-slate-500">{t('activityDetail.second')}</p>
                </div>
              </div>
            )}
          </div>

          {actionFeedback ? (
            <div
              className={`rounded-2xl px-4 py-3 text-sm ${
                actionFeedback.tone === 'success'
                  ? 'border border-emerald-200 bg-emerald-50 text-emerald-700'
                  : 'border border-amber-200 bg-amber-50 text-amber-700'
              }`}
            >
              {actionFeedback.message}
            </div>
          ) : null}

          <button
            type="button"
            onClick={() => void handlePrimaryAction()}
            className={`inline-flex w-full items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-60 ${ctaConfig.className}`}
            disabled={ctaConfig.disabled || isSubmitting}
          >
            {isSubmitting ? (
              <Loader2 size={16} className="animate-spin" />
            ) : ctaConfig.mode === 'remind' ? (
              <BellRing size={16} />
            ) : (
              <Ticket size={16} />
            )}
            {isSubmitting ? t('activityDetail.processing') : ctaConfig.label}
          </button>

          <div className="rounded-2xl bg-[#fffaf7] px-4 py-4 text-sm leading-7 text-slate-500">
            {ctaConfig.description}
          </div>
        </aside>
      </section>
    </div>
  );
}
