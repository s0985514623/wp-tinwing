import { z } from 'zod'

export const ZDataType = z.object({
    id: z.number(),
    created_at: z.string(),
    insurerProductsNumber: z.string(),
    name: z.string(),
    termId: z.number(),
    policyNo: z.string(),
    insuranceAmount: z.number(),
    remark: z.string(),
    debitNoteIds: z.array(z.number()),
    insurerId: z.number(),
})

export type DataType = z.infer<typeof ZDataType>
