import React, { useRef } from 'react'
import {
  IResourceComponentsProps,
  useShow,
  useOne,
  useCreate,
} from '@refinedev/core'
import { Show } from '@refinedev/antd'
import { Button, Alert, Row, Col } from 'antd'
import dayjs from 'dayjs'
import ShowTemplateGeneral from './components/ShowTemplateGeneral'
import ShowTemplateMotor from './components/ShowTemplateMotor'
import ShowTemplateShortTerms from './components/ShowTemplateShortTerms'
import ShowTemplatePackage from './components/ShowTemplatePackage'
import DetailFooter from 'components/DetailFooter'
import ShowMetaMotor from './components/ShowMetaMotor'
import ShowMetaGeneral from './components/ShowMetaGeneral'
import { DataType } from './types'
import { DataType as TClient, defaultClient } from 'pages/clients/types'
import { DataType as TAgent } from 'pages/agents/types'
import { DataType as TTerm } from 'pages/terms/types'
import { getTemplateText } from 'utils'
import { PrinterOutlined } from '@ant-design/icons'
import ReactToPrint from 'react-to-print'
import logo from 'assets/images/logo.jpg'
import ShowDebitNoteHeader from './components/ShowDebitNoteHeader'
import { RemarkTextArea } from 'components/RemarkTextArea'
import { useNavigate } from 'react-router-dom'
import ShowTemplateMarine from './components/ShowTemplateMarine'

export const ShowView: React.FC<IResourceComponentsProps> = () => {
  const navigate = useNavigate()
  const { mutate: createDebitNote } = useCreate({
    resource: 'debit_notes',
    mutationOptions: {
      onSuccess: (data, variables, context) => {
        navigate(`/debitNotes/show/${data?.data}`)
        // console.log('🚀 ~ data:', data);
        // Let's celebrate!
      },
    },
  })
  const { queryResult } = useShow<DataType>()
  // console.log('🚀 ~ queryResult:', queryResult);
  const debitNoteData = queryResult?.data?.data as DataType
  // console.log('🚀 ~ debitNoteData:', debitNoteData)
  const isLoading = queryResult?.isLoading

  const { data: clientData } = useOne<TClient>({
    resource: 'clients',
    id: debitNoteData?.client_id || 0,
    queryOptions: {
      enabled: !!debitNoteData?.client_id,
    },
  })

  const client = clientData?.data || defaultClient

  const { data: agentData } = useOne<TAgent>({
    resource: 'agents',
    id: debitNoteData?.agent_id || 0,
    queryOptions: {
      enabled: !!debitNoteData?.agent_id,
    },
  })
  const agent = agentData?.data

  const printRef = useRef<HTMLDivElement>(null)

  const templateText = getTemplateText(debitNoteData?.template || 'general')

  const { data: termData } = useOne<TTerm>({
    resource: 'terms',
    id: debitNoteData?.term_id || 0,
    queryOptions: {
      enabled: !!debitNoteData?.term_id,
    },
  })
  const term = termData?.data
  //檢查selectedClient?.address_arr是否為array
  if (!Array.isArray(client?.address_arr)) {
    try {
      client.address_arr = JSON.parse(client.address_arr)
    } catch (error) {
      client.address_arr = []
      console.log('🚀 ~ error:', error)
    }
  }
  const handleCreateDebitNote = () => {
    // console.log('click handle');
    createDebitNote({
      values: debitNoteData,
    })
  }
  return (
    <Show
      title="Preview Print"
      isLoading={isLoading}
      headerButtons={({ defaultButtons }) => (
        <>
          {defaultButtons}
          <Button type="primary" onClick={handleCreateDebitNote}>
            Create Debit Note
          </Button>
        </>
      )}
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
      <ShowDebitNoteHeader template={debitNoteData?.template || ''} />
      <div ref={printRef} className={`${templateText.en == 'Motor Insurance' ? 'Motor' : ''} w-full print:absolute print:top-0 print:left-0`}>
        <div className="table table_td-flex-1 w-full">
          <div className="w-full mb-4 flex justify-between border-b-2 border-solid border-black pb-6 px-4">
            <div className="w-full">
              <img src={logo} className=" min-w-[400px] max-w-[600px]" />
            </div>
            <div className="print:text-3xl text-right text-xl font-semibold w-full flex flex-col justify-end">
              <span>{templateText.zh}</span>
              <span>{templateText.en}</span>
            </div>
          </div>

          <div className="w-full mb-4 flex justify-between">
            <div className="flex flex-col justify-end">
              <p>保險名稱 / 通訊地址</p>
              <p>Insured / correspondence Address</p>
            </div>
            <div className="text-center text-lg font-semibold border-2 border-solid border-black py-2 px-12">
              <p>續保通知書</p>
              <p>Renewal Notice</p>
            </div>
          </div>
          <Row gutter={24}>
            <Col span={14}>
              <div className="w-full">
                <p>{client?.company || ' '}</p>
                <p>
                  {client?.display_name ? client[client?.display_name] : ''}
                </p>
                {client?.address_arr?.map((address, index) => (
                  <p key={index}>{address}</p>
                )) || ' '}
              </div>
            </Col>
            <Col span={10}>
              <div className="table table_td-flex-1 w-full template64">
                <div className="tr">
                  <div className="th">
                    <p>日期 Date</p>
                  </div>
                  <div className="td">
                    <p>
                      {' '}
                      {!!debitNoteData?.date
                        ? dayjs.unix(debitNoteData?.date).format('YYYY-MM-DD')
                        : ' '}
                    </p>
                  </div>
                </div>
                <div className="tr">
                  <div className="th">
                    <p>號碼 Note No</p>
                  </div>
                  <div className="td">
                    <p>{debitNoteData?.note_no || ''}</p>
                  </div>
                </div>
                <div className="tr">
                  <div className="th">
                    <p>保險類別 Class of Insurance</p>
                  </div>
                  <div className="td">
                    <p>{term?.name}</p>
                  </div>
                </div>
                <div className="tr">
                  <div className="th">
                    <p>代理 Agent</p>
                  </div>
                  <div className="td">
                    <p>{agent?.agent_number}</p>
                  </div>
                </div>
                <div className="tr">
                  <div className="th">
                    <p>客戶編號 Client No</p>
                  </div>
                  <div className="td">
                    <p>{client?.client_number || ' '}</p>
                  </div>
                </div>
              </div>
            </Col>
          </Row>
        </div>

        {debitNoteData?.template === 'general' && (
          <ShowTemplateGeneral data={debitNoteData} />
        )}
        {debitNoteData?.template === 'motor' && (
          <ShowTemplateMotor data={debitNoteData} />
        )}
        {debitNoteData?.template === 'shortTerms' && (
          <ShowTemplateShortTerms data={debitNoteData} />
        )}
        {debitNoteData?.template === 'package' && (
          <ShowTemplatePackage data={debitNoteData} />
        )}
        {debitNoteData?.template === 'marineInsurance' && (
          <ShowTemplateMarine data={debitNoteData} />
        )}
        <DetailFooter />
      </div>
      <Alert
        className="my-24"
        message="The following content will NOT be printed out"
        type="warning"
        showIcon
      />
      <RemarkTextArea data={debitNoteData} model={'show'} />
      {debitNoteData?.template === 'general' && <ShowMetaGeneral />}
      {debitNoteData?.template === 'motor' && <ShowMetaMotor />}
      {debitNoteData?.template === 'shortTerms' && <ShowMetaGeneral />}
      {debitNoteData?.template === 'package' && <ShowMetaGeneral />}
      {debitNoteData?.template === 'marineInsurance' && <ShowMetaGeneral />}
    </Show>
  )
}
