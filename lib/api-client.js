/* eslint-disable no-use-before-define */
import { stringify } from 'query-string'
import { shouldTryRefreshToken, getTokenPayload } from './clientAuth'

const formatError = (err) => {
  if (process.env.SERVER_ENV !== 'production') {
    // eslint-disable-next-line no-console
    console.warn(err)
  }

  let networkErr
  if (err instanceof TypeError) {
    networkErr = new Error(
      'The OpenReview API is currently unavailable, please wait and try again later'
    )
    networkErr.name = 'UnavailableError'
    networkErr.status = 500
    networkErr.details = {}
  }

  return Promise.reject(networkErr ?? err)
}

const checkStatus = async (response, originalRequest) => {
  if (response.ok) {
    return response
  }

  const errorBody = await response.json()
  if (errorBody.status === 401 && originalRequest && shouldTryRefreshToken()) {
    // client refresh token
    const refreshResponse = await fetchFn(`${process.env.API_V2_URL}/refreshToken`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        Accept: 'application/json,text/*;q=0.99',
        'Content-Type': 'application/json; charset=UTF-8',
        Referer: originalRequest.url,
        'X-Source': 'api client',
      },
    })
    const data = await refreshResponse.json()
    if (!data.token) {
      throw new Error('Token has expired, please log out and log in again.')
    }

    const decodedToken = getTokenPayload(data.token)
    if (!decodedToken) {
      throw new Error('Token has expired, please log out and log in again.')
    }
    // retry original request with new token
    const updatedOptions = {
      ...originalRequest.options,
      headers: {
        ...originalRequest.options.headers,
        Authorization: `Bearer ${data.token}`,
      },
    }
    return fetchFn(originalRequest.url, updatedOptions).then((reExecuteResponse) =>
      checkStatus(reExecuteResponse)
    )
  }

  const error = new Error(errorBody.message)
  error.name = errorBody.name
  error.status = errorBody.status
  error.details = errorBody.details
  error.errors = errorBody.errors
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
    mode: 'cors',
  }

  return (path, data = {}, options = {}) => {
    if (!path) {
      const noPathError = new Error('Missing required parameter path')
      noPathError.status = 400
      noPathError.name = 'BadRequestError'
      noPathError.details = {}
      return Promise.reject(noPathError)
    }
    const requestPath = path.startsWith('/') ? path : `/${path}`

    const baseUrl =
      (options.version === 1 ? process.env.API_URL : process.env.API_V2_URL) ||
      'http://localhost:3001'

    const defaultHeaders = {
      Accept: 'application/json,text/*;q=0.99',
    }
    if (options.accessToken && options.useCredentials !== false) {
      defaultHeaders.Authorization = `Bearer ${options.accessToken}`
    }

    if (options.remoteIpAddress) {
      defaultHeaders['X-Forwarded-For'] = options.remoteIpAddress
    }
    const credentials = options.useCredentials === false ? 'omit' : 'include'

    let query
    let methodOptions
    if (httpMethod === 'GET') {
      query = buildQueryString(data)
      methodOptions = {
        headers: defaultHeaders,
      }
      if (options.cache === false) {
        methodOptions.cache = 'no-cache'
      }
    } else {
      query = ''
      methodOptions = {
        headers: {
          ...defaultHeaders,
          ...(options.contentType !== 'unset' && {
            'Content-Type': 'application/json; charset=UTF-8',
          }),
        },
        body: options.contentType !== 'unset' ? JSON.stringify(data) : data,
      }
    }

    if (options.contentType === 'blob') {
      return fetchFn(baseUrl + requestPath + query, {
        ...defaultOptions,
        credentials,
        ...methodOptions,
      })
        .then(checkStatus)
        .then((r) => r.blob())
    }

    const fullOptions = {
      ...defaultOptions,
      credentials,
      ...methodOptions,
    }
    return fetchFn(baseUrl + requestPath + query, fullOptions)
      .then((response) =>
        checkStatus(response, {
          url: baseUrl + requestPath + query,
          options: fullOptions,
        })
      )
      .then((r) => r.json())
      .catch((err) => {
        if (
          typeof window !== 'undefined' &&
          !options.ignoreErrors?.includes(err.name) &&
          (process.env.SERVER_ENV === 'production' || process.env.SERVER_ENV === 'staging')
        ) {
          window.gtag('event', 'exception', {
            description: `API Error: ${httpMethod} ${requestPath + query} returned "${
              err.message
            }" ${JSON.stringify(err)}`,
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

const getById = async (apiPath, id, accessToken, apiVersion, queryParam, remoteIp) => {
  try {
    const apiRes = await get(
      `/${apiPath}`,
      { id, ...queryParam },
      { accessToken, version: apiVersion, remoteIpAddress: remoteIp }
    )
    return apiRes[apiPath]?.length > 0 ? { ...apiRes[apiPath][0], apiVersion } : null
  } catch (apiError) {
    if (apiError.name === 'NotFoundError') {
      return null
    }
    throw apiError
  }
}

const getInvitationById = async (
  invitationId,
  accessToken,
  queryParam1,
  queryParam2,
  remoteIp
) => {
  const invitationObj = await getById(
    'invitations',
    invitationId,
    accessToken,
    2,
    queryParam1,
    remoteIp
  )
  if (invitationObj) {
    return invitationObj
  }

  return getById(
    'invitations',
    invitationId,
    accessToken,
    1,
    queryParam2 ?? queryParam1,
    remoteIp
  )
}

const getNoteById = async (noteId, accessToken, queryParam1, queryParam2, remoteIp) => {
  const noteObj = await getById('notes', noteId, accessToken, 2, queryParam1, remoteIp)
  if (noteObj) {
    return noteObj
  }

  return getById('notes', noteId, accessToken, 1, queryParam2 ?? queryParam1, remoteIp)
}

const getGroupById = (groupId, accessToken, queryParam) =>
  getById('groups', groupId, accessToken, 2, queryParam)

const getCombined = async (path, data1 = {}, data2 = null, options = {}) => {
  const [apiRes1, apiRes2] = await Promise.allSettled([
    get(path, data1, { ...options, version: 1 }),
    get(path, data2 ?? data1, options).catch((error) => error),
  ])
  const resultsKey = options.resultsKey || path.substring(1)
  let results1
  let results2
  if (options.includeVersion) {
    results1 = apiRes1.value?.[resultsKey]?.map((p) => ({ ...p, apiVersion: 1 })) ?? []
    results2 = apiRes2.value?.[resultsKey]?.map((p) => ({ ...p, apiVersion: 2 })) ?? []
  } else {
    results1 = apiRes1.value?.[resultsKey] ?? []
    results2 = apiRes2.value?.[resultsKey] ?? []
  }

  const sortOptions = {
    'cdate:asc': (a, b) => a.cdate - b.cdate,
    'cdate:desc': (a, b) => b.cdate - a.cdate,
    'mdate:asc': (a, b) => a.mdate - b.mdate,
    'mdate:desc': (a, b) => b.mdate - a.mdate,
    'tmdate:asc': (a, b) => a.tmdate - b.tmdate,
    'tmdate:desc': (a, b) => b.tmdate - a.tmdate,
    none: () => 0,
  }
  const sortFn = sortOptions[options.sort ?? (data1.sort || '')] ?? sortOptions['cdate:asc']

  return {
    [resultsKey]: results2.concat(results1).sort(sortFn),
    count: (apiRes1.value?.count ?? 0) + (apiRes2.value?.count ?? 0),
  }
}

const getAll = async (path, queryParam, options = {}) => {
  const queryObj = {
    ...queryParam,
    limit: Math.min(queryParam.limit ?? 1000, 1000),
    ...(options.version !== 1 && { count: true }),
  }
  if (!('sort' in queryObj)) {
    queryObj.sort = 'id'
  }
  const offset = queryParam.offset ?? 0
  let { resultsKey } = options
  if (!resultsKey) {
    if (path.indexOf('notes') !== -1) {
      resultsKey = 'notes'
    } else if (path.indexOf('groups') !== -1) {
      resultsKey = 'groups'
    } else if (path.indexOf('profiles') !== -1) {
      resultsKey = 'profiles'
    } else if (path.indexOf('invitations') !== -1) {
      resultsKey = 'invitations'
    } else if (path.indexOf('tags') !== -1) {
      resultsKey = 'tags'
    } else if (path.indexOf('edges') !== -1) {
      resultsKey = 'edges'
    } else {
      return Promise.reject(new Error('Unknown API endpoint'))
    }
  }

  const results = await get(path, queryObj, {
    accessToken: options.accessToken,
    version: options.version,
  })
  if (!results || !results[resultsKey]) return []

  const initialResults = results[resultsKey]
  const totalCount = results.count ?? initialResults.length
  if (!totalCount) return []
  if (totalCount - initialResults.length <= 0) return initialResults

  const offsetList = [...Array(totalCount - offset - queryObj.limit).keys()]
    .map((p) => p + offset + queryObj.limit)
    .filter((q) => (q - offset - queryObj.limit) % queryObj.limit === 0)

  let rest = []
  let lastId = initialResults[initialResults.length - 1].id
  for (const p of offsetList) {
    const reqParams = {
      ...queryObj,
      after: lastId,
      count: false,
    }
    const res = await get(
      path,
      reqParams,
      { accessToken: options.accessToken, version: options.version }
    )
    if (res?.[resultsKey]?.length) {
      rest = rest.concat(res[resultsKey])
      lastId = res[resultsKey][res[resultsKey].length - 1].id
    }
  }
  return [...initialResults, ...rest]
}

const api = {
  get,
  post,
  put,
  delete: del,
  getInvitationById,
  getNoteById,
  getGroupById,
  getCombined,
  getAll,
  configure,
}
export default api
