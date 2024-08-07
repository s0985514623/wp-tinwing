import { z } from 'zod';

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
];

export const ZTemplates = z.enum(['general', 'motor', 'shortTerms', 'package']);
export type TTemplate = z.infer<typeof ZTemplates>;

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
    .nullable();

const ZExtraField = z
    .object({
        label: z.string(),
        value: z.string(),
    })
    .partial()
    .nullable();
export const ZDataType = z
    .object({
        id: z.number(),
        noteNo: z.string(),
        created_at: z.string(),
        template: ZTemplates,
        date: z.number().nullable(),
				debitNoteId: z.number().nullable(),
        termId: z.number().nullable(),
        agentId: z.number().nullable(),
        clientId: z.number().nullable(),
        insurerId: z.number().nullable(),
        policyNo: z.string().nullable(),
        nameOfInsured: z.string().nullable(),
        sumInsured: z.number().nullable(),
        periodOfInsuranceFrom: z.number().nullable(),
        periodOfInsuranceTo: z.number().nullable(),
        motorAttr: ZMotorAttr,
        premium: z.number().nullable(),
        less: z.number().nullable(),
        levy: z.number().nullable(),
        agentFee: z.number().nullable(),
        receiptId: z.number().nullable(),
        insurerFeePercent: z.number().nullable(),
        shortTermsContent: z.string().nullable(),
				packageContent: z.string().nullable(),
        particulars: z.string().nullable(),
        motorEngineNo: z.string().nullable(),
        remark: z.string().nullable(),
        extraField: ZExtraField,
        extraField2: ZExtraField,
				createdFromRenewalId:z.number().nullable(),
    })
    .partial();

export type DataType = z.infer<typeof ZDataType>;

export const defaultDebitNote: DataType = {
    id: 0,
    noteNo: '',
    created_at: '',
    template: 'general',
    date: null,
    termId: null,
    agentId: null,
    clientId: null,
    insurerId: null,
    policyNo: null,
    nameOfInsured: null,
    sumInsured: null,
    periodOfInsuranceFrom: null,
    periodOfInsuranceTo: null,
    motorAttr: null,
    premium: null,
    less: null,
    levy: null,
    agentFee: null,
    receiptId: null,
    shortTermsContent: null,
};
