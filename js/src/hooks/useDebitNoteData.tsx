import { useLocation } from 'react-router-dom';
import { useOne } from '@refinedev/core';
import { DataType } from 'pages/debitNotes/types';
// import dayjs from 'dayjs';

const useDebitNoteData = () => {
    const { state } = useLocation();
    const debitNoteId = state?.debitNoteId || 0;
    const { data: debitNoteResult } = useOne<DataType>({
        resource: 'debit_notes',
        id: debitNoteId,
        queryOptions: {
            enabled: !!debitNoteId,
        },
    });

    return debitNoteResult;
};

export default useDebitNoteData;
