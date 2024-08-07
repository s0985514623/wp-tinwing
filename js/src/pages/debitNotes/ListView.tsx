import { useMany, CrudFilters, useExport } from '@refinedev/core';
import { List, useTable, EditButton, DeleteButton, ShowButton, ExportButton } from '@refinedev/antd';
import { Space, Table } from 'antd';
import { DataType, ZDataType } from './types';
import { DataType as TClient, defaultClient } from 'pages/clients/types';
import { DataType as TTerm } from 'pages/terms/types';
import { safeParse, getSortProps, getTotalPremiumByDebitNote } from 'utils';
import Filter from '../clientsSummary/Components/Filter';
import dayjs from 'dayjs';
import { useColumnSearch } from 'hooks';

export const ListView: React.FC = () => {
    //Export CSV
    const { triggerExport, isLoading: exportLoading } = useExport<DataType>({
        mapData: (item) => {
            return {
                ...item,
                date: dayjs.unix(item?.date as number).format('YYYY-MM-DD'),
                periodOfInsuranceFrom: dayjs.unix(item?.periodOfInsuranceFrom as number).format('YYYY-MM-DD'),
                periodOfInsuranceTo: dayjs.unix(item?.periodOfInsuranceTo as number).format('YYYY-MM-DD'),
                motorAttr: JSON.stringify(item?.motorAttr),
                extraField: JSON.stringify(item?.extraField),
            };
        },
    });
    const { tableProps, searchFormProps } = useTable<DataType>({
        sorters: {
            initial: [
                {
                    field: 'id',
                    order: 'desc',
                },
            ],
        },
        filters: {
            initial: [
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
            ];
            return filters as CrudFilters;
        },
    });
    const formattedTableProps = {
        ...tableProps,
        dataSource: tableProps?.dataSource?.map((theRecord) => {
            const motorAttr = theRecord?.motorAttr;
            const formattedMotorAttr = motorAttr
                ? {
                      ...motorAttr,
                      ls: motorAttr?.ls ? Number(motorAttr?.ls) : undefined,
                      mib: motorAttr?.mib ? Number(motorAttr?.mib) : undefined,
                      ncb: motorAttr?.ncb ? Number(motorAttr?.ncb) : undefined,
                  }
                : null;

            return {
                ...theRecord,
                motorAttr: formattedMotorAttr,
            };
        }) as DataType[],
    };

    const parsedTableProps = safeParse<DataType>({
        tableProps: formattedTableProps,
        ZDataType: ZDataType,
    });
    const { data: termData, isLoading: termIsLoading } = useMany<TTerm>({
        resource: 'terms',
        ids: parsedTableProps?.dataSource?.map((theRecord) => theRecord?.termId || '0') ?? [],
        queryOptions: {
            enabled: !!parsedTableProps?.dataSource,
        },
    });

    const { data: insurerData, isLoading: insurerIsLoading } = useMany({
        resource: 'insurers',
        ids: parsedTableProps?.dataSource?.map((theRecord) => theRecord?.insurerId || '0') ?? [],
        queryOptions: {
            enabled: !!parsedTableProps?.dataSource,
        },
    });

    const { data: clientData, isLoading: clientIsLoading } = useMany<TClient>({
        resource: 'clients',
        ids: parsedTableProps?.dataSource?.map((theRecord) => theRecord?.clientId || '0') ?? [],
        queryOptions: {
            enabled: !!parsedTableProps?.dataSource,
        },
    });
    const clients = (clientData?.data || []) as TClient[];

    const { getColumnSearchProps } = useColumnSearch<DataType>();

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
            text: 'Package',
            value: 'package',
        },
        {
            text: 'Others',
            value: 'others',
        },
    ];
    const InsuranceClassOptions = termData?.data?.map((item) => ({ text: item.name, value: item.id }));
    return (
        <List headerButtons={<ExportButton onClick={triggerExport} loading={exportLoading} />}>
            <Filter formProps={searchFormProps} />
            <Table
                {...parsedTableProps}
                //Refine的onChange會重新送出request,這邊複寫onChange,避免重新送出request
                onChange={() => {
                    return;
                }}
                rowKey="id"
                size="middle">
                <Table.Column width={100} dataIndex="periodOfInsuranceTo" title="End Date" render={(periodOfInsuranceTo: number) => (periodOfInsuranceTo ? dayjs.unix(periodOfInsuranceTo).format('YYYY-MM-DD') : '')} {...getSortProps<DataType>('periodOfInsuranceTo')} />
                <Table.Column
                    width={100}
                    dataIndex="noteNo"
                    title="Note No."
                    {...getColumnSearchProps({
                        dataIndex: 'noteNo',
                    })}
                />
                <Table.Column
                    width={120}
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
                    dataIndex="id"
                    title="Client"
                    {...getColumnSearchProps({
                        dataIndex: 'id',
                        render: (id, record) => {
                            const clientId = record?.clientId;
                            const theClient = clients.find((client) => client.id === clientId) || defaultClient;
                            const displayNameDataIndex = theClient?.displayName || 'nameEn';
                            const displayName = theClient?.[displayNameDataIndex] || 'N/A';
                            return clientIsLoading && !displayName ? ((<>Loading...</>) as React.ReactNode) : displayName;
                        },
                        renderText: (id, record) => {
                            const clientId = record?.clientId;
                            const theClient = clients.find((client) => client.id === clientId) || defaultClient;
                            const displayNameDataIndex = theClient?.displayName || 'nameEn';
                            const displayName = theClient?.[displayNameDataIndex] || 'N/A';
                            return clientIsLoading && !displayName ? '' : displayName;
                        },
                    })}
                />
                <Table.Column
                    dataIndex="id"
                    title="Total Premium"
                    render={(id: number, record: DataType) => {
                        const totalPremium = getTotalPremiumByDebitNote(record);
                        return totalPremium;
                    }}
                    sorter={(a, b) => getTotalPremiumByDebitNote(a) - getTotalPremiumByDebitNote(b)}
                />
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
                    dataIndex="termId"
                    title="Class of Insurance"
                    filters={InsuranceClassOptions}
                    onFilter={(value, record: DataType) => {
                        return (record?.termId || undefined) === value;
                    }}
                    render={(termId: number) => (termIsLoading ? <>Loading...</> : termData?.data?.find((theTerm) => theTerm.id === termId)?.name)}
                />
                <Table.Column
                    dataIndex="nameOfInsured"
                    title="Name of Insured"
                    {...getColumnSearchProps({
                        dataIndex: 'nameOfInsured',
                    })}
                />
                <Table.Column
                    dataIndex="insurerId"
                    title="Insurer"
                    {...getColumnSearchProps({
                        dataIndex: 'insurerId',
                        render: (insurerId) => (insurerIsLoading ? <>Loading...</> : insurerData?.data?.find((theInsurer) => theInsurer.id === insurerId)?.name),
                        renderText: (insurerId) => (insurerIsLoading ? '' : insurerData?.data?.find((theInsurer) => theInsurer.id === insurerId)?.name || ''),
                    })}
                />
                <Table.Column
                    dataIndex="policyNo"
                    title="Policy Number"
                    {...getColumnSearchProps({
                        dataIndex: 'policyNo',
                    })}
                />
                <Table.Column
                    width={120}
                    dataIndex="id"
                    title=""
                    render={(id) => {
                        return (
                            <>
                                <Space>
                                    <ShowButton resource="debit_notes" type="primary" hideText shape="circle" size="small" recordItemId={id} />
                                    <EditButton resource="debit_notes" type="primary" hideText shape="circle" size="small" recordItemId={id} />
                                    <DeleteButton resource="debit_notes" type="primary" danger hideText shape="circle" size="small" recordItemId={id} />
                                </Space>
                            </>
                        );
                    }}
                />
            </Table>
        </List>
    );
};
