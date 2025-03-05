import CommonLayout from '../CommonLayout'

export default async function layout({ children }) {
  return <CommonLayout banner={null}>{children}</CommonLayout>
}
