import CommonLayout from '../CommonLayout'

export const metadata = {
  title: 'Tasks | OpenReview',
}

export default function Layout({ children }) {
  return (
    <CommonLayout banner={null}>
      <header>
        <h1>Tasks</h1>
      </header>
      {children}
    </CommonLayout>
  )
}
