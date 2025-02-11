import { z } from 'zod';

export const ZDataType = z.object({
    id: z.number(),
    created_at: z.string(),
    date: z.number().nullable(),
    debit_note_id: z.number().nullable(),
    payment_date: z.number().nullable(),
    payment_method: z.string().nullable(),
    cheque_no: z.string().nullable(),
    code_no: z.string().nullable(),
    receipt_no: z.string().nullable(),
    premium: z.number().nullable(),
    payment_receiver_account: z.string().nullable(),
		is_paid: z.boolean().nullable(),
		remark: z.string().nullable(),
		created_from_renewal_id:z.number().nullable(),
		created_from_credit_note_id:z.number().nullable(),
		invoice_no: z.string().nullable(),
		pay_to_insurer_by_bank: z.string().nullable(),
		pay_to_insurer_by_cheque: z.string().nullable(),
		pay_to_insurer_by_invoice: z.string().nullable(),
		pay_to_insurer_by_payment_date: z.number().nullable(),
});

export type DataType = z.infer<typeof ZDataType>;
