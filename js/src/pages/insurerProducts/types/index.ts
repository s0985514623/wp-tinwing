import { z } from 'zod'

export const ZDataType = z.object({
    id: z.number(),
    created_at: z.string(),
    insurer_products_number: z.string(),
    name: z.string(),
    term_id: z.number(),
    policy_no: z.string(),
    insurance_amount: z.number(),
    remark: z.string(),
    debit_note_ids: z.array(z.number()),
    insurer_id: z.number(),
})

export type DataType = z.infer<typeof ZDataType>
