import React, { useState, useEffect } from 'react'
import { IResourceComponentsProps, useLink } from '@refinedev/core'
import { Edit, useForm, useSelect } from '@refinedev/antd'
import {
  Form,
  Select,
  DatePicker,
  InputNumber,
  Input,
  Button,
  Alert,
  Row,
  Col,
} from 'antd'
import dayjs, { Dayjs } from 'dayjs'
import EditTemplateGeneral from './components/EditTemplateGeneral'
import EditTemplateMotor from './components/EditTemplateMotor'
import EditTemplateShortTerms from './components/EditTemplateShortTerms'
import EditTemplatePackage from './components/EditTemplatePackage'
import EditDebitNoteHeader from './components/EditDebitNoteHeader'
import DetailFooter from 'components/DetailFooter'
import EditMetaMotor from './components/EditMetaMotor'
import EditMetaGeneral from './components/EditMetaGeneral'
import { TTemplate, DataType } from './types'
import { DataType as TClient, defaultClient } from 'pages/clients/types'
import { DataType as TAgent } from 'pages/agents/types'
import { DataType as TTerm } from 'pages/terms/types'
import { getTemplateText } from 'utils'
import { EyeOutlined } from '@ant-design/icons'
import logo from 'assets/images/logo.jpg'
import { RemarkTextArea } from 'components/RemarkTextArea'

export const EditView: React.FC<IResourceComponentsProps> = () => {
  const { formProps, saveButtonProps, form, queryResult } = useForm()

  const debitNoteData = queryResult?.data?.data as DataType

  const watchDate = Form.useWatch(['date'], form)
  const [dateProps, setDateProps] = useState<{
    value?: Dayjs
  }>({})

  const [selectedClientId, setSelectedClientId] = useState<number | null>(null)
	//TODO 接上功能
	const [selectedDebitNoteId, setSelectedDebitNoteId] = useState<number | undefined>(undefined)

  const [selectedTemplate, setSelectedTemplate] = useState<TTemplate>('general')

  const { selectProps: clientSelectProps, queryResult: clientQueryResult } =
    useSelect<TClient>({
      resource: 'clients',
      optionLabel: 'display_name', //出來的是name_en or name_zh 透過這個再去取得真實display_name
      optionValue: 'id',
    })
  //轉換新的clientSelectProps options
  const fxnClientSelectProps = {
    ...clientSelectProps,
    options: clientSelectProps?.options?.map((option) => {
      const display_name = option.label as 'name_en' | 'name_zh' | 'company'
      return {
        label: clientQueryResult?.data?.data.find(
          (client) => client.id === option.value,
        )?.[display_name],
        value: option.value,
      }
    }),
  }
  const filterOption = (
    input: string,
    option?: { label: string; value: string },
  ) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())

  const clients = clientQueryResult?.data?.data || []
  const selectedClient =
    clients.find((theClient) => theClient?.id === selectedClientId) ||
    defaultClient

  const handleClientSelect = (value: any) => {
    setSelectedClientId(value)
  }

  const { selectProps: agentSelectProps } = useSelect<TAgent>({
    resource: 'agents',
    optionLabel: 'agent_number',
    optionValue: 'id',
  })

  const handleDateChange = (value: Dayjs | null) => {
    if (!!value) {
      form.setFieldValue(['date'], value.unix())
      setDateProps({ value })
    }
  }

  const templateText = getTemplateText(selectedTemplate)

  useEffect(() => {
    if (!!watchDate) {
      setDateProps({ value: dayjs.unix(watchDate) })
    }
  }, [watchDate])

  useEffect(() => {
    if (!!debitNoteData) {
      setSelectedClientId(debitNoteData?.client_id || null)
      setSelectedTemplate(debitNoteData?.template || 'general')
    }
  }, [debitNoteData])

  const Link = useLink()

  const { selectProps: termSelectProps } = useSelect<TTerm>({
    resource: 'terms',
    optionLabel: 'name',
    optionValue: 'id',
    filters: [
      // {
      //     field: 'taxonomy',
      //     operator: 'eq',
      //     value: 'insurance_class',
      // },
      {
        field: 'meta_query[0][key]',
        operator: 'eq',
        value: 'taxonomy',
      },
      {
        field: 'meta_query[0][value]',
        operator: 'eq',
        value: 'insurance_class',
      },
      {
        field: 'meta_query[0][compare]',
        operator: 'eq',
        value: '=',
      },
    ],
  })
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
          <Link to={`/debitNotes/show/${debitNoteData?.id}`}>
            <Button type="primary" icon={<EyeOutlined />}>
              Preview Print
            </Button>
          </Link>
          {defaultButtons}
        </>
      )}
    >
      <Form {...formProps} layout="vertical">
        <EditDebitNoteHeader setSelectedTemplate={setSelectedTemplate} setSelectedDebitNoteId={setSelectedDebitNoteId} />
        <div className="table table_td-flex-1 w-full">
          <div className="w-full mb-4 flex justify-between border-b-2 border-solid border-black pb-6 px-4">
            <div className="w-full">
              <img src={logo} className="print:w-1/3 min-w-[320px]" />
            </div>
            <div className="text-right text-xl font-semibold w-full flex flex-col justify-end">
              <p>{templateText.zh}</p>
              <p>{templateText.en}</p>
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
            <Col span={12}>
              <div className="w-full">
                <Form.Item noStyle name={['client_id']}>
                  <Select
                    {...fxnClientSelectProps}
                    size="small"
                    className="w-full"
                    allowClear
                    onChange={handleClientSelect}
                    onSearch={(_value: string) => {
                      // console.log('search:', value);
                    }}
                    //TODO 類型問題
                    filterOption={filterOption as any}
                  />
                </Form.Item>
                <p>{selectedClient?.company || ' '}</p>
                <p>
                  {selectedClient?.display_name
                    ? selectedClient[selectedClient?.display_name]
                    : ''}
                </p>
                {selectedClient?.address_arr?.map((address, index) => (
                  <p key={index}>{address}</p>
                )) || ' '}
              </div>
            </Col>
            <Col span={12}>
              <div className="table table_td-flex-1 w-full">
                <div className="tr">
                  <div className="th">日期 Date</div>
                  <div className="td">
                    <DatePicker
                      className="w-full"
                      size="small"
                      onChange={handleDateChange}
                    />
                    <Form.Item hidden name={['date']}>
                      <InputNumber />
                    </Form.Item>
                  </div>
                </div>
                <div className="tr">
                  <div className="th">號碼 Note No</div>
                  <div className="td">
                    <Form.Item noStyle name={['note_no']}>
                      <Input className="w-full" size="small" />
                    </Form.Item>
                  </div>
                </div>
                <div className="tr">
                  <div className="th">保險類別 Class of Insurance</div>
                  <div className="td">
                    <Form.Item noStyle name={['term_id']}>
                      <Select
                        {...termSelectProps}
                        size="small"
                        className="w-full"
                        allowClear
                      />
                    </Form.Item>
                  </div>
                </div>
                <div className="tr">
                  <div className="th">代理 Agent</div>
                  <div className="td">
                    <Form.Item noStyle name={['agent_id']}>
                      <Select
                        {...agentSelectProps}
                        size="small"
                        className="w-full"
                        allowClear
                      />
                    </Form.Item>
                  </div>
                </div>
                <div className="tr">
                  <div className="th">客戶編號 Client No</div>
                  <div className="td">
                    {selectedClient?.client_number || ' '}
                  </div>
                </div>
              </div>
            </Col>
          </Row>
        </div>
        <div className="table table_td-flex-1 w-full">
          <div className="text-center font-bold mb-8 print:mb-16 print:mt-8">
            <h1 className="text-xl">Debit Note</h1>
          </div>
          <div className="tr">
            <div className="th">Client</div>
            <div className="td">
              <Form.Item noStyle name={['client_id']}>
                <Select
                  {...clientSelectProps}
                  size="small"
                  className="w-full"
                  allowClear
                  onChange={handleClientSelect}
                />
              </Form.Item>
              <p>{selectedClient?.company || ' '}</p>
              <p>{selectedClient?.name_en || selectedClient?.name_zh || ' '}</p>
            </div>
            <div className="th inner-table">
              <p>Date</p>
              <p>Note No</p>
            </div>
            <div className="td inner-table">
              <p>
                <DatePicker
                  className="w-full"
                  size="small"
                  onChange={handleDateChange}
                  {...dateProps}
                />
                <Form.Item hidden name={['date']}>
                  <InputNumber />
                </Form.Item>
              </p>
              <p>{debitNoteData?.note_no || ''}</p>
            </div>
          </div>

          <div className="tr">
            <div className="th">Address</div>
            <div className="td">
              {selectedClient?.address_arr?.map((address, index) => (
                <p key={index}>{address}</p>
              )) || ' '}
            </div>
            <div className="th inner-table">
              <p>Agent</p>
              <p>Client No</p>
            </div>
            <div className="td inner-table">
              <p>
                <Form.Item noStyle name={['agent_id']}>
                  <Select
                    {...agentSelectProps}
                    size="small"
                    className="w-full"
                    allowClear
                  />
                </Form.Item>
              </p>
              <p>{selectedClient?.client_number || ' '}</p>
            </div>
          </div>
        </div>

        {selectedTemplate === 'general' && <EditTemplateGeneral />}
        {selectedTemplate === 'motor' && <EditTemplateMotor />}
        {selectedTemplate === 'shortTerms' && <EditTemplateShortTerms />}
        {selectedTemplate === 'package' && <EditTemplatePackage />}
        <DetailFooter />
        <Alert
          className="my-24"
          message="The following content will NOT be printed out"
          type="warning"
          showIcon
        />
        <RemarkTextArea data={debitNoteData} />
        {selectedTemplate === 'general' && <EditMetaGeneral />}
        {selectedTemplate === 'motor' && <EditMetaMotor />}
      </Form>
    </Edit>
  )
}
