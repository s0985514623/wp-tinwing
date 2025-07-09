import { z } from 'zod'

export const templates = [
  {
    label: 'General',
    value: 'general',
    color: '#555555',
  },
  {
    label: 'Motor',
    value: 'motor',
    color: '#000000',
  },
  {
    label: 'Short Terms',
    value: 'shortTerms',
    color: '#000000',
  },
  {
    label: 'Package',
    value: 'package',
    color: '#000000',
  },
]

export const ZTemplates = z.enum(['general', 'motor', 'shortTerms', 'package'])
export type TTemplate = z.infer<typeof ZTemplates>

const ZMotorAttr = z
  .object({
    manufacturingYear: z.number(),
    registrationNo: z.string(),
    model: z.string(),
    tonnes: z.string(),
    body: z.string(),
    additionalValues: z.string(),
    namedDriver: z.string(),
    ls: z.number(),
    ncb: z.number(),
    mib: z.number(),
    chassi: z.string(),
  })
  .partial()
  .nullable()

const ZExtraField = z
  .object({
    label: z.string(),
    value: z.string(),
  })
  .partial()
  .nullable()
export const ZDataType = z
  .object({
    id: z.number(),
    note_no: z.string(),
    created_at: z.string(),
    template: ZTemplates,
    date: z.number().nullable(),
    debit_note_id: z.number().nullable(),
    term_id: z.number().nullable(),
    agent_id: z.number().nullable(),
    client_id: z.number().nullable(),
    insurer_id: z.number().nullable(),
    policy_no: z.string().nullable(),
    name_of_insured: z.string().nullable(),
    sum_insured: z.number().nullable(),
    period_of_insurance_from: z.number().nullable(),
    period_of_insurance_to: z.number().nullable(),
    motor_attr: ZMotorAttr,
    premium: z.number().nullable(),
    less: z.number().nullable(),
    levy: z.number().nullable(),
    agent_fee: z.number().nullable(),
    receiptId: z.number().nullable(),
    insurer_fee_percent: z.number().nullable(),
    short_terms_content: z.string().nullable(),
    package_content: z.string().nullable(),
    particulars: z.string().nullable(),
    motor_engine_no: z.string().nullable(),
    remark: z.string().nullable(),
    extra_field: ZExtraField,
    extra_field2: ZExtraField,
    created_from_renewal_id: z.number().nullable(),
    receipt_id: z.number().nullable(),
    is_archived: z.boolean().nullable(),
  })
  .partial()

export type DataType = z.infer<typeof ZDataType>

export const defaultDebitNote: DataType = {
  id: 0,
  note_no: '',
  created_at: '',
  template: 'general',
  date: null,
  term_id: null,
  agent_id: null,
  client_id: null,
  insurer_id: null,
  policy_no: null,
  name_of_insured: null,
  sum_insured: null,
  period_of_insurance_from: null,
  period_of_insurance_to: null,
  motor_attr: null,
  premium: null,
  less: null,
  levy: null,
  agent_fee: null,
  receiptId: null,
  short_terms_content: null,
}
