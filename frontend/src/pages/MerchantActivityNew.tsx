import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlusCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { MerchantForm } from '../components/MerchantForm';
import { createMerchantActivity } from '../api/endpoints';
import { MerchantPageHeader } from '../components/merchant/MerchantPageHeader';

export default function MerchantActivityNewPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  return (
    <div className="space-y-5">
      <MerchantPageHeader
        eyebrow={t('merchant.panel')}
        title={t('merchant.createActivity')}
        description={t('merchant.createSubtitle')}
        actions={
          <div className="inline-flex items-center gap-2 rounded-full border border-rose-200 bg-white px-4 py-2 text-sm font-semibold text-rose-600">
            <PlusCircle size={16} />
            {t('merchant.createActivity')}
          </div>
        }
      />

      <MerchantForm
        loading={loading}
        submitLabel={t('merchant.createSubmit')}
        onSubmit={async (payload) => {
          setLoading(true);
          try {
            const result = await createMerchantActivity(payload);
            navigate('/merchant/activities', {
              state: {
                feedback: {
                  tone: 'success',
                  title: t('merchant.successTitle'),
                  message: result.message || t('merchant.createSuccess'),
                },
              },
            });
          } finally {
            setLoading(false);
          }
        }}
      />
    </div>
  );
}
