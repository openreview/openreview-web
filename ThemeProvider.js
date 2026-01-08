import { ConfigProvider } from 'antd'
import { AntdRegistry } from '@ant-design/nextjs-registry'

const primaryColor = '#3e6775'
const theme = {
  token: {
    borderRadius: 2,
  },
  components: {
    Tabs: {
      cardBg: '#efece3',
      cardGutter: 5,
      itemColor: primaryColor,
      itemSelectedColor: '#555',
      itemHoverColor: 'unset',
    },
    Button: {
      colorPrimary: primaryColor,
      colorPrimaryHover: '#4f7a8a',
      colorPrimaryActive: '#2e4f5a',
    },
    Select: {
      colorBorder: primaryColor,
      hoverBorderColor: '#4f7a8a',
      activeBorderColor: '#2e4f5a',
      lineWidth: 2,
    },
    Input: {
      colorBorder: primaryColor,
      hoverBorderColor: '#4f7a8a',
      activeBorderColor: '#2e4f5a',
      lineWidth: 2,
    },
  },
}

const ThemeProvider = ({ children }) => {
  return (
    <AntdRegistry>
      <ConfigProvider theme={theme}>{children}</ConfigProvider>
    </AntdRegistry>
  )
}

export default ThemeProvider
