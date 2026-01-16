import '../lib/logger'
// import 'bootstrap/dist/css/bootstrap.min.css'
import '../styles/global.scss'
// import '../styles/components.scss'
import { Noto_Sans } from 'next/font/google'
import AppInit from './AppInit'
import StoreProvider from '../storeProvider'
import Nav from './(Home)/Nav'
import GoogleAnalyticsScript from './GoogleAnalyticsScript'
import ThemeProvider from '../ThemeProvider'

const notoSans = Noto_Sans({
  subsets: ['latin'],
  weight: ['400', '700'],
  style: ['normal', 'italic'],
  display: 'fallback',
})

export const metadata = {
  charSet: 'utf-8',
  description: 'Promoting openness in scientific communication and the peer-review process',
  openGraph: {
    title: 'OpenReview',
    description: '',
    image: 'https://openreview.net/images/openreview_logo_512.png',
    type: 'website',
    site_name: 'OpenReview',
  },
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <StoreProvider>
        <ThemeProvider>
          <body
            className={notoSans.className}
            style={{
              backgroundColor: '#fffdfa',
              minHeight: '100vh',
              display: 'flex',
              flexDirection: 'column',
              margin: 0,
            }}
          >
            <Nav />
            <AppInit />
            {children}
          </body>
        </ThemeProvider>
      </StoreProvider>
      <GoogleAnalyticsScript />
    </html>
  )
}
