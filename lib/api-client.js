import { stringify } from 'query-string'

const formatError = (err) => {
  if (typeof window === 'undefined' || !process.env.IS_PRODUCTION) {
    // Always log the error if this is a server side API call
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

const request = (httpMethod) => {
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

    const baseUrl = (options.version === 2 ? process.env.API_V2_URL : process.env.API_URL) || 'http://localhost:3000'

    const defaultHeaders = {
      Accept: 'application/json,text/*;q=0.99',
    }
    if (options.accessToken) {
      defaultHeaders.Authorization = `Bearer ${options.accessToken}`
    }

    let query
    let methodOptions
    if (httpMethod === 'GET') {
      // IE11 doesn't support cache params in fetch
      const isIE11 = typeof window !== 'undefined' && !!window.MSInputMethodContext && !!document.documentMode
      if (options.cachePolicy === 'no-ie') {
        query = isIE11 ? buildQueryString({ ...data, _: Date.now() }) : buildQueryString(data)
      } else if (options.cachePolicy === 'no-cache') {
        query = isIE11
          ? buildQueryString({ ...data, cache: false, _: Date.now() })
          : buildQueryString({ ...data, cache: false })
      } else {
        query = buildQueryString(data)
      }

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
      .catch((err) => {
        if (typeof window !== 'undefined' && (process.env.IS_PRODUCTION || process.env.IS_STAGING)) {
          window.gtag('event', 'exception', {
            description: `API Error: ${httpMethod} ${requestPath + query} returned "${err.message}" ${JSON.stringify(err)}`,
            fatal: false,
          })
        }
        return formatError(err)
      })
  }
}
const get = request('GET')
const post = request('POST')
const put = request('PUT')
const del = request('DELETE')

const sendFile = (readStream, accessToken) => {
  const baseUrl = process.env.API_URL || 'http://localhost:3000'

  return fetchFn(`${baseUrl}/pdf`, {
    method: 'PUT',
    credentials: 'include',
    mode: 'cors',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/pdf',
    },
    body: readStream,
  })
    .then(checkStatus)
    .then(r => r.json())
    .catch((err) => {
      if (typeof window !== 'undefined' && (process.env.IS_PRODUCTION || process.env.IS_STAGING)) {
        window.gtag('event', 'exception', {
          description: `API Error: PUT /pdf returned "${err.message}" ${JSON.stringify(err)}`,
          fatal: false,
        })
      }
      return formatError(err)
    })
}

const getById = async (apiPath, id, accessToken, apiVersion) => {
  if (apiVersion === 2 && !process.env.API_V2_URL) return null

  try {
    const apiRes = await get(`/${apiPath}`, { id }, { accessToken, version: apiVersion })
    return apiRes[apiPath]?.length > 0
      ? { ...apiRes[apiPath][0], apiVersion }
      : null
  } catch (apiError) {
    if (apiError.name === 'Not Found' || apiError.name === 'NotFoundError') {
      return null
    }
    throw apiError
  }
}

const getInvitationById = async (invitationId, accessToken) => {
  const invitationObj = await getById('invitations', invitationId, accessToken, 1)
  if (invitationObj) {
    return invitationObj
  }

  return getById('invitations', invitationId, accessToken, 2)
}

const getNoteById = async (noteId, accessToken) => {
  const noteObj = await getById('notes', noteId, accessToken, 1)
  if (noteObj) {
    return noteObj
  }

  return getById('notes', noteId, accessToken, 2)
}

const getCombined = async ({ path, data1 = {}, data2 = null, options = {} }) => {

  if (!process.env.API_V2_URL) {
    return get(path, data1, options)
  }

  const [apiRes1, apiRes2] = await Promise.all([
    get(path, data1, options),
    get(path, data2 ?? data1, { ...options, version: 2 }),
  ])

  const resultsKey = options.resultsKey || path.substring(1)
  const results1 = apiRes1[resultsKey] ?? []
  const results2 = apiRes2[resultsKey] ?? []
  const sortOptions = {
    'cdate:asc': (a, b) => a.cdate - b.cdate,
    'cdate:desc': (a, b) => b.cdate - a.cdate,
    'mdate:asc': (a, b) => a.mdate - b.mdate,
    'mdate:desc': (a, b) => b.mdate - a.mdate,
    'tmdate:asc': (a, b) => a.tmdate - b.tmdate,
    'tmdate:desc': (a, b) => b.tmdate - a.tmdate,
  }
  const sortFn = sortOptions[options.sort || ''] ?? sortOptions['cdate:asc']

  return {
    [resultsKey]: results1.concat(results2).sort(sortFn),
    count: (apiRes1.count ?? 0) + (apiRes2.count ?? 0),
  }
}

const api = {
  get,
  post,
  put,
  delete: del,
  sendFile,
  getInvitationById,
  getNoteById,
  getCombined,
  configure,
}
export default api
