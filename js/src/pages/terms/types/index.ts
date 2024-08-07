import { z } from 'zod'

export const ZDataType = z.object({
    id: z.number(),
    created_at: z.string(),
    name: z.string(),
    taxonomy: z.string(),
})

export type DataType = z.infer<typeof ZDataType>
