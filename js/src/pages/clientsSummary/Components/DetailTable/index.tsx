import { FC } from 'react';
import { Table, Button } from 'antd';
import { getTotalPremiumByDebitNote } from 'utils';
import { DataType } from 'pages/debitNotes/types';
import { DataType as TRenewals } from 'pages/renewals/types';
import { DataType as TTerm } from 'pages/terms/types';
// import dayjs from 'dayjs';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useUpdate, useDelete } from '@refinedev/core';

//判斷是否有debitNoteId
const getResourcesByDebitNoteId = (resource: string, debitNoteId: number) => async () => {
    // const result = await supabaseClient.from(resource).select('id, debitNoteId').eq('debitNoteId', debitNoteId);
		const result = undefined;
    return result;
};
//判斷是否有renewalId
const getResourcesByRenewalsId = (resource: string, renewalId: number | null) => async () => {
    // const result = renewalId ? await supabaseClient.from(resource).select('id, createdFromRenewalId').eq('createdFromRenewalId', renewalId) : { data: [] };
		const result = undefined;
    return result;
};

const DetailTable: FC<{ record: DataType & TRenewals; term?: TTerm }> = ({ record: rawRecord, term }) => {
    // console.log('🚀 ~ record:', rawRecord);

    //如果是renewals的情況
    const isRenewals = Boolean(rawRecord?.debitNoteId);
    const renewalId = rawRecord?.id ?? 0;
    const { data: createdFromRenewals } = useQuery(['renewals_with_createdFromRenewalId', renewalId], getResourcesByRenewalsId('renewals', renewalId));
    const createdFromRenewal = createdFromRenewals?.data || [];
    const { data: createdFromReceipts } = useQuery(['receipts_with_createdFromRenewalId', renewalId], getResourcesByRenewalsId('receipts', renewalId));
    const createdFromReceipt = createdFromReceipts?.data || [];

    const debitNoteId = rawRecord?.debitNoteId ? rawRecord?.debitNoteId : rawRecord.id ?? 0;
    const { data: renewalsResult } = useQuery(['renewals_with_debitNoteId', debitNoteId], getResourcesByDebitNoteId('renewals', debitNoteId));
    const renewals = renewalsResult?.data || [];
    // console.log('🚀 ~ renewals:', renewals);

    const { data: receiptsResult } = useQuery(['receipts_with_debitNoteId', debitNoteId], getResourcesByDebitNoteId('receipts', debitNoteId));
    const receipts = receiptsResult?.data || [];

    //更新Archive方法
    const { mutate: updateArchive } = useUpdate();
    const handleArchive = async () => {
        // console.log('click archive');
        updateArchive({
            resource: 'debit_notes',
            id: debitNoteId,
            values: {
                isArchived: true,
            },
        });
    };
    //還原Current方法
    const { mutate: updateCurrent } = useUpdate();
    const handleCurrent = async () => {
        // console.log('click archive');
        updateCurrent({
            resource: 'debit_notes',
            id: debitNoteId,
            values: {
                isArchived: false,
            },
        });
    };
    //刪除方法
    const { mutate: deleteRecord } = useDelete();
    const handleDelete = async () => {
        // console.log('click delete');
        deleteRecord({
            resource: 'debit_notes',
            id: debitNoteId,
        });
    };

    return (
        <>
            <Table dataSource={[rawRecord]} rowKey="id" size="middle" pagination={false} className="mb-8">
                {/* <Table.Column dataIndex="noteNo" title="Note No." />*/}
                <Table.Column dataIndex="termId" title="Class" render={() => term?.name || ''} />
                <Table.Column dataIndex="package" title="Package" />
                <Table.Column
                    dataIndex="premium"
                    title="PREMIUM"
                    render={(_id: number, record: DataType | TRenewals) => {
                        const premium = getTotalPremiumByDebitNote(record);
                        return Number(premium).toLocaleString();
                    }}
                />
                {/* <Table.Column dataIndex="sumInsured" title="Sum Insured" />
                <Table.Column
                    dataIndex="motorAttr"
                    title="Particulars"
                    render={(motorAttr: any) => {
                        return (
                            <>
                                <p className="m-0">{motorAttr?.registrationNo}</p>
                            </>
                        );
                    }}
                />

                <Table.Column dataIndex="periodOfInsuranceFrom" title="Effective Date" render={(periodOfInsuranceFrom: number) => (periodOfInsuranceFrom ? dayjs.unix(periodOfInsuranceFrom).format('YYYY-MM-DD') : '')} />
                <Table.Column dataIndex="periodOfInsuranceTo" title="End Date" render={(periodOfInsuranceTo: number) => (periodOfInsuranceTo ? dayjs.unix(periodOfInsuranceTo).format('YYYY-MM-DD') : '')} /> */}
                {/* <Table.Column dataIndex="date" title="Bill Date" render={(date: number) => (date ? dayjs.unix(date).format('YYYY-MM-DD') : '')} /> */}

                <Table.Column
                    width={380}
                    align="center"
                    dataIndex="action"
                    title=""
                    render={() => (
                        <>
                            {rawRecord.isArchived === false ? (
                                <Button onClick={() => handleArchive()} type="default" size="small" className="mr-2">
                                    Archive
                                </Button>
                            ) : (
                                <Button onClick={() => handleCurrent()} type="default" size="small" className="mr-2">
                                    Current
                                </Button>
                            )}
                            {/* 如果是debitNote情況 */}
                            {!isRenewals && renewals.length === 0 && (
                                <Link to="/renewals/create" state={{ debitNoteId }}>
                                    <Button type="default" size="small" className="mr-2">
                                        續保
                                    </Button>
                                </Link>
                            )}
                            {!isRenewals && renewals.length > 0 && (
                                <Link to={`/renewals/show/${renewals?.[0]?.id}`}>
                                    <Button type="primary" size="small" className="mr-2">
                                        已續保
                                    </Button>
                                </Link>
                            )}
                            {/* 如果是renewal情況 */}
                            {isRenewals && createdFromRenewal.length === 0 && (
                                <Link to="/renewals/create" state={{ debitNoteId, renewalId }}>
                                    <Button type="default" size="small" className="mr-2">
                                        續保
                                    </Button>
                                </Link>
                            )}
                            {isRenewals && createdFromRenewal.length > 0 && (
                                <Link to={`/renewals/show/${createdFromRenewal?.[0]?.id}`}>
                                    <Button type="primary" size="small" className="mr-2">
                                        已續保
                                    </Button>
                                </Link>
                            )}
                            {/* 如果是debitNote情況 */}
                            {!isRenewals && receipts.length === 0 && (
                                <Link to="/receipts/create" state={{ debitNoteId }}>
                                    <Button type="default" size="small" className="mr-2">
                                        開發收據
                                    </Button>
                                </Link>
                            )}

                            {!isRenewals && receipts.length > 0 && (
                                <Link to={`/receipts/show/${receipts?.[0]?.id}`}>
                                    <Button type="primary" size="small" className="mr-2">
                                        已開收據
                                    </Button>
                                </Link>
                            )}
                            {/* 如果是Renewals情況 */}
                            {isRenewals && createdFromReceipt.length === 0 && (
                                <Link to="/receipts/create" state={{ debitNoteId, renewalId }}>
                                    <Button type="default" size="small" className="mr-2">
                                        開發收據
                                    </Button>
                                </Link>
                            )}

                            {isRenewals && createdFromReceipt.length > 0 && (
                                <Link to={`/receipts/show/${createdFromReceipt?.[0]?.id}`}>
                                    <Button type="primary" size="small" className="mr-2">
                                        已開收據
                                    </Button>
                                </Link>
                            )}
                            <Link to={isRenewals ? `/renewals/show/${renewalId}` : `/debitNotes/show/${debitNoteId}`}>
                                <Button type="default" size="small" className="mr-2">
                                    查閱保單
                                </Button>
                            </Link>

                            <Button onClick={() => handleDelete()} type="default" size="small" className="mr-2">
                                刪除
                            </Button>
                        </>
                    )}
                />
            </Table>
        </>
    );
};

export default DetailTable;
