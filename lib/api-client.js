import fetch from 'isomorphic-unfetch'
import { stringify } from 'query-string'

const formatError = (err) => {
  // TODO: decide on standard format for API errors
  // eslint-disable-next-line no-console
  console.log(err)
  return Promise.reject(err)
}

const checkStatus = async (response) => {
  if (response.ok) {
    return response
  }

  const errorBody = await response.json()
  const error = new Error(errorBody.message)
  error.name = response.statusText
  error.status = errorBody.status
  error.details = errorBody.errors
  return Promise.reject(error)
}

const buildQueryString = (data) => {
  const encoded = stringify(data, { skipNull: true })
  return encoded ? `?${encoded}` : ''
}

export default function api(httpMethod) {
  const baseUrl = process.env.API_URL
  let defaultHeaders = {
    Accept: 'application/json,text/*;q=0.99',
  }
  const defaultOptions = {
    method: httpMethod,
    credentials: 'include',
    mode: 'cors',
    headers: defaultHeaders,
  }

  return (path, data = {}, options = {}) => {
    if (!path) {
      return Promise.reject(new Error('Missing required parameter path'))
    }
    const requestPath = path.startsWith('/') ? path : `/${path}`
    const authHeader = options.accessToken
      ? { Authorization: `Bearer ${options.accessToken}` }
      : {}
    defaultHeaders = { ...defaultHeaders, ...authHeader }

    let query
    let methodOptions
    if (httpMethod === 'GET') {
      query = buildQueryString(data)
      methodOptions = {}
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

    return fetch(baseUrl + requestPath + query, { ...defaultOptions, ...methodOptions })
      .then(checkStatus)
      .then(r => r.json())
      // .then(data => {
      //   console.log(data)
      //   return data
      // })
      .catch(formatError)
  }
}
api.get = api('GET')
api.post = api('POST')
api.put = api('PUT')
api.delete = api('DELETE')
