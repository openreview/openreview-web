import { ConfigProvider } from 'antd'
import { AntdRegistry } from '@ant-design/nextjs-registry'

const primaryColor = '#3e6775'
const backgroundWhite = '#fffdfa'
const orRed = '#8c1b13'
const subtleGray = '#616161'
const backgroundGray = '#dddddd'

const theme = {
  token: {
    borderRadius: 2,
    colorLink: primaryColor,
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
      optionSelectedBg: primaryColor,
      optionSelectedColor: backgroundWhite,
    },
    Input: {
      colorBorder: primaryColor,
      hoverBorderColor: '#4f7a8a',
      activeBorderColor: '#2e4f5a',
      lineWidth: 2,
    },
    Layout: {
      footerPadding: 0,
      bodyBg: backgroundWhite,
    },
    Pagination: {
      itemBg: '#efece3',
      itemActiveBg: primaryColor,
      itemActiveColor: backgroundWhite,
      colorPrimary: '#efece3',
      colorPrimaryHover: '#efece3',
    },
    Modal: {
      contentBg: backgroundWhite,
    },
    Menu: {
      itemBg: orRed,
      colorText: 'white',
      horizontalItemSelectedColor: 'transparent',
      popupBg: orRed,
    },
    Alert: {
      colorInfoBg: backgroundGray,
      colorText: subtleGray,
    },
  },
}

const ThemeProvider = ({ children }) => {
  return (
    <AntdRegistry>
      <ConfigProvider theme={theme} wave={{ disabled: true }}>
        {children}
      </ConfigProvider>
    </AntdRegistry>
  )
}

export default ThemeProvider
