import { TTemplate } from 'pages/debitNotes/types';

export const getTemplateText = (
    template: TTemplate,
): {
    zh: string;
    en: string;
} => {
    switch (template) {
        case 'motor':
            return {
                zh: '汽車保險',
                en: 'Motor Insurance',
            };
        case 'general':
            return {
                zh: '一般保險',
                en: 'General Insurance',
            };
        case 'shortTerms':
            return {
                zh: '短期保險',
                en: 'Short Terms',
            };
        case 'package':
            return {
                zh: '',
                en: 'Package',
            };
        case 'marineInsurance':
            return {
                zh: '海上保險',
                en: 'Marine Insurance',
            };
        default:
            return {
                zh: '一般保險',
                en: 'General Insurance',
            };
    }
};
