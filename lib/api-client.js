import fetch from 'isomorphic-unfetch'
import { stringify } from 'query-string'

const formatError = (err) => {
  // TODO: decide on standard format for API errors
  return err
}

const checkStatus = (response) => {
  if (response.ok) {
    return response;
  }

  var error = new Error(response.statusText);
  error.response = response;
  return Promise.reject(error);
}

const buildQueryString = (data) => {
  const encoded = stringify(data, { skipNull: true });
  return encoded ? `?${encoded}` : ''
}

export function api(httpMethod) {
  const baseUrl = process.env.API_URL
  const defaultOptions = {
    method: httpMethod,
    credentials: 'include',
    mode: 'cors'
  }

  return (path, data = {}, options = {}) => {
    if (!path) {
      return Promise.reject('Missing required parameter path')
    }
    const requestPath = path.startsWith('/') ? path : `/${path}`

    let query
    let methodOptions
    if (httpMethod === 'GET') {
      query = buildQueryString(data)
      methodOptions = {}
    } else {
      query = ''
      methodOptions = {
        headers: {
          'Content-Type': 'application/json; charset=UTF-8'
        },
        body: JSON.stringify(data)
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
