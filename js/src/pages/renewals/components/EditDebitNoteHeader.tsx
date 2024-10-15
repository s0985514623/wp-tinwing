import React from 'react'
import { Alert, Form, Select } from 'antd'
import { templates, TTemplate } from '../types'
import { useDebitNoteId } from 'hooks'
import { useSelect } from '@refinedev/antd'
import { DataType as TDebitNote } from 'pages/debitNotes/types'

const EditDebitNoteHeader: React.FC<{
  setSelectedTemplate: React.Dispatch<React.SetStateAction<TTemplate>>
  setSelectedDebitNoteId: React.Dispatch<
    React.SetStateAction<number | undefined>
  >
}> = ({ setSelectedTemplate, setSelectedDebitNoteId }) => {
  const handleTemplateSelect = (value: TTemplate) => {
    setSelectedTemplate(value)
  }
  const handleDebitNoteSelect = (value: any) => {
    setSelectedDebitNoteId(value)
  }

  const form = Form.useFormInstance()

  const _debit_note_id = useDebitNoteId(form)

  const { selectProps: debitNoteSelectProps } = useSelect<TDebitNote>({
    resource: 'debit_notes',
    optionLabel: 'note_no',
    optionValue: 'id',
  })
  return (
    <>
      <div className="table table_td-flex-1 w-full">
        <div className="tr">
          <div className="th">Type of Insurer</div>
          <div className="td">
            <Form.Item noStyle name={['template']} initialValue="general">
              <Select
                size="small"
                className="w-full"
                options={templates.map((template) => ({
                  label: template.label,
                  value: template.value,
                }))}
                onChange={handleTemplateSelect}
              />
            </Form.Item>
          </div>
          <div className="th">Connected Debit Note</div>
          <div className="td">
            <Form.Item noStyle name={['debit_note_id']}>
              <Select
                {...debitNoteSelectProps}
                size="small"
                className="w-full"
                allowClear
                onChange={handleDebitNoteSelect}
              />
            </Form.Item>
          </div>
        </div>
      </div>

      <Alert
        className="my-24"
        message="The following content will be printed out"
        type="warning"
        showIcon
      />
    </>
  )
}

export default EditDebitNoteHeader
