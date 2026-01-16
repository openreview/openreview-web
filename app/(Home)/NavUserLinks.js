import truncate from 'lodash/truncate'
import Link from 'next/link'
import LogoutLink from './LogoutLink'
import NavNotificationCount from './NavNotificationCount'
import serverAuth from '../auth'
import { Menu, Space } from 'antd'
import { CaretDownFilled, MoreOutlined } from '@ant-design/icons'

export default async function NavUserLinks() {
  const { user } = await serverAuth()

  if (!user) {
    return (
      <Menu
        style={{ justifyContent: 'flex-end' }}
        mode="horizontal"
        selectedKeys={[]}
        items={[{ key: 'login', label: <Link href="/login">Login</Link> }]}
      />
    )
  }

  const userMenuItems = [
    {
      key: 'notifications',
      label: (
        <Link href="/notifications">
          Notifications <NavNotificationCount />
        </Link>
      ),
    },
    { key: 'activity', label: <Link href="/activity">Activity</Link> },
    { key: 'tasks', label: <Link href="/tasks">Tasks</Link> },
    {
      key: 'user',
      label: (
        <Space>
          {truncate(user.profile.fullname, { length: user.impersonator ? 12 : 22 })}
          {user.impersonator && ' (Impersonated)'}
        </Space>
      ),
      children: [
        {
          key: 'profile',
          label: <Link href="/profile">Profile</Link>,
        },
        {
          key: 'logout-link',
          label: <LogoutLink />,
        },
      ],
    },
  ]
  return (
    <Menu
      style={{ justifyContent: 'flex-end' }}
      mode="horizontal"
      selectedKeys={[]}
      items={userMenuItems}
      expandIcon={<CaretDownFilled />}
      overflowedIndicator={<MoreOutlined />}
    />
  )
}
