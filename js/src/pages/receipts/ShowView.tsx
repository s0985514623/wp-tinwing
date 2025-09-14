import React, { useRef } from 'react'
import { IResourceComponentsProps, useOne, useShow } from '@refinedev/core'
import { Show } from '@refinedev/antd'
import { Row, Col, Alert, Button, Spin } from 'antd'
import { LoadingOutlined, PrinterOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { DataType } from './types'
import { DataType as TClient, defaultClient } from 'pages/clients/types'
import { DataType as TDebitNote } from 'pages/debitNotes/types'
import {
  getDisplayName,
  getTotalPremiumByDebitNote,
  getTemplateText,
} from 'utils'
import ReactToPrint from 'react-to-print'
import logo from 'assets/images/logo.jpg'
import DetailFooter from 'components/DetailFooter'
import { ToWords } from 'to-words'
import autograph from 'assets/images/autograph.jpg'
import { ReceiptBankSelect } from 'components/ReceiptBankSelect'
import { RemarkTextArea } from 'components/RemarkTextArea'
import { round } from 'lodash-es'
import DebitNotesFooter from 'components/DetailFooter'

export const ShowView: React.FC<IResourceComponentsProps> = () => {
  const toWords = new ToWords({ localeCode: 'en-US' })
  const { queryResult } = useShow<DataType>()
  const receiptData = queryResult?.data?.data as DataType
  const isLoading = queryResult?.isLoading
  // const isDebitNotes = Boolean(receiptData?.debit_note_id)
  const isFromRenewal = Boolean(receiptData?.created_from_renewal_id)
  const isFromCreditNote = Boolean(receiptData?.created_from_credit_note_id)

  const { data: debitNoteData } = useOne<TDebitNote>({
    resource: isFromRenewal ? 'renewals' : isFromCreditNote ? 'credit_notes' : 'debit_notes',
    id: isFromRenewal
      ? (receiptData?.created_from_renewal_id as number)
      : isFromCreditNote
        ? (receiptData?.created_from_credit_note_id as number)
        : (receiptData?.debit_note_id as number),
    queryOptions: {
      enabled: !!receiptData,
    },
  })
  const receiptPremium = queryResult?.data?.data.premium
  // console.log("🚀 ~ queryResult:", queryResult)
  const debitNote = debitNoteData?.data
  // console.log("🚀 ~ debitNote:", debitNote)
  const debitNoteNo = debitNote?.note_no || ''
  const templateText = getTemplateText(debitNote?.template || 'general')

  const { data: clientData } = useOne<TClient>({
    resource: 'clients',
    id: debitNote?.client_id || 0,
    queryOptions: {
      enabled: !!debitNote?.client_id,
    },
  })
  const client = clientData?.data || defaultClient
  const display_name = getDisplayName(client)

  const printRef = useRef<HTMLDivElement>(null)
  //檢查selectedClient?.address_arr是否為array
  if (!Array.isArray(client?.address_arr)) {
    try {
      client.address_arr = JSON.parse(client.address_arr)
    } catch (error) {
      client.address_arr = []
      console.log('🚀 ~ error:', error)
    }
  }
  return (
    <Show
      title="Preview Print"
      isLoading={isLoading}
      footerButtons={({ defaultButtons }) => (
        <>
          {defaultButtons}
          <ReactToPrint
            trigger={() => (
              <Button
                type="primary"
                size="large"
                className="px-12"
                danger
                icon={<PrinterOutlined />}
              >
                Print
              </Button>
            )}
            content={() => printRef.current}
          />
        </>
      )}
    >
      <div className="table table_td-flex-1 w-full">
        <div className="tr">
          <div className="th">
            {isFromRenewal ? 'Connected Renewal' : isFromCreditNote ? 'Connected Credit Note' : 'Connected Debit Note'}
          </div>
          <div className="td flex justify-between">
            <span>{debitNoteNo}</span>
            <span>{display_name}</span>
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
        spinning={isLoading}
      >
        <div ref={printRef} className="w-full">
          <div className="table table_td-flex-1 w-full">
            <div className="w-full mb-4 flex justify-between border-b-2 border-solid border-black pb-6 px-4">
              <div className="w-full">
                <img src={logo} className=" min-w-[400px] max-w-[600px]" />
              </div>
              <div className="print:text-3xl text-right text-xl font-semibold w-full flex flex-col justify-end">
                {/* <span>{templateText.zh}</span>
                <span>{templateText.en}</span> */}
              </div>
            </div>

            <div className="text-center font-bold mb-8 print:mb-16 print:mt-8">
              <h1 className="print:text-3xl text-xl">正式收據 OFFICIAL RECEIPT</h1>
            </div>
            <Row gutter={24}>
              <Col span={14}>
                <div className="table table_td-flex-1 w-full">
                  <div className="tr">
                    <div className="th">致 To</div>
                    <div className="td">
                      <p>{client?.company}</p>
                      <p>{client?.name_en || client?.name_zh || ' '}</p>
                    </div>
                  </div>
                  <div className="tr">
                    <div className="th">地址 Address</div>
                    <div className="td">
                      <p>{client?.address_arr?.map((address, index) => (
                        <p key={index}>{address}</p>
                      )) || ' '}</p>
                    </div>
                  </div>
                </div>
              </Col>
              <Col span={10}>
                <div className="table table_td-flex-1 w-full">
                  <div className="tr">
                    <div className="th">號碼 Receipt No</div>
                    <div className="td">{receiptData?.receipt_no}</div>
                  </div>
                  <div className="tr">
                    <div className="th">日期 Date</div>
                    <div className="td">
                      {!!receiptData?.date
                        ? dayjs.unix(receiptData?.date).format('YYYY-MM-DD')
                        : ''}
                    </div>
                  </div>
                </div>
              </Col>
            </Row>
          </div>

          <Row
            gutter={0}
            className="mt-12 pb-6 border-2 border-solid border-black"
          >
            <Col span={24}>
              <div className="table table_td-flex-1 w-full">
                <div className="tr mt-4">
                  <div className="th w-[22rem]">茲收到 Received From</div>
                  <div className="td">{display_name}</div>
                </div>
                <div className="tr">
                  <div className="th w-[22rem]">款項 The Sum Of</div>
                  <div className="td">
                    {toWords.convert(Number(receiptPremium ?? 0))}
                  </div>
                </div>
                <div className="tr">
                  <div className="th w-[22rem]">用以支付項目 Being Payment Of</div>
                </div>
                <div className="tr">
                  <div className="th w-[22rem]">保單號碼 Policy</div>
                  <div className="td">{debitNote?.policy_no}</div>
                </div>
                <div className="tr">
                  <div className="th w-[22rem]">保費單號碼 Debit Note No.</div>
                  <div className="td">{debitNoteNo}</div>
                </div>
              </div>
            </Col>
          </Row>

          <Row gutter={0} className="">
            <Col
              span={12}
              className="pt-6 border-l-2 border-solid border-black"
            >
              <div className="table table_td-flex-1 w-full">
                <div className="tr mt-4">
                  <div className="th w-[18rem]">付款日期 Payment Date</div>
                  <div className="td">
                    {!!receiptData?.payment_date
                      ? dayjs
                        .unix(receiptData?.payment_date)
                        .format('YYYY-MM-DD')
                      : ''}
                  </div>
                </div>
                <div className="tr">
                  <div className="th w-[18rem]">付款方法 Payment Method</div>
                  <div className="td">{receiptData?.payment_method}</div>
                </div>
                <div className="tr">
                  <div className="th w-[18rem]">支票號碼 Cheque No</div>
                  <div className="td">{receiptData?.cheque_no}</div>
                </div>
                <div className="tr">
                  <div className="th w-[18rem]">參考編號 Code No</div>
                  <div className="td">{receiptData?.code_no}</div>
                </div>              
              </div>
            </Col>
            <Col
              span={12}
              className="pt-6 border-r-2 border-solid border-black"
            >
              <div className="table table_td-flex-1 w-full">
                <div className="tr mt-4">
                  <div className="th">保費 Premium</div>
                  <div className="td">
                    HKD{' '}
                    {
                      round(Number(receiptPremium) ?? 0, 2).toLocaleString(
                        'en-US',
                        {
                          minimumFractionDigits: 2, // 最少小數點後兩位
                          maximumFractionDigits: 2, // 最多小數點後兩位
                        },
                      ) ??
                      getTotalPremiumByDebitNote(debitNote).toLocaleString(
                        'en-US',
                        {
                          minimumFractionDigits: 2, // 最少小數點後兩位
                          maximumFractionDigits: 2, // 最多小數點後兩位
                        },
                      )
                    }
                  </div>
                </div>
              </div>
            </Col>
            <RemarkTextArea data={receiptData} textAreaClassName="w-full" model="show" tableClassName="border-l-2 border-b-2 border-r-2 border-solid border-black" />
            <Col span={12} offset={12} className='print:text-xl'>
              <div className="p-8 text-[#000] font-semibold">
                <p>For and on behalf of </p>
                <p>POTENTIAL INSURANCE AGENCY COMPANY</p>
              </div>
              <div className="p-8 block text-[#000] font-semibold">
                <div>
                  <img src={autograph} alt="" className=" w-32" />
                </div>
                <span className="border-0 border-t border-solid border-black">
                  Authorized Signature
                </span>
              </div>
            </Col>
          </Row>
          <DebitNotesFooter model={false} className="p-4 w-full mt-8 text-[#000] font-semibold" />
        </div>
        <Alert
          className="my-24"
          message="The following content will NOT be printed out"
          type="warning"
          showIcon
        />
        <ReceiptBankSelect data={receiptData} model="show" />
        <DetailFooter model={false} />
      </Spin>
    </Show>
  )
}
