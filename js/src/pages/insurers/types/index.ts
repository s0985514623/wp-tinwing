import { z } from 'zod'

export const ZDataType = z.object({
    id: z.number(),
    created_at: z.string(),
    insurer_number: z.string(),
    name: z.string(),
    payment_rate: z.number(),
})

export type DataType = z.infer<typeof ZDataType>
