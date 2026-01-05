import { ConfigProvider } from 'antd'

const theme = {
  token: {
    borderRadius: 2,
  },
  components: {
    Tabs: {
      cardBg: '#efece3',
      cardGutter: 5,
      itemColor: '#3e6775',
      itemSelectedColor: '#555',
      itemHoverColor: 'unset',
    },
    Button: {
      colorPrimary: '#3e6775',
      colorPrimaryHover: '#4f7a8a',
      colorPrimaryActive: '#2e4f5a',
    },
  },
}

const ThemeProvider = ({ children }) => {
  return <ConfigProvider theme={theme}>{children}</ConfigProvider>
}

export default ThemeProvider
