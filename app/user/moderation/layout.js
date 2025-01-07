import CommonLayout from '../../CommonLayout'

export default function Layout({ children }) {
  return (
    <CommonLayout banner={null}>
      <header>
        <h1>User Moderation</h1>
      </header>
      {children}
    </CommonLayout>
  )
}
