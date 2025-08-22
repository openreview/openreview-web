import serverAuth from '../auth'
import CommonLayout from '../CommonLayout'
import PDFViewer from './PDFViewer'

export const metadata = {
  title: 'PDF Viewer | OpenReview',
}

export default async function page({ searchParams }) {
  const { token } = await serverAuth()
  const query = await searchParams

  return (
    <CommonLayout banner={null}>
      <PDFViewer query={query} accessToken={token} />
    </CommonLayout>
  )
}
