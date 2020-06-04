import ErrorDisplay from '../components/ErrorDisplay'

export default function Error404(props) {
  return (
    <ErrorDisplay statusCode={404} message="Page not found" />
  )
}
