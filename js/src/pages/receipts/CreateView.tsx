import React, { useState, useEffect } from 'react'
import {
  IResourceComponentsProps,
  useOne,
  useUpdate,
  BaseRecord,
  useList,
} from '@refinedev/core'
import { Create, useForm, useSelect } from '@refinedev/antd'
import {
  Form,
  DatePicker,
  InputNumber,
  Row,
  Col,
  Alert,
  Select,
  Input,
  Spin,
} from 'antd'
import { LoadingOutlined } from '@ant-design/icons'
import { Dayjs } from 'dayjs'
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
import { DataType } from './types'
import { ReceiptBankSelect } from 'components/ReceiptBankSelect'
import { useNavigate, useLocation } from 'react-router-dom'
import { RemarkTextArea } from 'components/RemarkTextArea'

export const CreateView: React.FC<IResourceComponentsProps> = () => {
  const navigate = useNavigate()
  const toWords = new ToWords()
  const { formProps, saveButtonProps, form, onFinish } = useForm({
    //使新增後跳轉到clientsSummary
    redirect: false,
    onMutationSuccess: () => {
      navigate('/archived_receipts')
    },
  })
  const watchPremium = Number(Form.useWatch(['premium'], form)) || 0
  //取得state
  const { state } = useLocation()
  const debit_note_id = state?.debit_note_id || 0
  const renewalId = state?.renewalId || 0
  const credit_note_id = state?.credit_note_id || 0
  const [selectOptions, setSelectOptions] = useState(
    renewalId
      ? 'renewal'
      : debit_note_id
        ? 'debitNote'
        : credit_note_id
          ? 'creditNote'
          : '',
  )
  useEffect(() => {
    if (renewalId) {
      form.setFieldValue(['created_from_renewal_id'], renewalId)
    }
    if (debit_note_id) {
      form.setFieldValue(['debit_note_id'], debit_note_id)
    }
    if (credit_note_id) {
      form.setFieldValue(['created_from_credit_note_id'], credit_note_id)
    }
  }, [])
  const handleChangeSelectOptions = (value: string) => {
    setSelectOptions(value)
  }

  //取得 debitNote
  const {
    selectProps: debitNoteSelectProps,
    queryResult: debitNoteQueryResult,
  } = useSelect<TDebitNote>({
    resource: 'debit_notes',
    optionLabel: 'note_no',
    optionValue: 'id',
  })
  //取得 renewal
  const { selectProps: renewalsProps, queryResult: renewalsQueryResult } =
    useSelect<TDebitNote>({
      resource: 'renewals',
      optionLabel: 'note_no',
      optionValue: 'id',
    })
  //取得creditNote
  const {
    selectProps: creditNoteSelectProps,
    queryResult: creditNoteQueryResult,
  } = useSelect<TDebitNote>({
    resource: 'credit_notes',
    optionLabel: 'note_no',
    optionValue: 'id',
  })
  //取得receipts
  const { data: receiptsData } = useList<DataType>({
    resource: 'receipts',
  })
  //取得receipts的debit_note_id
  const receiptsIds =
    receiptsData?.data?.map((item) => {
      return item?.debit_note_id
    }) || []
  //取得receipts的created_from_renewal_id
  const receiptsCreatedFromRenewalIds =
    receiptsData?.data?.map((item) => {
      return item?.created_from_renewal_id
    }) || []
  //取得receipts的created_from_credit_note_id
  const receiptsCreatedFromCreditNoteIds =
    receiptsData?.data?.map((item) => {
      return item?.created_from_credit_note_id
    }) || []
  //過濾掉已經有receipts的debitNote
  const newData = debitNoteSelectProps.options?.filter(
    (item) => !receiptsIds.includes(item?.value as number),
  )
  const fxnDebitNoteSelectProps = {
    ...debitNoteSelectProps,
    options: newData || [],
  }
  //過濾掉已經有receipts的created_from_renewal_id
  const renewalsData = renewalsProps.options?.filter(
    (item) => !receiptsCreatedFromRenewalIds.includes(item?.value as number),
  )
  const fxnRenewalsDataSelectProps = {
    ...renewalsProps,
    options: renewalsData || [],
  }
  //過濾掉已經有receipts的created_from_credit_note_id
  const creditNoteData = creditNoteSelectProps.options?.filter(
    (item) => !receiptsCreatedFromCreditNoteIds.includes(item?.value as number),
  )
  const fxnCreditNoteSelectProps = {
    ...creditNoteSelectProps,
    options: creditNoteData || [],
  }

  //取得選擇的debit_note_id
  const selectedDebitNoteId = Form.useWatch(['debit_note_id'], form)
  const debitNotes = debitNoteQueryResult?.data?.data || []
  const selectedDebitNote =
    debitNotes?.find(
      (theDebitNote) => theDebitNote?.id === selectedDebitNoteId,
    ) || defaultDebitNote
  // console.log("🚀 ~ selectedDebitNote:", selectedDebitNote)
  //取得選擇的RenewalId
  const selectedRenewalId = Form.useWatch(['created_from_renewal_id'], form)
  const Renewals = renewalsQueryResult?.data?.data || []
  const selectedRenewal =
    Renewals?.find((theRenewal) => theRenewal?.id === selectedRenewalId) ||
    defaultDebitNote
  // console.log("🚀 ~ selectedRenewal:", selectedRenewal)
  //取得選擇的creditNoteId
  const selectedCreditNoteId = Form.useWatch(
    ['created_from_credit_note_id'],
    form,
  )
  const creditNotes = creditNoteQueryResult?.data?.data || []
  const selectedCreditNote =
    creditNotes?.find(
      (theCreditNote) => theCreditNote?.id === selectedCreditNoteId,
    ) || defaultDebitNote
  //定義選擇的data資料是哪一組
  const selectedData =
    selectOptions == 'renewal'
      ? selectedRenewal
      : selectOptions == 'debitNote'
        ? selectedDebitNote
        : selectOptions == 'creditNote'
          ? selectedCreditNote
          : undefined
  //當selectedDebitNoteId改變時，更新premium的值
  useEffect(() => {
    // console.log('🚀 ~ selectOptions:', selectOptions);
    if (selectOptions == 'debitNote' && !!selectedDebitNoteId) {
      form.setFieldValue(
        ['premium'],
        getTotalPremiumByDebitNote(selectedDebitNote),
      )
    } else if (selectOptions == 'renewal' && !!selectedRenewalId) {
      form.setFieldValue(
        ['premium'],
        getTotalPremiumByDebitNote(selectedRenewal),
      )
    } else if (selectOptions == 'creditNote' && !!selectedCreditNoteId) {
      form.setFieldValue(
        ['premium'],
        -getTotalPremiumByDebitNote(selectedCreditNote),
      )
    } else form.setFieldValue(['premium'], 0)
  }, [
    selectedDebitNoteId,
    selectedRenewalId,
    selectedCreditNoteId,
    selectOptions,
  ])

  const templateText = getTemplateText(selectedData?.template || 'general')

  const { data: clientResult, isLoading: clientIsLoading } = useOne<TClient>({
    resource: 'clients',
    id: selectedData?.client_id || 0,
    queryOptions: {
      enabled: !!selectedData?.client_id,
    },
  })

  const selectedClient = clientResult?.data || defaultClient
  //檢查selectedClient?.address_arr是否為array
  if (!Array.isArray(selectedClient?.address_arr)) {
    try {
      selectedClient.address_arr = JSON.parse(selectedClient.address_arr)
    } catch (error) {
      selectedClient.address_arr = []
      console.log('🚀 ~ error:', error)
    }
  }
  const display_name = getDisplayName(selectedClient)

  // TODO 同步更新 debitNote.receiptId
  const { mutate: _ } = useUpdate()
  const handleFinish = (values: BaseRecord) => {
    onFinish(values).catch((error) => error)
    // if (!!values?.debit_note_id) {
    //     mutate({
    //         resource: 'debit_notes',
    //         values: {
    //             receiptId: 'New receiptId',
    //         },
    //         id: values?.debit_note_id,
    //     })
    // }
  }
  //處理日期
  const handleDateChange =
    (namePath: string | number | (string | number)[]) =>
      (value: Dayjs | null) => {
        if (!!value) {
          form.setFieldValue(namePath, value.unix())
        }
      }
  return (
    <Create saveButtonProps={saveButtonProps}>
      <Form {...formProps} layout="vertical" onFinish={handleFinish}>
        <Form.Item hidden name={['is_archived']} initialValue={0} />
        <Form.Item hidden name={['is_paid']} initialValue={0} />
        <div className="table table_td-flex-1 w-full">
          <div className="tr">
            <div className="th">Connected To</div>
            <div className="td">
              <Select
                options={[
                  { label: 'Renewal', value: 'renewal' },
                  { label: 'Debit Note', value: 'debitNote' },
                  { label: 'Credit Note', value: 'creditNote' },
                ]}
                size="small"
                className="w-full"
                allowClear
                defaultValue={selectOptions}
                onChange={handleChangeSelectOptions}
              />
            </div>
            <div className="w-1/2"></div>
          </div>
          <div className={`tr ${selectOptions == 'renewal' ? '' : 'tw-hidden'}`}>
            <div className="th">Connected Renewal</div>
            <div className="td">
              <Form.Item noStyle name={['created_from_renewal_id']}>
                <Select
                  {...fxnRenewalsDataSelectProps}
                  size="small"
                  className="w-full"
                  allowClear
                />
              </Form.Item>
            </div>
            <div className="w-1/2"></div>
          </div>
          <div className={`tr ${selectOptions == 'debitNote' ? '' : 'tw-hidden'}`}>
            <div className="th">Connected Debit Note </div>
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
            <div className="w-1/2"></div>
          </div>
          <div className={`tr ${selectOptions == 'creditNote' ? '' : 'tw-hidden'}`}>
            <div className="th">Connected Credit Note </div>
            <div className="td">
              <Form.Item noStyle name={['created_from_credit_note_id']}>
                <Select
                  {...fxnCreditNoteSelectProps}
                  size="small"
                  className="w-full"
                  allowClear
                />
              </Form.Item>
            </div>
            <div className="w-1/2"></div>
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
          spinning={!!clientIsLoading && !!selectedDebitNoteId}
        >
          <div className="table table_td-flex-1 w-full">
            <div className="w-full mb-4 flex justify-between border-b-2 border-solid border-black pb-6 px-4">
              <div className="w-full">
                <img src={logo} className="print:w-1/3 min-w-[400px] max-w-[600px]" />
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
                <Form.Item noStyle name={['receipt_no']}>
                  <Input size="small" />
                </Form.Item>
              </div>
            </div>

            <div className="tr">
              <div className="th">Address 地址</div>
              <div className="td">
                <p>
                  {selectedClient?.address_arr.map((address, index) => (
                    <p key={index}>{address}</p>
                  ))}
                </p>
              </div>
              <div className="th">Date 日期</div>
              <div className="td">
                <DatePicker
                  className="w-full"
                  size="small"
                  onChange={handleDateChange(['date'])}
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
                  <div className="td">{selectedData?.policy_no}</div>
                </div>
                <div className="tr">
                  <div className="th w-60">DEBIT NOTE NO. 保費單號碼</div>
                  <div className="td">{selectedData?.note_no}</div>
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
                <RemarkTextArea textAreaClassName="w-full" />
              </div>
            </Col>
            <Col span={12}>
              <div className="table table_td-flex-1 w-full">
                <div className="tr mt-4">
                  <div className="th">PREMIUM 保費</div>
                  <div className="td">
                    <Form.Item noStyle name={['premium']}>
                      <InputNumber addonBefore="HKD" className="w-full" size="small" min={0} stringMode step="0.01" />
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
          <ReceiptBankSelect />
          <DetailFooter model={false} />
        </Spin>
      </Form>
    </Create>
  )
}
