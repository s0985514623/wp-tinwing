import { useMany, HttpError, CrudFilters, CrudSorting } from '@refinedev/core';
import { useTable } from '@refinedev/antd';
import { Table } from 'antd';
import { DataType } from 'pages/debitNotes/types';
import { DataType as TClient, defaultClient } from 'pages/clients/types';
import { DataType as TTerm } from 'pages/terms/types';
import { DataType as TRenewals } from 'pages/renewals/types';
import { getSortProps } from 'utils';
import dayjs from 'dayjs';
import DetailTable from './Components/DetailTable';
import { useColumnSearch } from 'hooks';
import Filter from './Components/Filter';

//設定排序與篩選初始化與搜尋條件
const termOptions = {
    sorters: {
        initial: [
            {
                field: 'date',
                order: 'desc',
            },
        ] as CrudSorting,
    },
    filters: {
        initial: [
            {
                field: 'isArchived',
                operator: 'eq',
                value: false,
            },
            {
                field: 'periodOfInsuranceTo',
                operator: 'gt',
                value: dayjs('2022-01-01').unix(),
            },
        ] as CrudFilters,
    },
    onSearch: (values: any) => {
        const filters = [
            {
                field: 'periodOfInsuranceTo',
                operator: 'gt',
                value: values?.dateRange ? dayjs(values?.dateRange[0]?.startOf('day')).unix() : undefined,
            },
            {
                field: 'periodOfInsuranceTo',
                operator: 'lt',
                value: values?.dateRange ? dayjs(values?.dateRange[1]?.startOf('day')).unix() : undefined,
            },
            {
                field: 'motorEngineNo',
                operator: 'eq',
                value: values?.motorEngineNo === '' ? undefined : values?.motorEngineNo,
            },
            {
                field: 'isArchived',
                operator: 'eq',
                value: values?.isArchived,
            },
        ];
        return filters as CrudFilters;
    },
};

export const ListView: React.FC = () => {
    //取得renewals的資料
    const { tableProps: renewalData, searchFormProps: renewalSearchForm } = useTable<TRenewals, HttpError>({
        resource: 'renewals',
        ...termOptions,
    });
    // console.log('🚀 ~ renewalData:', renewalData);
    //取得debit_notes的資料
    const { tableProps, searchFormProps } = useTable<DataType, HttpError>({
        resource: 'debit_notes',
        ...termOptions,
    });
    // console.log('🚀 ~ tableProps:', tableProps);
    //合併renewals 與 debit_notes資料
    const formatTableData = [...(renewalData?.dataSource ?? []), ...(tableProps?.dataSource ?? [])];
    // console.log('🚀 ~ formatTableData:', formatTableData);
    const formatSearchFormProps = {
        ...renewalSearchForm,
        ...searchFormProps,
        onFinish: async (values: any) => {
            if (renewalSearchForm?.onFinish && searchFormProps?.onFinish) {
                renewalSearchForm?.onFinish(values);
                searchFormProps?.onFinish(values);
            }
        },
    };
    const debitNotesResult = tableProps?.dataSource;
    const debitNotes = (debitNotesResult || []) as DataType[];

    const templatesOptions = [
        {
            text: 'General',
            value: 'general',
        },
        {
            text: 'Motor',
            value: 'motor',
        },
        {
            text: 'Short Terms',
            value: 'shortTerms',
        },
        {
            text: 'Others',
            value: 'others',
        },
    ];

    const { data: termData, isLoading: _termIsLoading } = useMany({
        resource: 'terms',
        ids: debitNotes?.map((theRecord) => theRecord?.termId || '0') ?? [],
        queryOptions: {
            enabled: debitNotes.length > 0,
        },
    });
    const terms = (termData?.data || []) as TTerm[];

    const { data: clientData, isLoading: clientIsLoading } = useMany({
        resource: 'clients',
        ids: formatTableData?.map((theRecord) => theRecord?.clientId || '0') ?? [],
        queryOptions: {
            enabled: formatTableData.length > 0,
        },
    });
    const clients = (clientData?.data || []) as TClient[];

    const { getColumnSearchProps } = useColumnSearch<DataType>();

    return (
        <>
            <Filter formProps={formatSearchFormProps} />
            <Table
                {...{
                    dataSource: formatTableData,
                    expandable: {
                        expandedRowRender: (record: any) => {
                            const theTerm = terms.find((term) => term.id === record.termId);
                            return <DetailTable record={record} term={theTerm} />;
                        },
                    },
                }}
                rowKey={(record) => `${record.date}-${record.id}`}
                size="middle">
                <Table.Column
                    dataIndex="template"
                    title="Type"
                    render={(value) => templatesOptions.find((item) => item.value === value)?.text}
                    filters={templatesOptions}
                    onFilter={(value, record: DataType) => {
                        if (value === 'others') return record?.template !== 'general' && record?.template !== 'motor' && record?.template !== 'shortTerms';
                        return (record?.template || undefined) === value;
                    }}
                />
                <Table.Column
                    dataIndex="noteNo"
                    title="Note No."
                    {...getColumnSearchProps({
                        dataIndex: 'noteNo',
                    })}
                />
                <Table.Column
                    dataIndex="clientId"
                    title="Client No"
                    {...getSortProps<DataType>('clientId')}
                    {...getColumnSearchProps({
                        dataIndex: 'clientId',
                        render: (clientId) => {
                            const clientNumber = clients.find((client) => client.id === clientId)?.clientNumber || 'N/A';
                            return clientIsLoading && !clientNumber ? ((<>Loading...</>) as React.ReactNode) : (clientNumber.toString() as React.ReactNode);
                        },
                        renderText: (clientId) => {
                            const clientNumber = clients.find((client) => client.id === clientId)?.clientNumber || 'N/A';
                            return clientIsLoading && !clientNumber ? '' : (clientNumber.toString() as string);
                        },
                    })}
                />

                <Table.Column
                    dataIndex="created_at"
                    title="Display Name"
                    {...getColumnSearchProps({
                        dataIndex: 'created_at',
                        render: (_, record) => {
                            const clientId = record?.clientId || 0;
                            const theClient = clients.find((client) => client.id === clientId) || defaultClient;
                            const displayNameDataIndex = theClient?.displayName || 'nameEn';
                            const displayName = theClient?.[displayNameDataIndex] || 'N/A';

                            return clientIsLoading ? <>Loading...</> : displayName;
                        },
                        renderText: (_, record) => {
                            const clientId = record?.clientId || 0;
                            const theClient = clients.find((client) => client.id === clientId) || defaultClient;
                            const displayNameDataIndex = theClient?.displayName || 'nameEn';
                            const displayName = theClient?.[displayNameDataIndex] || 'N/A';
                            return clientIsLoading ? '' : displayName;
                        },
                    })}
                />
                {/* <Table.Column
                    dataIndex="statusFiled"
                    title="Status Filed"
                    {...getColumnSearchProps({
                        dataIndex: 'statusFiled',
                    })}
                    render={(statusFiled) => {
                        if (statusFiled === 'quotations') return 'Quotation';
                        if (statusFiled === 'receipts') return 'Receipt';
                        if (statusFiled === 'renewals') return 'Renewal';
                        if (statusFiled === 'debit_notes') return 'Debit Note';
                        return 'N/A';
                    }}
                /> */}
                {/* <Table.Column dataIndex="termId" title="Class" render={(termId: number) => terms.find((term) => term.id === termId)?.name || ''} filters={termOptions} onFilter={(value, record: DataType) => (record?.termId || 0) === value} /> */}
                <Table.Column dataIndex="periodOfInsuranceFrom" title="Effective Date" render={(periodOfInsuranceFrom: number) => (periodOfInsuranceFrom ? dayjs.unix(periodOfInsuranceFrom).format('YYYY-MM-DD') : '')} {...getSortProps<DataType>('periodOfInsuranceFrom')} />
                <Table.Column dataIndex="periodOfInsuranceTo" title="End Date" render={(periodOfInsuranceTo: number) => (periodOfInsuranceTo ? dayjs.unix(periodOfInsuranceTo).format('YYYY-MM-DD') : '')} {...getSortProps<DataType>('periodOfInsuranceTo')} />
                <Table.Column dataIndex="date" title="Bill Date" render={(periodOfInsuranceTo: number) => (periodOfInsuranceTo ? dayjs.unix(periodOfInsuranceTo).format('YYYY-MM-DD') : '')} {...getSortProps<DataType>('periodOfInsuranceTo')} />
            </Table>
        </>
    );
};
