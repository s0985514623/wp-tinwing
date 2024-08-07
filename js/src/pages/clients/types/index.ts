import { z } from 'zod'

export const ZDataType = z.object({
    id: z.number(),
    created_at: z.string(),
    clientNumber: z.string(),
    nameEn: z.string(),
    nameZh: z.string(),
    addressArr: z.string().array().length(3),
    company: z.string(),
    officeGenLine: z.string(),
    directLine: z.string(),
    mobile1: z.string(),
    mobile2: z.string(),
    contact2: z.string(),
    tel2: z.string(),
    contact3: z.string(),
    tel3: z.string(),
    remark: z.string(),
    agentId: z.number().nullable(),
    displayName: z.enum(['nameEn', 'nameZh', 'company']).nullable(),
})

export type DataType = z.infer<typeof ZDataType>

export const defaultClient = {
    id: 0,
    created_at: '',
    clientNumber: '',
    nameEn: '',
    nameZh: '',
    addressArr: ['', '', ''],
    company: '',
    officeGenLine: '',
    directLine: '',
    mobile1: '',
    mobile2: '',
    contact2: '',
    tel2: '',
    contact3: '',
    tel3: '',
    remark: '',
    agentId: null,
    displayName: null,
}
