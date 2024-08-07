import React from 'react'
import { Alert } from 'antd'

const ShowDebitNoteHeader: React.FC<{ template: string }> = ({ template }) => {
    return (
        <>
            <div className="table table_td-flex-1 w-full">
                <div className="tr">
                    <div className="th">Type of Insurer</div>
                    <div className="td">{template}</div>
                    <div className="w-1/2"></div>
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

export default ShowDebitNoteHeader
