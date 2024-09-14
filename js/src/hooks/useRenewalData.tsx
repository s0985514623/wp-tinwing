import { useLocation } from 'react-router-dom';
import { useOne } from '@refinedev/core';
import { DataType } from 'pages/renewals/types';

const useRenewalData = () => {
    const { state } = useLocation();
    // console.log("🚀 ~ useRenewalData ~ state:", state)
    const renewalId = state?.renewalId || null;
    if (renewalId == null) return null;
    const { data: renewalResult } = useOne<DataType>({
        resource: 'renewals',
        id: renewalId,
        queryOptions: {
            enabled: !!renewalId,
        },
    });

    return renewalResult;
};

export default useRenewalData;
