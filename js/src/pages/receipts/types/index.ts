import { z } from 'zod';

export const ZDataType = z.object({
    id: z.number(),
    created_at: z.string(),
    date: z.number().nullable(),
    debitNoteId: z.number().nullable(),
    paymentDate: z.number().nullable(),
    paymentMethod: z.string().nullable(),
    chequeNo: z.string().nullable(),
    codeNo: z.string().nullable(),
    receiptNo: z.string().nullable(),
    premium: z.number().nullable(),
    payment_receiver_account: z.string().nullable(),
		isPaid: z.boolean().nullable(),
		remark: z.string().nullable(),
		createdFromRenewalId:z.number().nullable(),
});

export type DataType = z.infer<typeof ZDataType>;
