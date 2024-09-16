import React, { useContext } from 'react';
import { useActiveAuthProvider, useGetIdentity, useLogout, useGetLocale, useSetLocale } from '@refinedev/core';
import { Avatar, Layout as AntdLayout, Space, Dropdown, MenuProps,Button } from 'antd';
import type { RefineLayoutHeaderProps } from '@refinedev/antd';
import { LoginOutlined, UserOutlined, TranslationOutlined, CheckOutlined } from '@ant-design/icons';
import { useColor } from 'hooks';
import { useTranslation } from 'react-i18next';
import { ColorModeContext } from 'contexts/color-mode';
import { useQueryClient } from '@tanstack/react-query';
// import { needAuth, ALLOW_EMAILS } from 'utils';

export const Header: React.FC<RefineLayoutHeaderProps> = () => {
    const queryClient = useQueryClient();
    const { i18n } = useTranslation();
    const locale = useGetLocale();
    const changeLanguage = useSetLocale();
    const currentLocale = locale();

    const authProvider = useActiveAuthProvider();
    const { data: user } = useGetIdentity({
        v3LegacyAuthProviderCompatible: Boolean(authProvider?.isLegacy),
    });

    // const shouldRenderHeader = needAuth ? user && (user.name || user.avatar) : true;

    const { colorPrimary, colorSuccess } = useColor();
    const { mutate: logout } = useLogout();
    const { mode, setMode } = useContext(ColorModeContext);

    const handleLogout = () => {
        logout();
        queryClient.clear();
    };
		const handleGoBackWp = () => {
			// TODO: 本地會加上port號，確認線上是否會有port號
			window.location.href = '/wp-admin';
		}
    const userEmail: string = user?.user_metadata?.email || '';
    // if (!ALLOW_EMAILS.includes(userEmail) && needAuth && userEmail) {
    //     setTimeout(() => handleLogout(), 300);
    // }

    const userOptions: MenuProps['items'] = [
        {
            key: 'userName',
            label: user?.name || 'Test',
            icon: <UserOutlined className="w-4" />,
            disabled: true,
        },
        {
            type: 'divider',
        },
        {
            key: 'mode',
            label: (
                <p className="m-0" onClick={() => setMode(mode === 'light' ? 'dark' : 'light')}>
                    {mode === 'light' ? 'Dark Mode' : 'Light Mode'}
                </p>
            ),
            icon: <div className="inline-block w-4">{mode === 'light' ? '🌛' : '🔆'}</div>,
        },
        {
            key: 'languages',
            label: 'Languages',
            icon: <TranslationOutlined className="w-4" />,
            children: [...(i18n.languages || [])].sort().map((lang: string) => {
                return {
                    key: lang,
                    label: (
                        <p className="m-0 flex justify-between w-24" onClick={() => changeLanguage(lang)}>
                            {lang === 'en' ? 'English' : 'German'}
                            {lang === currentLocale && <CheckOutlined style={{ color: colorSuccess }} />}
                        </p>
                    ),
                    icon: <Avatar size={16} src={`/images/flags/${lang}.svg`} />,
                };
            }),
        },
        {
            type: 'divider',
        },
        {
            key: 'logOut',
            label: (
                <p className="m-0" onClick={handleLogout}>
                    Log Out
                </p>
            ),
            icon: <LoginOutlined className="w-4" />,
        },
    ];

    return  (
        <AntdLayout.Header
            style={{
                position: 'sticky',
                top: 0,
                zIndex: 1,
                width: '100%',
                display: 'flex',
                justifyContent: 'end',
                alignItems: 'center',
                padding: '0px 24px',
                height: '105px',
                backgroundColor: colorPrimary,
            }}>
            <Space style={{ marginLeft: '8px' }}>
							<Button type="primary" onClick={handleGoBackWp}>返回WP後台</Button>
                {/* <Dropdown menu={{ items: userOptions }}>
                    <Avatar className="cursor-pointer" style={{ backgroundColor: '#fde3cf', color: '#f56a00' }}>
                        {(user?.name || 'Test')?.charAt(0).toUpperCase()}
                    </Avatar>
                </Dropdown> */}
            </Space>
        </AntdLayout.Header>
    );
};
