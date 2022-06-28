import { stringify } from 'query-string'

const formatError = (err) => {
  if (typeof window === 'undefined' || !process.env.IS_PRODUCTION) {
    // Always log the error if this is a server side API call
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

const checkStatus = async (response) => {
  if (response.ok) {
    return response
  }

  const errorBody = await response.json()
  const error = new Error(errorBody.message)
  error.name = errorBody.name
  error.status = errorBody.status
  error.details = errorBody.details
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
      noPathError.name = 'BadRequestError'
      noPathError.details = {}
      return Promise.reject(noPathError)
    }
    const requestPath = path.startsWith('/') ? path : `/${path}`

    const baseUrl =
      (options.version === 2 ? process.env.API_V2_URL : process.env.API_URL) ||
      'http://localhost:3000'

    const defaultHeaders = {
      Accept: 'application/json,text/*;q=0.99',
    }
    if (options.accessToken) {
      defaultHeaders.Authorization = `Bearer ${options.accessToken}`
    }

    let query
    let methodOptions
    if (httpMethod === 'GET') {
      if (options.cache === false) {
        query = buildQueryString({ ...data, cache: false })
      } else {
        query = buildQueryString(data)
      }

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

    return fetchFn(baseUrl + requestPath + query, { ...defaultOptions, ...methodOptions })
      .then(checkStatus)
      .then((r) => r.json())
      .catch((err) => {
        if (
          typeof window !== 'undefined' &&
          !options.ignoreErrors?.includes(err.name) &&
          (process.env.IS_PRODUCTION || process.env.IS_STAGING)
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

const getById = async (apiPath, id, accessToken, apiVersion, queryParam) => {
  if (apiVersion === 2 && !process.env.API_V2_URL) return null

  try {
    const apiRes = await get(
      `/${apiPath}`,
      { id, ...queryParam },
      { accessToken, version: apiVersion }
    )
    return apiRes[apiPath]?.length > 0 ? { ...apiRes[apiPath][0], apiVersion } : null
  } catch (apiError) {
    if (apiError.name === 'NotFoundError') {
      return null
    }
    throw apiError
  }
}

const getInvitationById = async (invitationId, accessToken, queryParam) => {
  const invitationObj = await getById('invitations', invitationId, accessToken, 1, queryParam)
  if (invitationObj) {
    return invitationObj
  }

  return getById('invitations', invitationId, accessToken, 2, queryParam)
}

const getNoteById = async (noteId, accessToken, queryParam) => {
  const noteObj = await getById('notes', noteId, accessToken, 1, queryParam)
  if (noteObj) {
    return noteObj
  }

  return getById('notes', noteId, accessToken, 2, queryParam)
}

const getGroupById = async (groupId, accessToken, queryParam) => {
  const groupObj = await getById('groups', groupId, accessToken, 1, queryParam)
  if (groupObj) {
    return groupObj
  }

  return getById('groups', groupId, accessToken, 2, queryParam)
}

const getCombined = async (path, data1 = {}, data2 = null, options = {}) => {
  const resultsKey = options.resultsKey || path.substring(1)

  if (!process.env.API_V2_URL) {
    const results = await get(path, data1, options)
    if (options.includeVersion) {
      return {
        ...results,
        [resultsKey]: results[resultsKey]?.map((p) => ({ ...p, apiVersion: 1 })) ?? [],
      }
    }
    return results
  }

  const [apiRes1, apiRes2] = await Promise.all([
    get(path, data1, options),
    get(path, data2 ?? data1, { ...options, version: 2 }).catch((error) => error),
  ])

  let results1
  let results2
  if (options.includeVersion) {
    results1 = apiRes1[resultsKey]?.map((p) => ({ ...p, apiVersion: 1 })) ?? []
    results2 = apiRes2[resultsKey]?.map((p) => ({ ...p, apiVersion: 2 })) ?? []
  } else {
    results1 = apiRes1[resultsKey] ?? []
    results2 = apiRes2[resultsKey] ?? []
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

  // Don't throw error if call to API 2 fails, instead return error details with API 1 results
  let api2Err
  if (apiRes2.status !== 200) {
    const errDetails = {
      name: apiRes2.name,
      message: apiRes2.message,
      status: apiRes2.status,
      details: apiRes2.details,
    }
    api2Err = { error: errDetails }
  } else {
    api2Err = {}
  }

  return {
    [resultsKey]: results2.concat(results1).sort(sortFn),
    count: (apiRes1.count ?? 0) + (apiRes2.count ?? 0),
    ...api2Err,
  }
}

const getAll = async (path, queryParam, options = {}) => {
  const queryObj = { ...queryParam, limit: Math.min(queryParam.limit ?? 1000, 1000) }
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
  // eslint-disable-next-line max-len
  const remainingRequests = offsetList.map((p) =>
    get(path, { ...queryObj, offset: p }, { accessToken: options.accessToken })
  )
  const remainingResults = await Promise.all(remainingRequests)
  const rest = remainingResults
    .filter((p) => p?.[resultsKey]?.length)
    .flatMap((q) => q[resultsKey])
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
