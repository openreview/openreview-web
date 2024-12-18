import CommonLayout from '../CommonLayout'

export default function layout({ children }) {
  return (
    <CommonLayout banner={null}>
      <header>
        <h1>Activity</h1>
      </header>
      {children}
    </CommonLayout>
  )
}
