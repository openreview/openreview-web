import { AntdRegistry } from '@ant-design/nextjs-registry'
import { ConfigProvider } from 'antd'

const primaryColor = '#3e6775'
const backgroundWhite = '#fffdfa'
const orRed = '#8c1b13'
const subtleGray = '#616161'
const backgroundGray = '#dddddd'

const theme = {
  token: {
    borderRadius: 2,
    colorLink: primaryColor,
    fontFamily: 'Noto Sans, sans-serif',
  },
  components: {
    Tabs: {
      cardBg: '#efece3',
      cardGutter: 5,
      itemColor: primaryColor,
      itemActiveColor: primaryColor,
      itemSelectedColor: '#555',
      itemHoverColor: 'unset',
    },
    Button: {
      colorPrimary: primaryColor,
      colorPrimaryHover: '#4f7a8a',
      colorPrimaryActive: '#2e4f5a',
      fontWeight: 700,
      borderRadius: 3,
      borderRadiusSM: 3,
    },
    Select: {
      colorBorder: primaryColor,
      hoverBorderColor: '#4f7a8a',
      activeBorderColor: '#2e4f5a',
      colorBgContainer: '#fffaf4',
      lineWidth: 2,
      optionSelectedBg: primaryColor,
      optionSelectedColor: backgroundWhite,
    },
    Input: {
      colorBorder: primaryColor,
      hoverBorderColor: '#4f7a8a',
      activeBorderColor: '#3e6775',
      colorBgContainer: '#fffaf4',
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
    Notification: {
      colorErrorBg: '#f2dede',
      colorSuccessBg: '#dff0d8',
      colorInfoBg: '#dff0d8',
      width: '80vw',
    },
  },
}

const ThemeProvider = ({ children }) => (
  <AntdRegistry>
    <ConfigProvider theme={theme} wave={{ disabled: true }}>
      {children}
    </ConfigProvider>
  </AntdRegistry>
)

export default ThemeProvider
