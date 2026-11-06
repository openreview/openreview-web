import CommonLayout from '../CommonLayout'

export default function Layout({ children }) {
  return <CommonLayout>{children}</CommonLayout>
}

export const metadata = {
  title: 'Help & Support | OpenReview',
  description:
    'Search the OpenReview documentation for an answer, or send a request to the OpenReview support team.',
}
