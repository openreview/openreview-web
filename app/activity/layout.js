import CommonLayout from '../CommonLayout'

export default function Layout({ children }) {
  return (
    <CommonLayout banner={null}>
      <header>
        <h1>Activity</h1>
      </header>
      {children}
    </CommonLayout>
  )
}

export const metadata = {
  title: 'Activity | OpenReview',
}
