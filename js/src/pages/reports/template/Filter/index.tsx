import { Form, Button, DatePicker, FormProps, Card } from 'antd';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;
const Filter: React.FC<{ formProps: FormProps }> = ({ formProps }) => {
    return (
        <Card bordered={false} title="Filter">
            <Form {...formProps} layout="vertical">
                <div className="flex">
                    <Form.Item label="Date" name={['dateRange']} initialValue={[dayjs().subtract(7, 'day'), dayjs()]}>
                        <RangePicker className="w-full" />
                    </Form.Item>
                    <Form.Item label="&nbsp;">
                        <Button type="primary" htmlType="submit" className="w-full ml-2">
                            Filter
                        </Button>
                    </Form.Item>
                </div>
            </Form>
        </Card>
    );
};

export default Filter;
