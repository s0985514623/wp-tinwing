import { FormInstance } from 'antd';
import { useLocation } from 'react-router-dom';

const useDebitNoteId = (form: FormInstance) => {
    const { state } = useLocation();
    const debit_note_id = state?.debit_note_id || 0;

    if (debit_note_id) {
        form.setFieldValue(['debit_note_id'], debit_note_id);
    }

    return debit_note_id;
};

export default useDebitNoteId;
