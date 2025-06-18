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
  // console.log('🚀 ~ debitNoteData:', debitNoteData)
  // console.log('debitNoteData?.date', debitNoteData?.date)
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
      <div ref={printRef} className={`${templateText.en=='Motor Insurance'?'Motor':''} w-full`}>
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
              <p>到期通知書</p>
              <p>Expiry Notice</p>
            </div>
          </div>
          <Row gutter={24}>
            <Col span={12}>
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
            <Col span={12}>
              <div className="table table_td-flex-1 w-full">
                <div className="tr">
                  <div className="th">日期 Date</div>
                  <div className="td">
                    {' '}
                    {!!debitNoteData?.date
                      ? dayjs.unix(debitNoteData?.date).format('YYYY-MM-DD')
                      : ' '}
                  </div>
                </div>
                <div className="tr">
                  <div className="th">號碼 Note No</div>
                  <div className="td">{debitNoteData?.note_no || ''}</div>
                </div>
                <div className="tr">
                  <div className="th">保險類別 Class of Insurance</div>
                  <div className="td">{term?.name}</div>
                </div>
                <div className="tr">
                  <div className="th">代理 Agent</div>
                  <div className="td">{agent?.agent_number}</div>
                </div>
                <div className="tr">
                  <div className="th">客戶編號 Client No</div>
                  <div className="td">{client?.client_number || ' '}</div>
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
    </Show>
  )
}
