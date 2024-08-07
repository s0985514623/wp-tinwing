import { DataType as TClient } from 'pages/clients/types';

export const getDisplayName = (client: TClient | undefined) => {
    const displayNameValue = client?.displayName || 'nameEn';
    const displayName = client?.[displayNameValue] || client?.nameZh || client?.company || '';

    return !!client ? displayName : '';
};
