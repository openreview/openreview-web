import { Badge as AntdBadge } from 'antd'

const Badge = ({ children, ...props }) => (
  <AntdBadge
    {...props}
    styles={{
      root: { color: 'inherit' },
      indicator: { backgroundColor: '#777', boxShadow: 'none' },
    }}
  >
    {children}
  </AntdBadge>
)

export default Badge
