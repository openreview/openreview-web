import ErrorDisplay from '../components/ErrorDisplay'

export default function Error404() {
  return <ErrorDisplay statusCode={404} message="Page not found" />
}

Error404.bodyClass = 'error-404'
