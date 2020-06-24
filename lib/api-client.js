import { stringify } from 'query-string'

const formatError = err => Promise.reject(err) // TODO: update here when removing translateErrorMessage

const checkStatus = async (response) => {
  if (response.ok) {
    return response
  }

  const errorBody = await response.json()
  const error = new Error(errorBody.message)
  error.name = response.statusText
  error.status = errorBody.status
  error.details = Array.isArray(errorBody.errors) ? errorBody.errors[0] : errorBody.errors
  return Promise.reject(error)
}

const buildQueryString = (data) => {
  const encoded = stringify(data, { skipNull: true })
  return encoded ? `?${encoded}` : ''
}

export default function api(httpMethod) {
  const baseUrl = process.env.API_URL
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

    return fetch(baseUrl + requestPath + query, { ...defaultOptions, ...methodOptions })
      .then(checkStatus)
      .then(r => r.json())
      .catch(formatError)
  }
}
api.get = api('GET')
api.post = api('POST')
api.put = api('PUT')
api.delete = api('DELETE')
