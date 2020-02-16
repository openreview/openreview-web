/**
 * Get the human readable version of a group or profile id
 *
 * @param {string} id group or profile id to convert
 */
export function prettyId(id) {
  var lowercaseExceptions = [
    'conference',
    'workshop',
    'submission',
    'recommendation',
    'paper',
    'review',
    'reviewer',
    'reviewers',
    'official',
    'public',
    'meta',
    'comment',
    'question',
    'acceptance',
    'pcs',
    'affinity',
    'bid',
    'tpms'
  ]

  if (!id) {
    return ''

  } else if (id.indexOf('~') === 0) {
    return id.substring(1).replace(/_|\d+/g, ' ').trim()

  } else if (id === 'everyone' || id === '(anonymous)' || id === '(guest)') {
    return id

  } else {
    var tokens = id.split('/')
    if (onlyLast) {
      var sliceIndex = _.findIndex(tokens, function(token) {
        return token.match(/^[pP]aper\d+$/)
      })
      tokens = tokens.slice(sliceIndex)
    }

    var transformedId = tokens.map(function(token) {
      token = token
        .replace(/\..+/g, '') // remove text after dots, ex: uai.org
        .replace(/^-$/g, '')  // remove dashes
        .replace(/_/g, ' ')  // replace undescores with spaces

      // if the letters in the token are all lowercase, replace it with empty string
      var lettersOnly = token.replace(/\d|\W/g, '')
      if (lettersOnly && lettersOnly === lettersOnly.toLowerCase() && lowercaseExceptions.indexOf(token) < 0) {
        token = ''
      }

      return token
    }).filter(function(formattedToken) {
      // filter out any empty tokens
      return formattedToken
    }).join(' ')

    return transformedId || id
  }
}

/**
 * Convert timestamp stored in the database to human readable date
 * @param {number} timestamp the timestamp to convert
 */
export function formatTimestamp(timestamp) {
  const date = new Date(timestamp)
  return date.toLocaleDateString('en-GB', {
    hour: 'numeric',
    minute: 'numeric',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZoneName: 'long'
  });
}
