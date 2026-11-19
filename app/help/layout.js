import CommonLayout from '../CommonLayout'

export default function Layout({ children }) {
  return <CommonLayout>{children}</CommonLayout>
}

export const metadata = {
  title: 'Help | OpenReview',
  description: 'Browse the OpenReview documentation or send a request to the support team.',
}
