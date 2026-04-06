import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { MerchantForm } from '../components/MerchantForm';
import { createMerchantActivity } from '../api/endpoints';

export default function MerchantActivityNewPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-3xl font-black text-white">{t('merchant.createActivity')}</h2>
        <p className="mt-2 text-slate-300">{t('merchant.createSubtitle')}</p>
      </div>

      <MerchantForm
        loading={loading}
        submitLabel={t('merchant.createSubmit')}
        onSubmit={async (payload) => {
          setLoading(true);
          await createMerchantActivity(payload);
          setLoading(false);
          navigate('/merchant/activities', { state: { message: t('merchant.createSuccess') } });
        }}
      />
    </div>
  );
}
