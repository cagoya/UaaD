import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { ActivityCategory, MerchantActivityInput } from '../types';
import { CATEGORY_OPTIONS } from '../constants/public';

interface MerchantFormProps {
  initialValue?: MerchantActivityInput;
  submitLabel: string;
  loading?: boolean;
  onSubmit: (payload: MerchantActivityInput) => Promise<void>;
}

const defaultValue: MerchantActivityInput = {
  title: '',
  description: '',
  coverUrl: '',
  location: '',
  category: 'CONCERT',
  maxCapacity: 1000,
  price: 0,
  enrollOpenAt: '',
  enrollCloseAt: '',
  activityAt: '',
};

function toDatetimeLocal(iso: string) {
  if (!iso) {
    return '';
  }
  const date = new Date(iso);
  const offsetMs = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
}

function fromDatetimeLocal(value: string) {
  if (!value) {
    return '';
  }
  return new Date(value).toISOString();
}

export function MerchantForm({ initialValue, submitLabel, loading, onSubmit }: MerchantFormProps) {
  const { t } = useTranslation();
  const [form, setForm] = useState<MerchantActivityInput>({
    ...defaultValue,
    ...initialValue,
  });
  const [error, setError] = useState('');

  const categoryOptions = useMemo(
    () =>
      CATEGORY_OPTIONS.filter((item) => item.value !== 'ALL').map((item) => ({
        value: item.value as ActivityCategory,
        label: t(`categories.${item.value}`),
      })),
    [t],
  );

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');

    const openAt = new Date(form.enrollOpenAt).getTime();
    const closeAt = new Date(form.enrollCloseAt).getTime();
    const activityAt = new Date(form.activityAt).getTime();

    if (!(openAt < closeAt && closeAt < activityAt)) {
      setError(t('merchant.form.timeInvalid'));
      return;
    }

    await onSubmit(form).catch(() => {
      setError(t('merchant.form.submitFailed'));
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="grid gap-5 md:grid-cols-2">
        <label className="space-y-2 md:col-span-2">
          <span className="text-sm font-semibold text-slate-700">{t('merchant.form.title')}</span>
          <input
            required
            value={form.title}
            onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-rose-300 focus:ring-2 focus:ring-rose-100"
            placeholder={t('merchant.form.titlePlaceholder')}
          />
        </label>

        <label className="space-y-2 md:col-span-2">
          <span className="text-sm font-semibold text-slate-700">{t('merchant.form.description')}</span>
          <textarea
            required
            rows={4}
            value={form.description}
            onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-rose-300 focus:ring-2 focus:ring-rose-100"
            placeholder={t('merchant.form.descriptionPlaceholder')}
          />
        </label>

        <label className="space-y-2">
          <span className="text-sm font-semibold text-slate-700">{t('merchant.form.location')}</span>
          <input
            required
            value={form.location}
            onChange={(event) => setForm((prev) => ({ ...prev, location: event.target.value }))}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-rose-300 focus:ring-2 focus:ring-rose-100"
            placeholder={t('merchant.form.locationPlaceholder')}
          />
        </label>

        <label className="space-y-2">
          <span className="text-sm font-semibold text-slate-700">{t('merchant.form.category')}</span>
          <select
            value={form.category}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, category: event.target.value as ActivityCategory }))
            }
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-rose-300 focus:ring-2 focus:ring-rose-100"
          >
            {categoryOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-2">
          <span className="text-sm font-semibold text-slate-700">{t('merchant.form.capacity')}</span>
          <input
            required
            min={1}
            type="number"
            value={form.maxCapacity}
            onChange={(event) => setForm((prev) => ({ ...prev, maxCapacity: Number(event.target.value) }))}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-rose-300 focus:ring-2 focus:ring-rose-100"
          />
        </label>

        <label className="space-y-2">
          <span className="text-sm font-semibold text-slate-700">{t('merchant.form.price')}</span>
          <input
            min={0}
            step={1}
            type="number"
            value={form.price}
            onChange={(event) => setForm((prev) => ({ ...prev, price: Number(event.target.value) }))}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-rose-300 focus:ring-2 focus:ring-rose-100"
          />
        </label>

        <label className="space-y-2 md:col-span-2">
          <span className="text-sm font-semibold text-slate-700">{t('merchant.form.coverUrl')}</span>
          <input
            value={form.coverUrl}
            onChange={(event) => setForm((prev) => ({ ...prev, coverUrl: event.target.value }))}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-rose-300 focus:ring-2 focus:ring-rose-100"
            placeholder="https://..."
          />
        </label>

        <label className="space-y-2">
          <span className="text-sm font-semibold text-slate-700">{t('merchant.form.enrollOpenAt')}</span>
          <input
            required
            type="datetime-local"
            value={toDatetimeLocal(form.enrollOpenAt)}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, enrollOpenAt: fromDatetimeLocal(event.target.value) }))
            }
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-rose-300 focus:ring-2 focus:ring-rose-100"
          />
        </label>

        <label className="space-y-2">
          <span className="text-sm font-semibold text-slate-700">{t('merchant.form.enrollCloseAt')}</span>
          <input
            required
            type="datetime-local"
            value={toDatetimeLocal(form.enrollCloseAt)}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, enrollCloseAt: fromDatetimeLocal(event.target.value) }))
            }
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-rose-300 focus:ring-2 focus:ring-rose-100"
          />
        </label>

        <label className="space-y-2 md:col-span-2">
          <span className="text-sm font-semibold text-slate-700">{t('merchant.form.activityAt')}</span>
          <input
            required
            type="datetime-local"
            value={toDatetimeLocal(form.activityAt)}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, activityAt: fromDatetimeLocal(event.target.value) }))
            }
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-rose-300 focus:ring-2 focus:ring-rose-100"
          />
        </label>
      </div>

      {error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-500">{error}</p>
      ) : null}

      <button
        type="submit"
        disabled={loading}
        className="rounded-full bg-rose-500 px-6 py-3 text-sm font-bold text-white transition hover:bg-rose-600 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? t('merchant.form.submitting') : submitLabel}
      </button>
    </form>
  );
}
