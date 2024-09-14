import { useLocation } from 'react-router-dom';
import { useOne } from '@refinedev/core';
import { DataType } from 'pages/debitNotes/types';
// import dayjs from 'dayjs';

const useDebitNoteData = () => {
    const { state } = useLocation();
    // console.log("🚀 ~ useDebitNoteData ~ state:", state)
    const debit_note_id = state?.debit_note_id || 0;
    const { data: debitNoteResult } = useOne<DataType>({
        resource: 'debit_notes',
        id: debit_note_id,
        queryOptions: {
            enabled: !!debit_note_id,
        },
    });

    return debitNoteResult;
};

export default useDebitNoteData;
