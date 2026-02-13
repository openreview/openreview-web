import CommonLayout from '../CommonLayout'

export const metadata = {
  title: 'My Reviews | OpenReview',
}

export default function Layout({ children }) {
  return (
    <CommonLayout banner={null}>
      <header>
        <h1>My Reviews</h1>
      </header>
      {children}
    </CommonLayout>
  )
}
