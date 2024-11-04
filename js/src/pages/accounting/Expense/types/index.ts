import { z } from 'zod'

export const ZDataType = z.object({
	id: z.number(),
	created_at: z.string(),
	date: z.number(),
	amount: z.number(),
	remark: z.string(),
	term_id:z.number(),
	payment_receiver_account: z.string(),
	cheque_no: z.string(),

})

export type DataType = z.infer<typeof ZDataType>
