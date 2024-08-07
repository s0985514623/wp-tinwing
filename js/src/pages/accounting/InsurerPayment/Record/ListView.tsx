import { useState } from 'react';
import { useMany, CrudFilters, useExport, useLink } from '@refinedev/core';
import { List, useTable, EditButton, ExportButton } from '@refinedev/antd';
import { Space, Table } from 'antd';
import { DataType, ZDataType } from 'pages/receipts/types';
import { DataType as TInsurer } from 'pages/insurers/types';
import { safeParse, getTotalPremiumByDebitNote, getInsurerPayment } from 'utils';
import dayjs, { Dayjs } from 'dayjs';
import { DataType as TDebitNote } from 'pages/debitNotes/types';
import Filter from '../../dashboard/Filter';
import { CheckCircleTwoTone, CloseCircleTwoTone } from '@ant-design/icons';
export const ListView: React.FC = () => {
    const Link = useLink();
    const [dateRange, setDateRange] = useState<[Dayjs, Dayjs]>([dayjs().add(-30, 'd'), dayjs()]);

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
                    field: 'date',
                    operator: 'gt',
                    value: dateRange ? dateRange[0]?.unix() : undefined,
                },
                {
                    field: 'date',
                    operator: 'lt',
                    value: dateRange ? dateRange[1]?.unix() : undefined,
                },
            ],
        },
        onSearch: (values: any) => {
            const filters = [
                {
                    field: 'date',
                    operator: 'gt',
                    value: values?.dateRange ? dayjs(values?.dateRange[0]?.startOf('day')).unix() : undefined,
                },
                {
                    field: 'date',
                    operator: 'lt',
                    value: values?.dateRange ? dayjs(values?.dateRange[1]?.startOf('day')).unix() : undefined,
                },
            ];
            return filters as CrudFilters;
        },
    });

    const parsedTableProps = safeParse<DataType>({
        tableProps,
        ZDataType: ZDataType,
    });

    const { data: debitNoteData } = useMany<TDebitNote>({
        resource: 'debit_notes',
        ids: parsedTableProps?.dataSource?.map((theRecord) => theRecord?.debitNoteId || '0') ?? [],
        queryOptions: {
            enabled: !!parsedTableProps?.dataSource,
        },
    });

    // console.log('🚀 ~ debitNoteData:', debitNoteData);
    const { data: insurersData } = useMany<TInsurer>({
        resource: 'insurers',
        ids: debitNoteData?.data?.map((theRecord) => theRecord?.insurerId || '0') ?? [],
        queryOptions: {
            enabled: !!parsedTableProps?.dataSource,
        },
    });
    const debitNotes = debitNoteData?.data || [];

    //如果没有数据，就禁用导出按钮
    const disabledBtn = parsedTableProps.dataSource?.length == 0 ? true : false;
    //Export CSV
    const { triggerExport, isLoading: exportLoading } = useExport<DataType>({
        filters: dateRange
            ? [
                  {
                      field: 'date',
                      operator: 'gt',
                      value: dateRange ? dateRange[0].startOf('day').unix() : undefined,
                  },
                  {
                      field: 'date',
                      operator: 'lt',
                      value: dateRange ? dateRange[1].startOf('day').unix() : undefined,
                  },
              ]
            : undefined,
        mapData: (item) => {
            if (!item) return;
            const noteNo = parsedTableProps?.dataSource?.find((r) => r.id === item.id)?.receiptNo ?? item.id;
            const noteDate = dayjs.unix(item?.date as number).format('YYYY-MM-DD');
            const debitNote = debitNotes.find((dn) => dn.id === item.debitNoteId);
            const insurerData = insurersData?.data?.find((insurer) => insurer.id === debitNote?.insurerId);
            const insurerName = debitNote ? insurerData?.name : '';
            const receipt = parsedTableProps?.dataSource?.find((r) => r.id === item.id);
            const premium = receipt?.premium ?? getTotalPremiumByDebitNote((debitNotes?.filter((dn) => dn?.id === receipt?.debitNoteId) as TDebitNote[])[0] ?? {});
            const paymentToInsurer = debitNote ? getInsurerPayment(item, debitNote as TDebitNote, insurerData as TInsurer) : 0;
            return {
                'Note No': `'${noteNo}'`, //加上單引號才不會被省略前導0
                'Note Date': noteDate,
                Insurer: insurerName,
                Premium: Number(premium).toLocaleString(),
                'Payment to Insurer': Number(paymentToInsurer).toLocaleString(),
                Paid: item.isPaid ? 'Yes' : 'No',
                Bank: item.payment_receiver_account,
                Remark: item.remark,
            };
        },
    });
    return (
        <List
            headerButtons={
                <>
                    <Filter dateRange={dateRange} setDateRange={setDateRange} formProps={searchFormProps} />

                    <ExportButton onClick={triggerExport} loading={exportLoading} disabled={disabledBtn} />
                </>
            }>
            <Table {...parsedTableProps} rowKey="id" size="middle">
                <Table.Column
                    width={120}
                    dataIndex="id"
                    title="Note No."
                    render={(renderId: number) => {
                        //取得receiptNo, 如果沒有則顯示id
                        const receiptNo = parsedTableProps?.dataSource?.find((r) => r.id === renderId)?.receiptNo;
                        return <Link to={`/receipts/show/${renderId}`}>{receiptNo ?? renderId}</Link>;
                    }}
                />

                <Table.Column width={120} dataIndex="date" title="Note Date" render={(date: number) => dayjs.unix(date).format('YYYY-MM-DD')} />
                <Table.Column
                    width={120}
                    dataIndex="debitNoteId"
                    title="Insurer"
                    render={(debitNoteId: number) => {
                        const debitNote = debitNotes.find((dn) => dn.id === debitNoteId);
                        const insurerData = insurersData?.data?.find((insurer) => insurer.id === debitNote?.insurerId);
                        return debitNote ? <>{insurerData?.name}</> : '';
                    }}
                />
                <Table.Column
                    width={120}
                    dataIndex="id"
                    title="Premium"
                    render={(id: number) => {
                        const receipt = parsedTableProps?.dataSource?.find((r) => r.id === id);
                        const premium = receipt?.premium ?? getTotalPremiumByDebitNote((debitNotes?.filter((debitNote) => debitNote?.id === receipt?.debitNoteId) as TDebitNote[])[0] ?? {});
                        return Number(premium).toLocaleString();
                    }}
                />
                <Table.Column
                    width={120}
                    dataIndex="id"
                    title="Payment to Insurer"
                    render={(id: number, record: DataType) => {
                        const debitNote = debitNotes.find((dn) => dn.id === record.debitNoteId);
                        const insurer = insurersData?.data?.find((ins) => ins.id === debitNote?.insurerId);
                        const premium = debitNote ? getInsurerPayment(record, debitNote as TDebitNote, insurer as TInsurer) : 0;
                        return Number(premium).toLocaleString();
                    }}
                />
                <Table.Column
                    width={120}
                    dataIndex="isPaid"
                    title="Paid"
                    render={(isPaid: boolean) => {
                        return isPaid ? <CheckCircleTwoTone twoToneColor="#52c41a" /> : <CloseCircleTwoTone twoToneColor="red" />;
                    }}
                />
                <Table.Column width={120} dataIndex="payment_receiver_account" title="Bank" />
                <Table.Column width={120} dataIndex="remark" title="Remark" />
                <Table.Column
                    width={120}
                    dataIndex="id"
                    title=""
                    render={(id) => {
                        return (
                            <>
                                <Space>
                                    <EditButton type="primary" hideText shape="circle" size="small" recordItemId={id} />
                                </Space>
                            </>
                        );
                    }}
                />
            </Table>
        </List>
    );
};
