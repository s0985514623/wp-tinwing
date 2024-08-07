import React from 'react'
import {
    TitleProps,
    useRouterContext,
    useRouterType,
    useLink,
} from '@refinedev/core'
import logo from 'assets/images/logo.jpg'
import logoSM from 'assets/images/logo-sm.jpg'

export const Title: React.FC<TitleProps> = ({ collapsed }) => {
    const routerType = useRouterType()
    const Link = useLink()
    const { Link: LegacyLink } = useRouterContext()

    const ActiveLink = routerType === 'legacy' ? LegacyLink : Link

    return (
        <ActiveLink to="/">
            {collapsed ? (
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    <img
                        src={logoSM}
                        alt="logo"
                        style={{
                            margin: '0 auto',
                            padding: '12px 0',
                            maxHeight: '65.5px',
                        }}
                    />
                </div>
            ) : (
                <img src={logo} alt="logo" className="w-60 m-4" />
            )}
        </ActiveLink>
    )
}
