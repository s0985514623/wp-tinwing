import { FC } from 'react'
import { Table, Button } from 'antd'
import { getTotalPremiumByDebitNote } from 'utils'
import { ClientsSummaryType } from 'pages/clientsSummary/ListView'
import { DataType as TTerm } from 'pages/terms/types'
import { DataType as TRenewals } from 'pages/renewals/types'
import { DataType as TReceipts } from 'pages/receipts/types'
// import dayjs from 'dayjs';
import { Link } from 'react-router-dom'
import { useUpdate, useDelete, useInvalidate} from '@refinedev/core'

const DetailTable: FC<{ record: ClientsSummaryType; term?: TTerm; renewals?: TRenewals; receipts?: TReceipts }> = ({
  record: rawRecord,
  term,
  renewals,
  receipts,
}) => {
	// 用來手動刷新資料的 Hook
	const invalidate = useInvalidate();
  //取得文章類型
  const postType = rawRecord?.post_type
  const rawRecordId = rawRecord?.id

  //確認這個rawRecordId有沒有創建過renewals
  const isCreatedRenewal = Boolean(renewals)

  //確認這個rawRecordId有沒有創建過receipts
  const isCreatedReceipt = Boolean(receipts)
 
  //更新Archive方法
  const { mutate: updateArchive } = useUpdate()
  const handleArchive = async () => {
    // console.log('click archive');
    updateArchive({
      resource: postType,
      id: rawRecordId,
      values: {
        is_archived: true,
      },
    },
		{
			onSuccess: (data, variables, context) => {
				invalidate({
					resource: 'clients_summary',
					invalidates: ['list'],
				})
			},
		})
  }
  //還原Current方法
  const { mutate: updateCurrent } = useUpdate()
  const handleCurrent = async () => {
    // console.log('click archive');
    updateCurrent({
      resource: postType,
      id: rawRecordId,
      values: {
        is_archived: false,
      },
    },
		{
			onSuccess: (data, variables, context) => {
				invalidate({
					resource: 'clients_summary',
					invalidates: ['list'],
				})
			},
		})
  }
  //刪除方法
  const { mutate: deleteRecord } = useDelete()
  const handleDelete = async () => {
    // console.log('click delete');
    deleteRecord({
      resource: postType,
      id: rawRecordId ?? 0,
    },
		{
			onSuccess: (data, variables, context) => {
				// invalidate
				invalidate({
					resource: 'clients_summary',
					invalidates: ['list'],
				})
			},
		})
  }

  return (
    <>
      <Table
        dataSource={[rawRecord]}
        rowKey="id"
        size="middle"
        pagination={false}
        className="mb-8"
      >
        {/* <Table.Column dataIndex="note_no" title="Note No." />*/}
        {/* <Table.Column
          dataIndex="term_id"
          title="Class"
          render={() => term?.name || ''}
        />
        <Table.Column dataIndex="package" title="Package" />
        <Table.Column
          dataIndex="premium"
          title="PREMIUM"
          render={(_id: number, record: ClientsSummaryType) => {
            const premium = getTotalPremiumByDebitNote(record)
            return Number(premium).toLocaleString()
          }} */}
        {/* /> */}
        {/* <Table.Column dataIndex="sum_insured" title="Sum Insured" />
                <Table.Column
                    dataIndex="motor_attr"
                    title="Particulars"
                    render={(motor_attr: any) => {
                        return (
                            <>
                                <p className="m-0">{motor_attr?.registrationNo}</p>
                            </>
                        );
                    }}
                />

                <Table.Column dataIndex="period_of_insurance_from" title="Effective Date" render={(period_of_insurance_from: number) => (period_of_insurance_from ? dayjs.unix(period_of_insurance_from).format('YYYY-MM-DD') : '')} />
                <Table.Column dataIndex="period_of_insurance_to" title="End Date" render={(period_of_insurance_to: number) => (period_of_insurance_to ? dayjs.unix(period_of_insurance_to).format('YYYY-MM-DD') : '')} /> */}
        {/* <Table.Column dataIndex="date" title="Bill Date" render={(date: number) => (date ? dayjs.unix(date).format('YYYY-MM-DD') : '')} /> */}

        <Table.Column
          width={380}
          align="right"
          dataIndex="action"
          title=""
          render={() => (
            <>
              {rawRecord.is_archived === false ? (
                <Button
                  onClick={() => handleArchive()}
                  type="default"
                  size="small"
                  className="mr-2"
                >
                  Archive
                </Button>
              ) : (
                <Button
                  onClick={() => handleCurrent()}
                  type="default"
                  size="small"
                  className="mr-2"
                >
                  Current
                </Button>
              )}
              {/* 如果是debitNote情況 */}
              {postType === 'debit_notes'&& !isCreatedRenewal && (
                <Link to="/renewals/create" state={{ debit_note_id:rawRecordId}}>
                  <Button type="default" size="small" className="mr-2">
                    續保
                  </Button>
                </Link>
              )}
              {postType === 'debit_notes'&& isCreatedRenewal && (
                <Link to={`/renewals/show/${renewals?.id}`}>
                  <Button type="primary" size="small" className="mr-2">
                    已續保
                  </Button>
                </Link>
              )}
              {/* 如果是renewal情況 */}
              {postType === 'renewals' && !isCreatedRenewal && (
                <Link
                  to="/renewals/create"
                  state={{
                    renewalId: rawRecordId,
                  }}
                >
                  <Button type="default" size="small" className="mr-2">
                    續保
                  </Button>
                </Link>
              )}
              {postType === 'renewals' && isCreatedRenewal && (
                <Link to={`/renewals/show/${renewals?.id}`}>
                  <Button type="primary" size="small" className="mr-2">
                    已續保
                  </Button>
                </Link>
              )}
              {/* 如果是debitNote情況 */}
              {postType === 'debit_notes' && !isCreatedReceipt && (
                <Link to="/receipts/create" state={{ debit_note_id:rawRecordId }}>
                  <Button type="default" size="small" className="mr-2">
                    開發收據
                  </Button>
                </Link>
              )}

              {postType === 'debit_notes' && isCreatedReceipt && (
                <Link to={`/receipts/show/${receipts?.id}`}>
                  <Button type="primary" size="small" className="mr-2">
                    已開收據
                  </Button>
                </Link>
              )}
              {/* 如果是Renewals情況 */}
              {postType === 'renewals' && !isCreatedReceipt && (
                <Link
                  to="/receipts/create"
                  state={{
                    renewalId: rawRecordId,
                  }}
                >
                  <Button type="default" size="small" className="mr-2">
                    開發收據
                  </Button>
                </Link>
              )}
              {postType === 'renewals' && isCreatedReceipt && (
                <Link to={`/receipts/show/${receipts?.id}`}>
                  <Button type="primary" size="small" className="mr-2">
                    已開收據
                  </Button>
                </Link>
              )}
              {/* 如果是credit_notes情況 */}
              {postType === 'credit_notes' && !isCreatedReceipt && (
                <Link to="/receipts/create" state={{ credit_note_id:rawRecordId }}>
                  <Button type="default" size="small" className="mr-2">
                    開發收據
                  </Button>
                </Link>
              )}
              {postType === 'credit_notes' && isCreatedReceipt && (
                <Link to={`/receipts/show/${receipts?.id}`}>
                  <Button type="primary" size="small" className="mr-2">
                    已開收據
                  </Button>
                </Link>
              )}
              <Link
                to={
                  `/${postType}/show/${rawRecordId}`
                }
              >
                <Button type="default" size="small" className="mr-2">
                  查閱保單
                </Button>
              </Link>

              <Button
                onClick={() => handleDelete()}
                type="default"
                size="small"
                className="mr-2"
              >
                刪除
              </Button>
            </>
          )}
        />
      </Table>
    </>
  )
}

export default DetailTable
