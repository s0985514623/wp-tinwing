import { DataType as TClient } from 'pages/clients/types';

export const getDisplayName = (client: TClient | undefined) => {
    const display_nameValue = client?.display_name || 'name_en';
    const display_name = client?.[display_nameValue] || client?.name_zh || client?.company || '';

    return !!client ? display_name : '';
};
