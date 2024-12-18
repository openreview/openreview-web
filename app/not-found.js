import ErrorDisplay from '../components/ErrorDisplay'
import CommonLayout from './CommonLayout'

export default function NotFound() {
  return (
    <CommonLayout>
      <ErrorDisplay
        statusCode={404}
        message="Please check that the URL is spelled correctly and try again."
      />
    </CommonLayout>
  )
}
