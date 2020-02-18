/**
 * Get the human readable version of a group or profile id
 *
 * @param {string} id - group or profile id to convert
 * @param {boolean} [onlyLast] - don't include Paper# token in output
 */
export function prettyId(id, onlyLast) {
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
 *
 * @param {number} timestamp - the timestamp to convert
 */
export function formatTimestamp(timestamp) {
  if (!timestamp) return null

  const date = new Date(timestamp)
  return date.toLocaleDateString('en-GB', {
    hour: 'numeric',
    minute: 'numeric',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZoneName: 'long'
  })
}

/**
 * General utility function to pluralize any english word. Based on answer here:
 * https://stackoverflow.com/a/27194360/125836
 *
 * @param {string} word - word or phrase to pluralize
 */
export function pluralizeString(word) {
  if (typeof word !== 'string') return null

  const plural = {
    '(quiz)$': '$1zes',
    '^(ox)$': '$1en',
    '([m|l])ouse$': '$1ice',
    '(matr|vert|ind)ix|ex$': '$1ices',
    '(x|ch|ss|sh)$': '$1es',
    '([^aeiouy]|qu)y$': '$1ies',
    '(hive)$': '$1s',
    '(?:([^f])fe|([lr])f)$': '$1$2ves',
    '(shea|lea|loa|thie)f$': '$1ves',
    sis$: 'ses',
    '([ti])um$': '$1a',
    '(tomat|potat|ech|her|vet)o$': '$1oes',
    '(bu)s$': '$1ses',
    '(alias)$': '$1es',
    '(octop)us$': '$1i',
    '(ax|test)is$': '$1es',
    '(us)$': '$1es',
    '([^s]+)$': '$1s',
  }
  const irregular = {
    move: 'moves',
    foot: 'feet',
    goose: 'geese',
    sex: 'sexes',
    child: 'children',
    man: 'men',
    tooth: 'teeth',
    person: 'people',
  }
  const uncountable = [
    'sheep',
    'fish',
    'deer',
    'moose',
    'series',
    'species',
    'money',
    'rice',
    'information',
    'equipment',
    'bison',
    'cod',
    'offspring',
    'pike',
    'salmon',
    'shrimp',
    'swine',
    'trout',
    'aircraft',
    'hovercraft',
    'spacecraft',
    'sugar',
    'tuna',
    'you',
    'wood',
  ]

  if (uncountable.includes(word.toLowerCase())) {
    return word
  }

  for (const w in irregular) {
    const pattern = new RegExp(`${w}$`, 'i')
    const replace = irregular[w]
    if (pattern.test(word)) {
      return word.replace(pattern, replace)
    }
  }

  for (const reg in plural) {
    const pattern = new RegExp(reg, 'i')
    if (pattern.test(word)) {
      return word.replace(pattern, plural[reg])
    }
  }

  return word
}
