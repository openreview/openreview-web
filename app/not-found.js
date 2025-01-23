import ErrorDisplay from '../components/ErrorDisplay'

export default function NotFound() {
  return (
    <ErrorDisplay
      statusCode={404}
      message="Please check that the URL is spelled correctly and try again."
    />
  )
}
