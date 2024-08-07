import React, { useState } from 'react';
import { LoginPageProps, LoginFormTypes, useLogin, useRegister } from '@refinedev/core';
import { Row, Col, Layout, Card, Button, CardProps, LayoutProps, FormProps, Form, Input, Spin, notification } from 'antd';
import { GoogleOutlined } from '@ant-design/icons';
import logo from 'assets/images/logo.jpg';

type LoginProps = LoginPageProps<LayoutProps, CardProps, FormProps>;

/**
 * **refine** has a default login page form which is served on `/login` route when the `authProvider` configuration is provided.
 *
 * @see {@link https://refine.dev/docs/ui-frameworks/antd/components/antd-auth-page/#login} for more details.
 */
type TLoginProps = {
    email: string;
    password: string;
};

export const LoginPage: React.FC<LoginProps> = ({ providers, contentProps, wrapperProps, renderContent }) => {
    const [isLoading, setIsLoading] = useState(false);

    const { mutate: login } = useLogin<LoginFormTypes>();
    const { mutate: register } = useRegister<TLoginProps>();
    const [form] = Form.useForm();

    const renderProviders = () => {
        if (providers && providers.length > 0) {
            return (
                <>
                    {providers.map((provider) => {
                        return (
                            <Button
                                size="large"
                                key={provider.name}
                                type="primary"
                                block
                                icon={provider.icon}
                                style={{
                                    display: 'flex',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    width: '100%',
                                    marginBottom: '0px',
                                }}
                                onClick={() =>
                                    login({
                                        providerName: provider.name,
                                    })
                                }>
                                <GoogleOutlined className="mr-2" />
                                {provider.label}
                            </Button>
                        );
                    })}
                </>
            );
        }
        return null;
    };

    const handleSubmit = (values: TLoginProps) => {
        setIsLoading(true);
        login(
            {
                ...values,
                providerName: 'email',
            },
            {
                onSettled: () => {
                    setIsLoading(false);
                },
            },
        );
    };

    const handleRegister = () => {
        setIsLoading(true);
        form.validateFields()
            .then((values) => {
                register(values, {
                    onSuccess: () => {
                        notification.success({
                            message: 'Success',
                            description: 'You have successfully registered.',
                        });
                    },
                    onSettled: () => {
                        setIsLoading(false);
                    },
                });
            })
            .catch((error) => {
                console.log(error);
            });
    };

    const CardContent = (
        <Card className="bg-white/80 py-2 rounded-2xl shadow-2xl text-center" {...(contentProps ?? {})}>
            <img src={logo} className="w-full mb-4" alt="logo" />
            <div className="border-b-[1px] border-gray-200 mb-8 pb-2">
                <Form form={form} layout="vertical" onFinish={handleSubmit}>
                    <Form.Item
                        name={['email']}
                        label="Email"
                        rules={[
                            {
                                type: 'email',
                                message: 'The input is not valid E-mail!',
                            },
                            {
                                required: true,
                                message: 'Please input your E-mail!',
                            },
                        ]}>
                        <Input allowClear size="large" />
                    </Form.Item>
                    <Form.Item
                        name={['password']}
                        label="Password"
                        rules={[
                            {
                                required: true,
                                message: 'Please input your password!',
                            },
                            {
                                min: 8,
                                message: 'Password must be at least 8 characters!',
                            },
                        ]}>
                        <Input.Password allowClear placeholder="********" size="large" />
                    </Form.Item>
                    <div className="grid gap-4 w-full grid-cols-2">
                        <Form.Item>
                            <Button type="primary" htmlType="submit" className="w-full" size="large">
                                Login
                            </Button>
                        </Form.Item>
                        <Form.Item>
                            <Button type="link" onClick={handleRegister} className="w-full" size="large">
                                Register
                            </Button>
                        </Form.Item>
                    </div>
                </Form>
            </div>
            {renderProviders()}
        </Card>
    );

    return (
        <Layout {...(wrapperProps ?? {})}>
            <Row
                justify="center"
                align="middle"
                style={{
                    height: '100vh',
                }}>
                <Col className="max-w-sm" xs={20}>
                    <Spin spinning={isLoading}>{renderContent ? renderContent(CardContent, 'Login') : CardContent}</Spin>
                </Col>
            </Row>
        </Layout>
    );
};
