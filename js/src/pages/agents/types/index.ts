import { z } from 'zod'

export const ZDataType = z.object({
    id: z.number(),
    created_at: z.string(),
    agent_number: z.string(),
    name: z.string(),
    contact1: z.string(),
    tel1: z.string(),
    contact2: z.string(),
    tel2: z.string(),
})

export type DataType = z.infer<typeof ZDataType>
