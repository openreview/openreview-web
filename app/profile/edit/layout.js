import CommonLayout from '../../CommonLayout'

export default function Layout({ children }) {
  return <CommonLayout banner={null}>{children}</CommonLayout>
}

export const metadata = {
  title: 'Edit Profile | OpenReview',
}
