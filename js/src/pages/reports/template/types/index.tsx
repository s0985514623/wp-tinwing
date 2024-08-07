import { Dayjs } from 'dayjs';

export type TSearchProps = {
    dateRange?: [Dayjs, Dayjs];
};

export type TTemplateProps = {
    resource: string;
};

export type TRequiredProps = {
    noteNo: string;
    date: number;
    paymentDate: number;
    premium: number;
};
