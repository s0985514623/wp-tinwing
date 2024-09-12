import { Dayjs } from 'dayjs';

export type TSearchProps = {
    dateRange?: [Dayjs, Dayjs];
};

export type TTemplateProps = {
    resource: string;
};

export type TRequiredProps = {
    note_no: string;
    date: number;
    payment_date: number;
    premium: number;
};
