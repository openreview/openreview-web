/* eslint-disable arrow-body-style */
/* eslint-disable react/jsx-props-no-spreading */

import React from 'react'
import ErrorPage from 'next/error'

export default (Component) => {
  return class WithError extends React.Component {
    static async getInitialProps(ctx) {
      let props = Component.getInitialProps
        ? await Component.getInitialProps(ctx)
        : null
      props = props || {}

      if (props.statusCode && ctx.res) {
        ctx.res.statusCode = props.statusCode
      }
      return props
    }

    render() {
      const { statusCode } = this.props
      if (statusCode) {
        return <ErrorPage statusCode={statusCode} />
      }
      return <Component {...this.props} />
    }
  }
}
