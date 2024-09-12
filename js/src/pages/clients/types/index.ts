import { z } from 'zod'

export const ZDataType = z.object({
    id: z.number(),
    created_at: z.string(),
    client_number: z.string(),
    name_en: z.string(),
    name_zh: z.string(),
    address_arr: z.string().array().length(3),
    company: z.string(),
    office_gen_line: z.string(),
    direct_line: z.string(),
    mobile1: z.string(),
    mobile2: z.string(),
    contact2: z.string(),
    tel2: z.string(),
    contact3: z.string(),
    tel3: z.string(),
    remark: z.string(),
    agent_id: z.number().nullable(),
    display_name: z.enum(['name_en', 'name_zh', 'company']).nullable(),
})

export type DataType = z.infer<typeof ZDataType>

export const defaultClient = {
    id: 0,
    created_at: '',
    client_number: '',
    name_en: '',
    name_zh: '',
    address_arr: ['', '', ''],
    company: '',
    office_gen_line: '',
    direct_line: '',
    mobile1: '',
    mobile2: '',
    contact2: '',
    tel2: '',
    contact3: '',
    tel3: '',
    remark: '',
    agent_id: null,
    display_name: null,
}
