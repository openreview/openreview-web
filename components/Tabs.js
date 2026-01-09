import { Activity } from 'react'
import { Tabs as AntdTabs } from 'antd'

const Tabs = ({ items }) => {
  const activityItems = items.map((item) => ({
    ...item,
    children: <Activity mode="visible">{item.children}</Activity>,
  }))

  return (
    <AntdTabs
      type="card"
      styles={{
        item: { fontWeight: '600' },
      }}
      items={activityItems}
    />
  )
}

export default Tabs
