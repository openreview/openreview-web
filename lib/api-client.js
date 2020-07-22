import { stringify } from 'query-string'

const formatError = (err) => {
  if (!process.env.IS_PRODUCTION) {
    // eslint-disable-next-line no-console
    console.warn(err)
  }
  return Promise.reject(err)
}

const checkStatus = async (response) => {
  if (response.ok) {
    return response
  }

  const errorBody = await response.json()
  const error = new Error(errorBody.message)
  error.name = errorBody.name || response.statusText
  error.status = errorBody.status || response.status
  error.details = Array.isArray(errorBody.errors) ? errorBody.errors[0] : errorBody.errors
  return Promise.reject(error)
}

const buildQueryString = (data) => {
  const encoded = stringify(data, { skipNull: true })
  return encoded ? `?${encoded}` : ''
}

let fetchFn = typeof fetch === 'undefined' ? () => {} : fetch
const configure = (options) => {
  if (typeof options.fetchFn === 'function') {
    // eslint-disable-next-line prefer-destructuring
    fetchFn = options.fetchFn
  }
}

export default function api(httpMethod) {
  const baseUrl = process.env.API_URL || 'http://localhost:3000'
  const defaultOptions = {
    method: httpMethod,
    credentials: 'include',
    mode: 'cors',
  }

  return (path, data = {}, options = {}) => {
    if (!path) {
      const noPathError = new Error('Missing required parameter path')
      noPathError.status = 400
      noPathError.name = 'Bad Request'
      return Promise.reject(noPathError)
    }
    const requestPath = path.startsWith('/') ? path : `/${path}`

    const defaultHeaders = {
      Accept: 'application/json,text/*;q=0.99',
    }
    if (options.accessToken) {
      defaultHeaders.Authorization = `Bearer ${options.accessToken}`
    }

    let query
    let methodOptions
    if (httpMethod === 'GET') {
      query = buildQueryString(data)
      methodOptions = {
        headers: defaultHeaders,
      }
    } else {
      query = ''
      methodOptions = {
        headers: {
          ...defaultHeaders,
          'Content-Type': 'application/json; charset=UTF-8',
        },
        body: JSON.stringify(data),
      }
    }

    return fetchFn(baseUrl + requestPath + query, { ...defaultOptions, ...methodOptions })
      .then(checkStatus)
      .then(r => r.json())
      .catch(formatError)
  }
}
api.get = api('GET')
api.post = api('POST')
api.put = api('PUT')
api.delete = api('DELETE')

api.configure = configure
