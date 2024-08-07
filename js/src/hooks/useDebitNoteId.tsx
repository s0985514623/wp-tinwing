import { FormInstance } from 'antd';
import { useLocation } from 'react-router-dom';

const useDebitNoteId = (form: FormInstance) => {
    const { state } = useLocation();
    const debitNoteId = state?.debitNoteId || 0;

    if (debitNoteId) {
        form.setFieldValue(['debitNoteId'], debitNoteId);
    }

    return debitNoteId;
};

export default useDebitNoteId;
