import ErrorDisplay from './ErrorDisplay'

export default function withError(Component) {
  const WithError = (props) => {
    const { statusCode, message } = props

    if (statusCode) {
      return <ErrorDisplay statusCode={statusCode} message={message} />
    }

    // eslint-disable-next-line react/jsx-props-no-spreading
    return <Component {...props} />
  }

  WithError.getInitialProps = async (ctx) => {
    let props = null
    if (Component.getInitialProps) {
      try {
        props = await Component.getInitialProps(ctx)
      } catch (error) {
        props = {
          statusCode: error.status || 500,
          message: error.message,
        }
      }
    }
    props = props || {}

    if (props.statusCode && ctx.res) {
      ctx.res.statusCode = props.statusCode
    }
    return props
  }

  WithError.displayName = `withError(${
    Component.displayName || Component.name || 'Component'
  })`
  WithError.bodyClass = Component.bodyClass

  return WithError
}
