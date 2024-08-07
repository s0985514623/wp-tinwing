import { z } from 'zod'

export const ZDataType = z.object({
	id: z.number(),
	created_at: z.string(),
	date: z.number(),
	amount: z.number(),
	remark: z.string(),
	termId:z.number(),

})

export type DataType = z.infer<typeof ZDataType>
