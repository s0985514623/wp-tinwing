import { useExport, useList, useMany } from '@refinedev/core';
import { List, useTable, ExportButton } from '@refinedev/antd';
import { Table } from 'antd';
import { DataType, ZDataType } from 'pages/insurers/types';
import { DataType as TReceipts } from 'pages/receipts/types';
import { DataType as TDebitNote } from 'pages/debitNotes/types';
import { safeParse, getInsurerPayment } from 'utils';

// import dayjs from 'dayjs';

export const ListView: React.FC = () => {
    //當前Table的props
    const { tableProps } = useTable<DataType>({
			pagination:{
				pageSize: 30,
			}
		});
    const parsedTableProps = safeParse<DataType>({
        tableProps,
        ZDataType,
    });
    const { data: receiptsData } = useList<TReceipts>({
        resource: 'receipts',
    });
    // console.log('🚀 ~ receiptsData:', receiptsData);
    const { data: debitNotesData } = useMany<TDebitNote>({
        resource: 'debit_notes',
        ids: (receiptsData?.data?.map((item) => item.debit_note_id) as number[]) ?? [],
        queryOptions: {
            enabled: !!receiptsData?.data,
        },
    });
    //Export CSV
    const { triggerExport, isLoading: exportLoading } = useExport<DataType>({
        mapData: (item) => {
            const getAmount = (receipts?: TReceipts[], debitNotes?: TDebitNote[], record?: DataType) => {
                return receipts?.reduce((acc, receipt) => {
                    const debitNote = debitNotes?.find((dn) => dn.id === receipt.debit_note_id);
                    if (debitNote?.insurer_id === item?.id) {
                        const premium = debitNote ? getInsurerPayment(receipt, debitNote as TDebitNote, record as DataType) : 0;
                        return acc + premium;
                    }
                    return acc;
                }, 0);
            };
            const totalAmount = getAmount(receiptsData?.data, debitNotesData?.data, item);
            const paidReceipts = receiptsData?.data?.filter((receipt) => receipt.is_paid === true);
            const paidAmount = getAmount(paidReceipts, debitNotesData?.data, item);
            const unpaidReceipts = receiptsData?.data?.filter((receipt) => receipt.is_paid !== true);
            const upPaidAmount = getAmount(unpaidReceipts, debitNotesData?.data, item);
            return {
                'Insurer No': item?.insurer_number,
                Name: item?.name,
                'Total Amount': totalAmount?.toLocaleString(),
                Paid: paidAmount?.toLocaleString(),
                Unpaid: upPaidAmount?.toLocaleString(),
            };
        },
    });
    return (
        <List headerButtons={<ExportButton onClick={triggerExport} loading={exportLoading} />}>
            <Table {...parsedTableProps} rowKey="id" size="middle">
                <Table.Column width={120} dataIndex="insurer_number" title="Insurer No." />
                <Table.Column dataIndex="name" title="Name" />
                <Table.Column
                    dataIndex="id"
                    title="Total Amount"
                    render={(id: number, record: DataType) => {
                        const totalAmount = receiptsData?.data?.reduce((acc, receipt) => {
                            const debitNote = debitNotesData?.data?.find((dn) => dn.id === receipt.debit_note_id);
                            if (debitNote?.insurer_id === id) {
                                const premium = debitNote ? getInsurerPayment(receipt, debitNote as TDebitNote, record) : 0;
                                return acc + premium;
                            }
                            return acc;
                        }, 0);
                        return totalAmount?.toLocaleString();
                    }}
                />
                <Table.Column
                    dataIndex="id"
                    title="Paid"
                    render={(id: number, record: DataType) => {
                        const paidReceipts = receiptsData?.data?.filter((receipt) => receipt.is_paid === true);
                        const totalAmount = paidReceipts?.reduce((acc, receipt) => {
                            const debitNote = debitNotesData?.data?.find((dn) => dn.id === receipt.debit_note_id);
                            if (debitNote?.insurer_id === id) {
                                const premium = debitNote ? getInsurerPayment(receipt, debitNote as TDebitNote, record) : 0;
                                return acc + premium;
                            }
                            return acc;
                        }, 0);
                        return totalAmount?.toLocaleString();
                    }}
                />
                <Table.Column
                    dataIndex="id"
                    title="Unpaid"
                    render={(id: number, record: DataType) => {
                        const unpaidReceipts = receiptsData?.data?.filter((receipt) => receipt.is_paid !== true);
                        const totalAmount = unpaidReceipts?.reduce((acc, receipt) => {
                            const debitNote = debitNotesData?.data?.find((dn) => dn.id === receipt.debit_note_id);
                            if (debitNote?.insurer_id === id) {
                                const premium = debitNote ? getInsurerPayment(receipt, debitNote as TDebitNote, record) : 0;
                                return acc + premium;
                            }
                            return acc;
                        }, 0);
                        return totalAmount?.toLocaleString();
                    }}
                />
            </Table>
        </List>
    );
};
