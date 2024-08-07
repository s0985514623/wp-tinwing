import React from 'react'
import { Input, Form } from 'antd'
import { WarningFilled } from '@ant-design/icons'
import { nanoid } from 'nanoid'
import { NamePath } from 'antd/lib/form/interface'
import { InputProps } from 'antd/lib/input'
import { FormItemProps } from 'antd/lib/form'

const UniqueInput: React.FC<{
    name: NamePath
    formItemProps?: FormItemProps
    inputProps?: InputProps
}> = ({ name, formItemProps, inputProps }) => {
    const form = Form.useFormInstance()
    const handleGenerate = () => {
        form.setFieldValue(name, nanoid())
    }

    return (
        <>
            <Form.Item
                {...{
                    className: 'mb-0',
                    ...formItemProps,
                    name,
                    rules: [
                        {
                            required: true,
                        },
                    ],
                }}
            >
                <Input {...inputProps} />
            </Form.Item>
            <p className="text-red-500">
                <WarningFilled className="mr-2" />
                This Field MUST be unique,{' '}
                <span
                    className="underline underline-offset-2 cursor-pointer"
                    onClick={handleGenerate}
                >
                    click here to Auto generate.
                </span>
            </p>
        </>
    )
}

export default UniqueInput
