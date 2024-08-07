import React, { useState } from 'react'
import { Select, Tooltip } from 'antd'

import { IConstant } from 'types'
import { SelectProps } from 'antd/lib/select'
import { TooltipProps } from 'antd/lib/tooltip'

const useConstantSelect = ({
    constants,
    hasTooltip = false,
    tooltipProps = {
        title: 'Please select',
    },
    selectProps = {
        style: { width: 120 },
        defaultValue: '',
    },
}: {
    constants: IConstant<string>[]
    hasTooltip?: boolean
    tooltipProps?: TooltipProps
    selectProps?: SelectProps
}) => {
    const [value, setValue] = useState<string>(selectProps?.defaultValue || '')
    const handleChange = (theValue: string) => {
        setValue(theValue)
    }

    const defaultSelectProps = {
        ...selectProps,
        options: constants.map((c) => ({
            label: c.label,
            value: c.value,
        })),
        onChange: handleChange,
    }

    const renderSelect = () => {
        return (
            <>
                {hasTooltip ? (
                    <Tooltip {...tooltipProps}>
                        <Select {...defaultSelectProps} />
                    </Tooltip>
                ) : (
                    <Select {...defaultSelectProps} />
                )}
            </>
        )
    }

    return {
        value,
        setValue,
        renderSelect,
        selectProps: defaultSelectProps,
    }
}

export default useConstantSelect
