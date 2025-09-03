import { useState } from 'react'
import { useTable, ExportButton } from '@refinedev/antd'
import { Table, Row, Col, Card } from 'antd'
import dayjs from 'dayjs'
import { getPrice } from 'utils'
import Filter from './Filter'
import FilterTags from 'components/FilterTags'
import { TSearchProps, TTemplateProps, TRequiredProps } from './types'
import { CrudFilters, useExport, BaseRecord, useMany, BaseKey } from '@refinedev/core'
import { DataType as TDebitNote } from 'pages/debitNotes/types'
import { DataType as TCreditNote } from 'pages/creditNotes/types'
import { DataType as TClient } from 'pages/clients/types'
import { DataType as TAgent } from 'pages/agents/types'
import { DataType as TReceipt } from 'pages/receipts/types'
import { DataType as TRenewal } from 'pages/renewals/types'

type DataType = TDebitNote & TCreditNote & TReceipt & { post_type: string }
function template<T extends TRequiredProps>({ resource }: TTemplateProps) {
    const { tableProps, searchFormProps } = useTable<DataType>({
        resource,
        pagination: {
            mode: 'off',
            pageSize: -1, // 一次取得所有資料
        },
        filters: {
            initial: [
                {
                    field: 'meta_query[0][key]',
                    operator: 'eq',
                    value: 'date',
                },
                {
                    field: 'meta_query[0][value][0]',
                    operator: 'eq',
                    value: dayjs().subtract(7, 'day').unix(),
                },
                {
                    field: 'meta_query[0][value][1]',
                    operator: 'eq',
                    value: dayjs().unix(),
                },
                {
                    field: 'meta_query[0][compare]',
                    operator: 'eq',
                    value: 'BETWEEN',
                },
            ] as CrudFilters,
        },
        onSearch: (values: any) => {
            const start = values?.dateRange
                ? values?.dateRange[0]?.startOf('day').unix()
                : undefined
            const end = values?.dateRange
                ? values?.dateRange[1]?.endOf('day').unix()
                : undefined

            const defaultFilters =
                [
                    {
                        field: 'meta_query[0][key]',
                        operator: 'eq',
                        value: 'date',
                    },
                    {
                        field: 'meta_query[0][value][0]',
                        operator: 'eq',
                        value: start,
                    },
                    {
                        field: 'meta_query[0][value][1]',
                        operator: 'eq',
                        value: end,
                    },
                    {
                        field: 'meta_query[0][compare]',
                        operator: 'eq',
                        value: start ? 'BETWEEN' : '>',
                    },
                ]
            return defaultFilters as CrudFilters
        },
    })

    const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
    const rowSelection = {
        onChange: (keys: React.Key[]) => {
            setSelectedRowKeys(keys)
        },
    }

    const { triggerExport, isLoading: exportLoading } = useExport<T & BaseRecord>(
        {
            resource,
            filters: [
                {
                    field: 'id',
                    operator: 'in',
                    value: selectedRowKeys,
                },
            ],
            mapData: (item) => {
                return {
                    'Note No.': item.note_no,
                    Date: dayjs.unix(item.date).format('YYYY-MM-DD'),
                    'Payment Date': dayjs
                        .unix(item.date)
                        .add(1, 'month')
                        .format('YYYY-MM-DD'),
                    'Premium (HKD)': `${item.premium?.toLocaleString() ?? 0}`,
                }
            },
        },
    )

    //get client id
    const clientNames = [...new Set(tableProps.dataSource?.map((item) => {
        return item.client_id
    }))] as BaseKey[]
    const { data: clientData } = useMany<TClient>({
        resource: 'clients',
        ids: clientNames,
        queryOptions: {
            enabled: !!clientNames.length,
        },
    })

    //get agent id
    const agentNames = [...new Set(tableProps.dataSource?.map((item) => {
        return item.agent_id
    }))] as BaseKey[]
    const { data: agentData } = useMany<TAgent>({
        resource: 'agents',
        ids: agentNames,
    })

    //get credit note id
    const creditNoteNames = [...new Set(tableProps.dataSource?.map((item) => {
        return item.created_from_credit_note_id
    }))] as BaseKey[]
    const { data: creditNoteData } = useMany<TCreditNote>({
        resource: 'credit_notes',
        ids: creditNoteNames,
    })
    const creditNotes = creditNoteData?.data || []

    // get debit note id
    const debitNoteNames = [...new Set(tableProps.dataSource?.map((item) => {
        return item.debit_note_id
    }))] as BaseKey[]
    const { data: debitNoteData } = useMany<TDebitNote>({
        resource: 'debit_notes',
        ids: debitNoteNames,
    })
    const debitNotes = debitNoteData?.data || []

    // get renewal id
    const renewalNames = [...new Set(tableProps.dataSource?.map((item) => {
        return item.created_from_renewal_id
    }))] as BaseKey[]
    const { data: renewalData } = useMany<TRenewal>({
        resource: 'renewals',
        ids: renewalNames,
    })
    const renewals = renewalData?.data || []

    return (
        <>
            <Row gutter={[16, 16]}>
                <Col lg={24} xs={24}>
                    <Filter formProps={searchFormProps} />
                </Col>
                <Col lg={24} xs={24}>
                    <Card bordered={false} title="Search Result">
                        <div className="mb-4">
                            <FilterTags form={searchFormProps?.form} />
                        </div>
                        <div className="mb-4">
                            <ExportButton
                                type="primary"
                                disabled={!selectedRowKeys.length}
                                onClick={triggerExport}
                                loading={exportLoading}
                            >
                                Export Selected
                            </ExportButton>
                        </div>
                        <Table
                            {...tableProps}
                            rowKey="id"
                            size="middle"
                            rowSelection={{
                                type: 'checkbox',
                                ...rowSelection,
                            }}
                            summary={(pageData) => {
                                const totalPremium = pageData.reduce((acc, cur) => {
                                    const premium =
                                        cur.post_type === 'credit_notes'
                                            ? (cur?.premium as number) * -1
                                            : cur?.premium
                                    return acc + Number(premium ?? 0)
                                }, 0)

                                return (
                                    <>
                                        <Table.Summary.Row className="bg-blue-50">
                                            <Table.Summary.Cell index={0}></Table.Summary.Cell>
                                            <Table.Summary.Cell index={1}>Total</Table.Summary.Cell>
                                            <Table.Summary.Cell index={2}></Table.Summary.Cell>
                                            <Table.Summary.Cell index={3}></Table.Summary.Cell>
                                            <Table.Summary.Cell index={4}></Table.Summary.Cell>
                                            <Table.Summary.Cell index={5}>
                                                {getPrice(totalPremium)}
                                            </Table.Summary.Cell>
                                            <Table.Summary.Cell index={6}></Table.Summary.Cell>
                                            <Table.Summary.Cell index={7}></Table.Summary.Cell>
                                            <Table.Summary.Cell index={8}></Table.Summary.Cell>
                                        </Table.Summary.Row>
                                    </>
                                )
                            }}
                        >
                            <Table.Column
                                dataIndex="client_id"
                                title="Client No."
                                render={(clientId: BaseKey,record:DataType) => {
                                    if(clientId){
                                        return clientData?.data?.find((client) => client.id === clientId)?.client_number
                                    }
                                    if(record.created_from_credit_note_id){
                                        const creditNote = creditNotes.find((creditNote) => creditNote.id === record.created_from_credit_note_id)
                                        const client = clientData?.data?.find((client) => client.id === creditNote?.client_id)
                                        return client?.client_number
                                    }
                                    if(record.created_from_renewal_id){
                                        const renewal = renewals.find((renewal) => renewal.id === record.created_from_renewal_id)
                                        const client = clientData?.data?.find((client) => client.id === renewal?.client_id)
                                        return client?.client_number
                                    }
                                    if(record.debit_note_id){
                                        const debitNote = debitNotes.find((debitNote) => debitNote.id === record.debit_note_id)
                                        const client = clientData?.data?.find((client) => client.id === debitNote?.client_id)
                                        return client?.client_number
                                    }
                                    return 'N/A'
                                }}
                            />
                            <Table.Column
                                dataIndex="client_id"
                                title="Client Name"
                                render={(clientId: BaseKey,record:DataType) => {
                                    if(clientId){
                                    const client = clientData?.data?.find((client) => client.id === clientId)
                                        const displayNameStr = client?.display_name
                                        return displayNameStr ? client[displayNameStr] : 'N/A'
                                    }
                                    if(record.created_from_credit_note_id){
                                        const creditNote = creditNotes.find((creditNote) => creditNote.id === record.created_from_credit_note_id)
                                        const client = clientData?.data?.find((client) => client.id === creditNote?.client_id)
                                        const displayNameStr = client?.display_name
                                        return displayNameStr ? client[displayNameStr] : 'N/A'
                                    }
                                    if(record.created_from_renewal_id){
                                        const renewal = renewals.find((renewal) => renewal.id === record.created_from_renewal_id)
                                        const client = clientData?.data?.find((client) => client.id === renewal?.client_id)
                                        const displayNameStr = client?.display_name
                                        return displayNameStr ? client[displayNameStr] : 'N/A'
                                    }
                                    if(record.debit_note_id){
                                        const debitNote = debitNotes.find((debitNote) => debitNote.id === record.debit_note_id)
                                        const client = clientData?.data?.find((client) => client.id === debitNote?.client_id)
                                        const displayNameStr = client?.display_name
                                        return displayNameStr ? client[displayNameStr] : 'N/A'
                                    }
                                    return 'N/A'
                                }}
                            />
                            <Table.Column
                                width={120}
                                dataIndex={resource === 'receipts' ? 'receipt_no' : 'note_no'}
                                title="Note No."
                                sorter={(a: T, b: T) =>
                                    a?.note_no.localeCompare(b.note_no || '')
                                }
                            />
                            <Table.Column
                                key="date"
                                dataIndex="date"
                                title="Date"
                                render={(date: number) => dayjs.unix(date).format('YYYY-MM-DD')}
                                sorter={(a: T, b: T) => a.date - b.date}
                            />
                            <Table.Column
                                dataIndex="premium"
                                title="Premium"
                                render={(premium: number, record: T) => {
                                    if ((record as any).post_type === 'credit_notes') {
                                        return getPrice(premium * -1)
                                    }

                                    return getPrice(premium) //debit_notes
                                }}
                                sorter={(a: T, b: T) => a.premium - b.premium}
                            />
                            <Table.Column
                                dataIndex="agent_id"
                                title="Agent"
                                render={(agentId: BaseKey) => {
                                    return agentData?.data?.find((agent) => agent.id === agentId)?.agent_number
                                }}
                            />
                            <Table.Column
                                dataIndex="client_id"
                                title="Phone"
                                render={(clientId: BaseKey) => {
                                    const client = clientData?.data?.find((client) => client.id === clientId)
                                    return client?.mobile1 || client?.mobile2 || client?.tel2 || client?.tel3
                                }}
                            />
                            {
                                'debit_notes/not_receipt'===resource?
                                    <Table.Column
                                    dataIndex="date"
                                    title="Days Over"
                                    render={(date: number) => {
                                        return Math.abs(
                                            dayjs.unix(date).startOf('day').diff(dayjs().startOf('day'), 'day')
                                        )
                                    }}
                                />
                                :''
                            }
                            
                        </Table>
                        <hr className="my-8" />
                    </Card>
                </Col>
            </Row>
        </>
    )
}

export default template
