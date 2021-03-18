import get from 'lodash/get'

/**
 * Convert filter query string into object representing all the active filters
 *
 * @param {string} filterQuery - filter query parameter
 * @param {string} searchQuery - search query parameter
 * @returns object
 */
export function parseFilterQuery(filterQuery, searchQuery) {
  const filterObj = (filterQuery || '').split(' ').reduce((map, token) => {
    const [field, val] = token.split(':')
    if (val) {
      const mapKey = field.startsWith('-')
        ? `excluded${field.slice(1, 2).toUpperCase()}${field.slice(2)}`
        : field
      // eslint-disable-next-line no-param-reassign
      map[mapKey] = val.split(',')
    }
    return map
  }, {})

  if (searchQuery) {
    filterObj.keywords = [searchQuery.toLowerCase()]
  }

  return filterObj
}

/**
 * Convert filter query string into object representing all the active filters
 *
 * @param {string} filterQuery - filter query from replyForumViews field
 * @param {object} replyNote - note object replying to invitation
 * @returns string
 */
export function replaceFilterWildcards(filterQuery, replyNote) {
  return filterQuery.replace(/\${note\.([\w.]+)}/g, (match, field) => get(replyNote, field, ''))
}

/**
 * Convert selected filter object into string representation that can be url encoded
 *
 * @param {object} replyNote - note object replying to invitation
 * @returns string
 */
export function stringifyFilters(filterObj) {
  return Object.entries(filterObj)
    .map(([key, val]) => {
      if (!val) return null
      return `${key === 'excludedReaders' ? '-readers' : key}:${val.join(',')}`
    })
    .filter(Boolean)
    .join(' ')
}
