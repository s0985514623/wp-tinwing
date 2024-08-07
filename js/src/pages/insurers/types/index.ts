import { z } from 'zod'

export const ZDataType = z.object({
    id: z.number(),
    created_at: z.string(),
    insurerNumber: z.string(),
    name: z.string(),
    paymentRate: z.number(),
})

export type DataType = z.infer<typeof ZDataType>
