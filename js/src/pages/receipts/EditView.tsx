import React, { useState, useEffect } from 'react'
import {
  IResourceComponentsProps,
  useOne,
  useLink,
  useList,
} from '@refinedev/core'
import { Edit, useForm, useSelect } from '@refinedev/antd'
import {
  Form,
  DatePicker,
  InputNumber,
  Row,
  Col,
  Alert,
  Select,
  Input,
  Button,
  Spin,
} from 'antd'
import { EyeOutlined, LoadingOutlined } from '@ant-design/icons'
import dayjs, { Dayjs } from 'dayjs'
import { DataType } from './types'
import { DataType as TClient, defaultClient } from 'pages/clients/types'
import {
  DataType as TDebitNote,
  defaultDebitNote,
} from 'pages/debitNotes/types'
import {
  getDisplayName,
  getTotalPremiumByDebitNote,
  getTemplateText,
} from 'utils'
import logo from 'assets/images/logo.jpg'
import DetailFooter from 'components/DetailFooter'
import { ToWords } from 'to-words'
import { ReceiptBankSelect } from 'components/ReceiptBankSelect'

export const EditView: React.FC<IResourceComponentsProps> = () => {
  const toWords = new ToWords()
  const { formProps, saveButtonProps, form, queryResult } = useForm()
  const receiptData = queryResult?.data?.data as DataType
  const isFromDebitNote = Boolean(receiptData?.debit_note_id)
  const isFromRenewal = Boolean(receiptData?.created_from_renewal_id)
  const watchDate = Form.useWatch(['date'], form)
  const watchPaymentDate = Form.useWatch(['payment_date'], form)
  const watchPremium = Form.useWatch(['premium'], form) ?? 0
  const [dateProps, setDateProps] = useState<{
    value?: Dayjs
  }>({})
  const [payment_dateProps, setPaymentDateProps] = useState<{
    value?: Dayjs
  }>({})

  const handleDateChange =
    (namePath: string | number | (string | number)[]) =>
    (value: Dayjs | null) => {
      if (!!value) {
        form.setFieldValue(namePath, value.unix())
      }
    }

  const { selectProps, queryResult: connectedQueryResult } =
    useSelect<TDebitNote>({
      resource: isFromDebitNote ? 'debit_notes' : 'renewals',
      optionLabel: 'note_no',
      optionValue: 'id',
    })
  //取得receipts
  const { data: receiptsData } = useList<DataType>({
    resource: 'receipts',
  })
  //取得receipts的debit_note_id or created_from_renewal_id
  const receiptsIds =
    receiptsData?.data?.map((item) => {
      if (isFromDebitNote) {
        return item?.debit_note_id
      } else {
        return item?.created_from_renewal_id
      }
    }) || []

  //過濾掉已經有receipts的debitNote or renewal
  const newData = selectProps.options?.filter((item) => {
		// 如果為當前的debit_note_id or created_from_renewal_id，則不過濾
    if (
      isFromDebitNote
        ? item?.value === receiptData?.debit_note_id
        : item?.value === receiptData?.created_from_renewal_id
    ) {
      return true
    }
    return !receiptsIds.includes(item?.value as number)
  })
  const fxnDebitNoteSelectProps = {
    ...selectProps,
    options: newData || [],
  }
  const selectedId = Form.useWatch(
    [isFromDebitNote ? 'debit_note_id' : 'created_from_renewal_id'],
    form,
  )
  const connectedQuery = connectedQueryResult?.data?.data || []
  const selectedConnected =
    connectedQuery?.find((theConnected) => theConnected?.id === selectedId) ||
    defaultDebitNote

  // 當selectedId改變時，更新premium的值
  useEffect(() => {
    if (!!selectedId) {
      const setPremium =
        receiptsData?.data.find((item) => item?.debit_note_id === selectedId)
          ?.premium || getTotalPremiumByDebitNote(selectedConnected)
      form.setFieldValue(['premium'], setPremium)
    }
  }, [selectedId])

  const templateText = getTemplateText(selectedConnected?.template || 'general')

  const { data: clientResult, isLoading: clientIsLoading } = useOne<TClient>({
    resource: 'clients',
    id: selectedConnected?.client_id || 0,
    queryOptions: {
      enabled: !!selectedConnected?.client_id,
    },
  })
  const selectedClient = clientResult?.data || defaultClient
  const display_name = getDisplayName(selectedClient)

  const Link = useLink()

  useEffect(() => {
    if (watchDate) {
      setDateProps({
        value: dayjs.unix(watchDate),
      })
    }
    if (watchPaymentDate) {
      setPaymentDateProps({
        value: dayjs.unix(watchPaymentDate),
      })
    }
  }, [watchDate, watchPaymentDate])
  //檢查selectedClient?.address_arr是否為array
  if (!Array.isArray(selectedClient?.address_arr)) {
    try {
      selectedClient.address_arr = JSON.parse(selectedClient.address_arr)
    } catch (error) {
      selectedClient.address_arr = []
      console.log('🚀 ~ error:', error)
    }
  }
  return (
    <Edit
      saveButtonProps={saveButtonProps}
      footerButtons={({ defaultButtons }) => (
        <>
          <Link to={`/debitNotes/show/${receiptData?.id}`}>
            <Button type="primary" icon={<EyeOutlined />}>
              Preview Print
            </Button>
          </Link>
          {defaultButtons}
        </>
      )}
    >
      <Form {...formProps} layout="vertical">
        <div className="table table_td-flex-1 w-full">
          <div className={`tr ${isFromDebitNote ? '' : 'tw-hidden'}`}>
            <div className="th">Connected Debit Note</div>
            <div className="td">
              <Form.Item noStyle name={['debit_note_id']}>
                <Select
                  {...fxnDebitNoteSelectProps}
                  size="small"
                  className="w-full"
                  allowClear
                />
              </Form.Item>
            </div>
            <div className="th"></div>
            <div className="td"></div>
          </div>
          <div className={`tr ${isFromRenewal ? '' : 'tw-hidden'}`}>
            <div className="th">Connected Renewal</div>
            <div className="td">
              <Form.Item noStyle name={['created_from_renewal_id']}>
                <Select
                  {...fxnDebitNoteSelectProps}
                  size="small"
                  className="w-full"
                  allowClear
                />
              </Form.Item>
            </div>
            <div className="th"></div>
            <div className="td"></div>
          </div>
        </div>

        <Alert
          className="my-24"
          message="The following content will be printed out"
          type="warning"
          showIcon
        />

        <Spin
          indicator={<LoadingOutlined className="text-2xl" spin />}
          tip="fetching data..."
          spinning={!!clientIsLoading && !!selectedId}
        >
          <div className="table table_td-flex-1 w-full">
            <div className="w-full mb-4 flex justify-between border-b-2 border-solid border-black pb-6 px-4">
              <div className="w-full">
                <img src={logo} className="print:w-1/3 min-w-[400px]" />
              </div>
              <div className="text-right text-xl font-semibold w-full flex flex-col justify-end">
                <p>{templateText.zh}</p>
                <p>{templateText.en}</p>
              </div>
            </div>

            <div className="text-center font-bold mb-8 print:mb-16 print:mt-8">
              <h1 className="text-xl">OFFICIAL RECEIPT</h1>
            </div>
            <div className="tr">
              <div className="th">To 致</div>
              <div className="td">
                <p>{selectedClient?.company}</p>
                <p>
                  {selectedClient?.name_en || selectedClient?.name_zh || ' '}
                </p>
              </div>
              <div className="th">Receipt No 號碼</div>
              <div className="td">
                <Form.Item
                  noStyle
                  name={['receipt_no']}
                  initialValue={receiptData?.receipt_no}
                >
                  <Input size="small" />
                </Form.Item>
              </div>
            </div>

            <div className="tr">
              <div className="th">Address 地址</div>
              <div className="td">
                {<p>{selectedClient?.address_arr?.join(' ')}</p>}
              </div>
              <div className="th">Date 日期</div>
              <div className="td">
                <DatePicker
                  className="w-full"
                  size="small"
                  onChange={handleDateChange(['date'])}
                  {...dateProps}
                />
                <Form.Item hidden name={['date']}>
                  <InputNumber />
                </Form.Item>
              </div>
            </div>
          </div>

          <Row gutter={0} className="mt-12">
            <Col span={12}>
              <div className="table table_td-flex-1 w-full">
                <div className="tr mt-4">
                  <div className="th">Received From 茲收到</div>
                  <div className="td">{display_name}</div>
                </div>
                <div className="tr">
                  <div className="th">THE SUM OF 款項</div>
                  <div className="td">{toWords.convert(watchPremium)}</div>
                </div>
                <div className="tr">
                  <div className="th w-60">BEING PAYMENT OF 用以支付項目</div>
                </div>
                <div className="tr">
                  <div className="th w-60">POLICY 保單號碼</div>
                  <div className="td">{selectedConnected?.policy_no}</div>
                </div>
                <div className="tr">
                  <div className="th w-60">DEBIT NOTE NO. 保費單號碼</div>
                  <div className="td">{selectedConnected?.note_no || ''}</div>
                </div>
              </div>
            </Col>
          </Row>

          <Row gutter={0} className="mt-12">
            <Col span={12}>
              <div className="table table_td-flex-1 w-full">
                <div className="tr mt-4">
                  <div className="th">Payment Date</div>
                  <div className="td">
                    <DatePicker
                      className="w-full"
                      size="small"
                      onChange={handleDateChange(['payment_date'])}
                      {...payment_dateProps}
                    />
                    <Form.Item hidden name={['payment_date']}>
                      <InputNumber />
                    </Form.Item>
                  </div>
                </div>
                <div className="tr">
                  <div className="th">Payment Method</div>
                  <div className="td">
                    <Form.Item noStyle name={['payment_method']}>
                      <Input size="small" />
                    </Form.Item>
                  </div>
                </div>
                <div className="tr">
                  <div className="th">Cheque No</div>
                  <div className="td">
                    <Form.Item noStyle name={['cheque_no']}>
                      <Input size="small" />
                    </Form.Item>
                  </div>
                </div>
                <div className="tr">
                  <div className="th">Code No</div>
                  <div className="td">
                    <Form.Item noStyle name={['code_no']}>
                      <Input size="small" />
                    </Form.Item>
                  </div>
                </div>
              </div>
            </Col>
            <Col span={12}>
              <div className="table table_td-flex-1 w-full">
                <div className="tr mt-4">
                  <div className="th">PREMIUM 保費</div>
                  <div className="td">
                    <Form.Item noStyle name={['premium']}>
                      <Input size="small" />
                    </Form.Item>
                  </div>
                </div>
              </div>
            </Col>
            <Col span={12} offset={12}>
              <div className="p-8">
                <p>For and on behalf of </p>
                <p>POTENTIAL INSURANCE AGENCY COMPANY</p>
              </div>
            </Col>
          </Row>
          <Alert
            className="my-24"
            message="The following content will NOT be printed out"
            type="warning"
            showIcon
          />
          <ReceiptBankSelect data={receiptData} />
          <DetailFooter model={false} />
        </Spin>
      </Form>
    </Edit>
  )
}
