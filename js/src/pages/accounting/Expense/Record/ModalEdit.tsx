import { Modal, Form, Input, Switch, DatePicker } from 'antd'
import { useForm } from '@refinedev/antd'
import { ModalProps } from 'antd/lib/modal'
import { ReceiptBankSelect } from 'components/ReceiptBankSelect'
import { useInvalidate } from '@refinedev/core'
import { Key } from 'react'

interface ModalEditProps {
  close: () => void
  modalProps: ModalProps
  selectedRowKeys: Key[]
  className?: string
}
export const ModalEdit: React.FC<ModalEditProps> = ({
  close,
  modalProps,
  selectedRowKeys,
  className = 'table table_td-flex-1 w-full',
}) => {
  // 用來手動刷新資料的 Hook
  const invalidate = useInvalidate()
  const { formProps, form } = useForm({
    resource: 'expenses_bulk_edit',
    onMutationSuccess: () => {
      close()
      // invalidate
      invalidate({
        resource: 'expenses_record',
        invalidates: ['list'],
      })
    },
  })
  // 取得選取的資料及欄位,並送出表單
  const handleOk = () => {
    const value = form.getFieldsValue()
    const formatValues = {
      ids: selectedRowKeys,
      ...value,
      payment_date: (value as { payment_date?: any })?.payment_date?.unix(),
    }
    // 重組資料並送出表單
    formProps?.onFinish?.(formatValues)
  }
  return (
    <Modal {...modalProps} title="批次編輯" onOk={handleOk}>
      <Form {...formProps} layout="vertical">
        <div className={className}>
          <div className="tr">
            <div className="th">Payment Date</div>
            <div className="td flex">
              <Form.Item noStyle name={['payment_date']}>
                <DatePicker size="small" className="w-full" />
              </Form.Item>
            </div>
          </div>
        </div>
        <div className={className}>
          <div className="tr">
            <div className="th">Cheque Number</div>
            <div className="td flex">
              <Form.Item noStyle name={['cheque_no']}>
                <Input />
              </Form.Item>
            </div>
          </div>
        </div>

        <ReceiptBankSelect className={className} />
      </Form>
    </Modal>
  )
}
