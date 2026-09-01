import { z } from 'zod'

export const ZDataType = z.object({
	id: z.number(),
	created_at: z.string(),
	date: z.number(),
	amount: z.number(),
	remark: z.string(),
	// other_earnings 這個 resource 沒有 term_id / cheque_no，故放寬
	term_id:z.number().nullable().optional(),
	payment_receiver_account: z.string(),
	cheque_no: z.string().nullable().optional(),
	payment_date: z.number(),

})

export type DataType = z.infer<typeof ZDataType>
