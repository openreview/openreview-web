import CommonLayout from '../CommonLayout'

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
