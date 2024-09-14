import { FC } from 'react'
import { Table, Button } from 'antd'
import { getTotalPremiumByDebitNote } from 'utils'
import { DataType } from 'pages/debitNotes/types'
import { DataType as TRenewals } from 'pages/renewals/types'
import { DataType as TTerm } from 'pages/terms/types'
// import dayjs from 'dayjs';
import { Link } from 'react-router-dom'
import { useUpdate, useDelete, useList ,useInvalidate} from '@refinedev/core'

const DetailTable: FC<{ record: DataType & TRenewals; term?: TTerm }> = ({
  record: rawRecord,
  term,
}) => {
	// 用來手動刷新資料的 Hook
	const invalidate = useInvalidate();
  //確認這個rawRecord是debitNote還是renewal
	//renewal
  const isCreatedFromDebitNote = Boolean(rawRecord?.debit_note_id)
  const isCreatedFromRenewal = Boolean(rawRecord?.created_from_renewal_id)
	//debitNote
	const isDebitNote = !isCreatedFromDebitNote&& !isCreatedFromRenewal
  const rawRecordId = rawRecord?.id ?? 0

  //確認這個rawRecordId有沒有創建過renewals
  const { data: createdFromRenewals } = useList({
    resource: 'renewals',
  })
  const createdFromRenewal =
    createdFromRenewals?.data.filter((element) => {
			// 當rawRecord有以下條件時，則代表本身是renewal，所以要比對的是created_from_renewal_id
      if (isCreatedFromRenewal||isCreatedFromDebitNote) {
        return parseInt(element?.created_from_renewal_id) == rawRecordId
      } else {
        return parseInt(element?.debit_note_id) == rawRecordId
      }
    }) || []


  //確認這個rawRecordId有沒有創建過receipts
  const { data: createdFromReceipts } = useList({
    resource: 'receipts',
  })
  const createdFromReceipt =
    createdFromReceipts?.data.filter((element) => {
			// 當rawRecord有以下條件時，則代表本身是renewal，所以要比對的是created_from_renewal_id
      if (isCreatedFromRenewal||isCreatedFromDebitNote) {
        return parseInt(element?.created_from_renewal_id) == rawRecordId
      } else {
        return parseInt(element?.debit_note_id) == rawRecordId
      }
    }) || []
  //更新Archive方法
  const { mutate: updateArchive } = useUpdate()
  const handleArchive = async () => {
    // console.log('click archive');
    updateArchive({
      resource: isCreatedFromDebitNote||isCreatedFromRenewal ? 'renewals' : 'debit_notes',
      id: rawRecordId,
      values: {
        is_archived: true,
      },
    })
  }
  //還原Current方法
  const { mutate: updateCurrent } = useUpdate()
  const handleCurrent = async () => {
    // console.log('click archive');
    updateCurrent({
      resource: isCreatedFromDebitNote||isCreatedFromRenewal ? 'renewals' : 'debit_notes',
      id: rawRecordId,
      values: {
        is_archived: false,
      },
    })
  }
  //刪除方法
  const { mutate: deleteRecord } = useDelete()
  const handleDelete = async () => {
    // console.log('click delete');
    deleteRecord({
      resource: isCreatedFromDebitNote||isCreatedFromDebitNote ? 'renewals' : 'debit_notes',
      id: rawRecordId,
    })
		//TODO 不會刷新畫面
		invalidate({
			resource: isCreatedFromDebitNote||isCreatedFromRenewal ? 'renewals' : 'debit_notes',
			invalidates: ['list'],
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
        <Table.Column
          dataIndex="term_id"
          title="Class"
          render={() => term?.name || ''}
        />
        <Table.Column dataIndex="package" title="Package" />
        <Table.Column
          dataIndex="premium"
          title="PREMIUM"
          render={(_id: number, record: DataType | TRenewals) => {
            const premium = getTotalPremiumByDebitNote(record)
            return Number(premium).toLocaleString()
          }}
        />
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
          align="center"
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
              {isDebitNote && createdFromRenewal?.length === 0 && (
                <Link to="/renewals/create" state={{ debit_note_id:rawRecordId}}>
                  <Button type="default" size="small" className="mr-2">
                    續保
                  </Button>
                </Link>
              )}
              {isDebitNote && createdFromRenewal?.length > 0 && (
                <Link to={`/renewals/show/${createdFromRenewal?.[0]?.id}`}>
                  <Button type="primary" size="small" className="mr-2">
                    已續保
                  </Button>
                </Link>
              )}
              {/* 如果是renewal情況 */}
              {(isCreatedFromDebitNote||isCreatedFromRenewal) && createdFromRenewal.length === 0 && (
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
              {(isCreatedFromDebitNote||isCreatedFromRenewal) && createdFromRenewal.length > 0 && (
                <Link to={`/renewals/show/${createdFromRenewal?.[0]?.id}`}>
                  <Button type="primary" size="small" className="mr-2">
                    已續保
                  </Button>
                </Link>
              )}
              {/* 如果是debitNote情況 */}
              {isDebitNote && createdFromReceipt.length === 0 && (
                <Link to="/receipts/create" state={{ debit_note_id:rawRecordId }}>
                  <Button type="default" size="small" className="mr-2">
                    開發收據
                  </Button>
                </Link>
              )}

              {isDebitNote && createdFromReceipt.length > 0 && (
                <Link to={`/receipts/show/${createdFromReceipt?.[0]?.id}`}>
                  <Button type="primary" size="small" className="mr-2">
                    已開收據
                  </Button>
                </Link>
              )}
              {/* 如果是Renewals情況 */}
              {(isCreatedFromDebitNote||isCreatedFromRenewal) && createdFromReceipt.length === 0 && (
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

              {(isCreatedFromDebitNote||isCreatedFromRenewal) && createdFromReceipt.length > 0 && (
                <Link to={`/receipts/show/${createdFromReceipt?.[0]?.id}`}>
                  <Button type="primary" size="small" className="mr-2">
                    已開收據
                  </Button>
                </Link>
              )}
              <Link
                to={
                  (isCreatedFromDebitNote||isCreatedFromRenewal)
                    ? `/renewals/show/${rawRecordId}`
                    : `/debitNotes/show/${rawRecordId}`
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
