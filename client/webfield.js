/* globals _: false */
/* globals $: false */
/* globals Handlebars: false */
/* globals moment: false */
/* globals MathJax: false */
/* globals view: false */
/* globals view2: false */
/* globals promptError: false */
/* globals promptLogin: false */
/* globals promptMessage: false */
/* globals translateErrorMessage: false */
/* globals serializeUrlParams: false */
/* globals parseUrlParams: false */
/* globals typesetMathJax: false */

module.exports = (function () {
  // Save authentication token as a private var
  var token

  // AJAX Functions
  var get = function (url, queryObj, options) {
    var defaults = {
      handleErrors: true,
    }
    options = _.defaults(options, defaults)
    var defaultHeaders = { 'Access-Control-Allow-Origin': '*' }
    var authHeaders = token ? { Authorization: 'Bearer ' + token } : {}
    var baseUrl = window.OR_API_URL ? window.OR_API_URL : ''
    var errorCallback = options.handleErrors ? jqErrorCallback : null
    var xhrFields = {
      withCredentials: true,
    }
    if (options.isBlob) xhrFields.responseType = 'blob'

    // Remove properties causing errors in old webfields
    if (queryObj?.noDetails) {
      queryObj.noDetails = undefined
    }

    return $.ajax({
      dataType: options.isBlob ? false : 'json',
      type: 'get',
      contentType: 'application/x-www-form-urlencoded; charset=UTF-8',
      url: baseUrl + url,
      data: queryObj,
      headers: Object.assign(defaultHeaders, authHeaders),
      xhrFields: xhrFields,
    }).then(jqSuccessCallback, errorCallback)
  }

  var post = function (url, queryObj, options) {
    var defaults = {
      handleErrors: true,
    }
    options = _.defaults(options, defaults)
    var defaultHeaders = { 'Access-Control-Allow-Origin': '*' }
    var authHeaders = token ? { Authorization: 'Bearer ' + token } : {}
    var baseUrl = window.OR_API_URL ? window.OR_API_URL : ''
    var errorCallback = options.handleErrors ? jqErrorCallback : null

    return $.ajax({
      cache: false,
      dataType: 'json',
      type: 'post',
      contentType: 'application/json; charset=UTF-8',
      url: baseUrl + url,
      data: JSON.stringify(queryObj),
      headers: Object.assign(defaultHeaders, authHeaders),
      xhrFields: {
        withCredentials: true,
      },
    }).then(jqSuccessCallback, errorCallback)
  }

  var put = function (url, queryObj, options) {
    var defaults = {
      handleErrors: true,
    }
    options = _.defaults(options, defaults)
    var defaultHeaders = { 'Access-Control-Allow-Origin': '*' }
    var authHeaders = token ? { Authorization: 'Bearer ' + token } : {}
    var baseUrl = window.OR_API_URL ? window.OR_API_URL : ''
    var errorCallback = options.handleErrors ? jqErrorCallback : null

    return $.ajax({
      cache: false,
      dataType: 'json',
      type: 'put',
      contentType: 'application/json; charset=UTF-8',
      url: baseUrl + url,
      data: JSON.stringify(queryObj),
      headers: Object.assign(defaultHeaders, authHeaders),
      xhrFields: {
        withCredentials: true,
      },
    }).then(jqSuccessCallback, errorCallback)
  }

  var xhrDelete = function (url, queryObj, options) {
    var defaults = {
      handleErrors: true,
    }
    options = _.defaults(options, defaults)
    var defaultHeaders = { 'Access-Control-Allow-Origin': '*' }
    var authHeaders = token ? { Authorization: 'Bearer ' + token } : {}
    var baseUrl = window.OR_API_URL ? window.OR_API_URL : ''
    var errorCallback = options.handleErrors ? jqErrorCallback : null

    return $.ajax({
      cache: false,
      dataType: 'json',
      type: 'delete',
      contentType: 'application/json; charset=UTF-8',
      url: baseUrl + url,
      data: JSON.stringify(queryObj),
      headers: Object.assign(defaultHeaders, authHeaders),
      xhrFields: {
        withCredentials: true,
      },
    }).then(jqSuccessCallback, errorCallback)
  }

  var getAll = function (url, queryObjParam, resultsKey) {
    const queryObj = { ...queryObjParam }
    queryObj.limit = Math.min(queryObj.limit || 1000, 1000)
    var offset = queryObj.offset || 0

    if (!resultsKey) {
      if (url.indexOf('notes') !== -1) {
        resultsKey = 'notes'
      } else if (url.indexOf('groups') !== -1) {
        resultsKey = 'groups'
      } else if (url.indexOf('profiles') !== -1) {
        resultsKey = 'profiles'
      } else if (url.indexOf('invitations') !== -1) {
        resultsKey = 'invitations'
      } else if (url.indexOf('tags') !== -1) {
        resultsKey = 'tags'
      } else if (url.indexOf('edges') !== -1) {
        resultsKey = 'edges'
      } else {
        return $.Deferred().reject('Unknown API endpoint')
      }
    }

    return get(url, Object.assign({}, queryObj, { offset: offset })).then(function (results) {
      if (!results || !results[resultsKey]) {
        return []
      }

      var initialResults = results[resultsKey]
      var totalCount = results.count || initialResults.length
      if (!totalCount) {
        return []
      }

      if (totalCount - initialResults.length <= 0) {
        return initialResults
      } else {
        var offsetList = _.range(offset + queryObj.limit, totalCount, queryObj.limit)
        var remainingRequests = offsetList.map(function (n) {
          return get(url, Object.assign({}, queryObj, { offset: n }))
        })
        return $.when.apply($, remainingRequests).then(function () {
          // eslint-disable-next-line prefer-rest-params
          var rest = _.compact(_.flatMap(arguments, resultsKey))
          return initialResults.concat(rest)
        })
      }
    })
  }

  var jqSuccessCallback = function (response) {
    return response
  }

  var jqErrorCallback = function (jqXhr, textStatus, errorThrown) {
    // eslint-disable-next-line no-console
    console.warn('Xhr Error: ' + errorThrown + ': ' + textStatus)
    // eslint-disable-next-line no-console
    console.warn('jqXhr: ' + JSON.stringify(jqXhr, null, 2))

    var errorText = getErrorFromJqXhr(jqXhr, textStatus)
    var errorName = jqXhr.responseJSON?.name || jqXhr.responseJSON?.errors?.[0]?.type
    var errorDetails = jqXhr.responseJSON?.details || jqXhr.responseJSON?.errors?.[0]
    var notSignatoryError =
      errorName === 'NotSignatoryError' && _.startsWith(errorDetails.user, 'guest_')
    var forbiddenError =
      errorName === 'ForbiddenError' && _.startsWith(errorDetails.user, 'guest_')

    if (errorText === 'User does not exist') {
      location.reload(true)
    } else if (notSignatoryError || forbiddenError) {
      location.href =
        '/login?redirect=' +
        encodeURIComponent(location.pathname + location.search + location.hash)
    } else {
      promptError(errorText)
    }

    return errorText
  }

  var getErrorFromJqXhr = function (jqXhr, textStatus) {
    if (textStatus === 'timeout') {
      // If the request timed out, display a special message
      return 'OpenReview is currently under heavy load. Please try again soon.'
    }

    return jqXhr.responseJSON?.message || 'Something went wrong'
  }

  var setToken = function (newAccessToken) {
    token = newAccessToken
  }

  var sendFile = function (url, data, contentType, fieldName) {
    var baseUrl = window.OR_API_URL ? window.OR_API_URL : ''
    var defaultHeaders = { 'Access-Control-Allow-Origin': '*' }
    var authHeaders = token ? { Authorization: 'Bearer ' + token } : {}
    return $.ajax({
      url: baseUrl + url,
      type: 'put',
      cache: false,
      dataType: 'json',
      processData: false,
      contentType: contentType || false,
      data: data,
      headers: Object.assign(defaultHeaders, authHeaders),
      xhrFields: {
        withCredentials: true,
      },
    }).fail(function (jqXhr, textStatus, errorThrown) {
      // eslint-disable-next-line no-console
      console.warn('Xhr Error: ' + errorThrown + ': ' + textStatus)
      // eslint-disable-next-line no-console
      console.warn('jqXhr: ' + JSON.stringify(jqXhr, null, 2))

      if (fieldName) {
        $(
          'input.form-control.note_content_value_input.note_' + fieldName.replace(/\W/g, '_')
        ).val('')
      }
    })
  }

  var sendFileChunk = function (data, $progressBar) {
    var baseUrl = window.OR_API_URL ? window.OR_API_URL : ''
    var defaultHeaders = { 'Access-Control-Allow-Origin': '*' }
    var authHeaders = token ? { Authorization: 'Bearer ' + token } : {}
    return $.ajax({
      url: baseUrl + '/attachment/chunk',
      type: 'put',
      contentType: false,
      processData: false,
      data: data,
      headers: Object.assign(defaultHeaders, authHeaders),
      xhrFields: {
        withCredentials: true,
      },
      success: function (result) {
        if (!result.url) {
          var progress = `${(
            (Object.values(result).filter((p) => p === 'completed').length * 100) /
            Object.values(result).length
          ).toFixed(0)}%`
          $progressBar.find('.progress-bar').css('width', progress).text(progress)
        }
      },
    })
  }

  // API Functions
  var getSubmissionInvitation = function (invitationId, options) {
    var defaults = {}
    options = _.assign(defaults, options)

    // Don't use the Webfield get function so the fail callback can be overridden
    return get('/invitations', { id: invitationId }, { handleErrors: false }).then(
      function (result) {
        if (result.invitations.length) {
          return result.invitations[0]
        }
        return null
      },
      function () {
        // In case of error return null, but continue the promise chain
        return $.Deferred().resolve(null)
      }
    )
  }

  var getSubmissions = function (invitationId, options) {
    // Any url param accepted by /notes can be passed in via the options object
    var defaults = {
      details: 'replyCount,invitation,tags',
      pageSize: 100,
      offset: 0,
      includeCount: false,
    }
    options = _.defaults(options, defaults)

    var query = _.omit(options, ['pageSize', 'includeCount'])
    query.limit = options.pageSize
    query.invitation = invitationId

    return get('/notes', query, { handleErrors: false }).then(function (result) {
      if (options.includeCount) {
        return result
      } else {
        return result.notes
      }
    })
  }

  var searchSubmissions = function (groupId, term, options) {
    var defaults = {
      pageSize: 100,
      offset: 0,
      invitation: null,
    }
    options = _.assign(defaults, options)

    var searchParams = {
      term: term,
      type: 'terms',
      content: 'all',
      source: 'forum',
      group: groupId,
      limit: options.pageSize,
      offset: options.offset,
    }

    if (options.invitation) {
      searchParams.invitation = options.invitation
    }

    if (options.venue) {
      searchParams.venue = options.venue
    }

    if (options.venueid) {
      searchParams.venueid = options.venueid
    }

    return get('/notes/search', searchParams).then(function (result) {
      return result.notes
    })
  }

  var getTagInvitations = function (replyInvitation) {
    var urlParams = {
      replyInvitation: replyInvitation,
      tags: true,
    }

    return get('/invitations', urlParams).then(function (result) {
      return result.invitations
    })
  }

  // Utility Functions
  var filterNotes = function (allNotes, searchParams) {
    if (searchParams.localSearch) {
      // Search notes locally
      var matchingNotes = []
      var searchFields = ['title', 'abstract', 'TL;DR', 'keywords']
      var searchSubject = _.toLower(searchParams.subject)

      for (var i = 0; i < allNotes.length; i++) {
        var noteContent = allNotes[i].content
        var foundTermMatch = true
        if (searchParams.term) {
          foundTermMatch = false
          for (var j = 0; j < searchFields.length; j++) {
            var contentField = noteContent[searchFields[j]]
            if (contentField) {
              if (_.isString(contentField)) {
                contentField = contentField.toLowerCase()
                if (contentField.indexOf(searchParams.term) !== -1) {
                  // indexOf works for both arrays and strings
                  foundTermMatch = true
                  break
                }
              }
              if (_.isArray(contentField)) {
                var found = _.some(contentField, function (value, searchParams) {
                  return value.toLowerCase().indexOf(searchParams.term) !== -1
                })
                if (found) {
                  foundTermMatch = true
                  break
                }
              }
            }
          }
        }

        var foundSubjectMatch = true
        if (searchSubject) {
          var subjectAreas = []
          if (_.isArray(noteContent.subject_areas)) {
            // jshint ignore:line
            subjectAreas = noteContent.subject_areas // jshint ignore:line
          } else if (_.isArray(noteContent.keywords)) {
            subjectAreas = noteContent.keywords
          }
          foundSubjectMatch = _.includes(subjectAreas.map(_.toLower), searchSubject)
        }

        if (foundTermMatch && foundSubjectMatch) {
          matchingNotes.push(allNotes[i])
        }
      }

      return searchParams.onResults(matchingNotes)
    } else {
      // Use search API
      var groupId =
        $('#group-container').data('groupId') || $('#invitation-container').data('groupId')
      if (searchParams.subject) {
        searchParams.term += ' ' + searchParams.subject
        searchParams.term = searchParams.term.trim()
      }
      return searchSubmissions(groupId, searchParams.term, {
        pageSize: searchParams.pageSize,
        invitation: searchParams.invitation,
        venue: searchParams.venue,
        venueid: searchParams.venueid,
      }).then(searchParams.onResults)
    }
  }

  // UI Functions
  var defaultDisplayOptions = {
    pdfLink: true,
    htmlLink: true,
    replyCount: true,
    showInvitation: true,
    showReaders: true,
    showContents: true,
    showTags: false,
    showEdges: false,
    showTasks: false,
    showActionButtons: false,
    tagInvitations: [],
    edgeInvitations: [],
    referrer: null,
    emptyMessage: 'No papers to display at this time',
  }

  var dateOptions = {
    hour: 'numeric',
    minute: 'numeric',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZoneName: 'long',
  }

  var getDueDateStatus = function (date) {
    var day = 24 * 60 * 60 * 1000
    var diff = Date.now() - date.getTime()

    if (diff > 0) {
      return 'expired'
    }
    if (diff > -3 * day) {
      return 'warning'
    }
    return ''
  }

  var setup = function (container, groupId) {
    $(container)
      .empty()
      .append(
        '<div id="header"></div>',
        '<div id="invitation"></div>',
        '<div id="notes"></div>'
      )

    if (groupId) {
      $(container).data('groupId', groupId)
    }
  }

  var basicHeader = function (title, instructions, options) {
    var defaults = {
      container: '#header',
      underline: false,
      fullWidth: false,
    }
    options = _.defaults(options, defaults)

    var $container = $(options.container)
    if (options.fullWidth) {
      $container.append('<div class="container"></div>')
      $container = $container.children('.container')
    }
    $container.html('<h1>' + title + '</h1>')

    if (instructions) {
      $container.append('<div class="description">' + instructions + '</div>')
    }
    if (options.underline) {
      $container.append('<hr class="spacer">')
    }
    return $container
  }

  var venueHeader = function (venueInfo, options) {
    var defaults = {
      container: '#header',
      showInfoLink: false,
    }
    options = _.defaults(options, defaults)

    if (venueInfo.website && !venueInfo.website.startsWith('http')) {
      venueInfo.website = 'http://' + venueInfo.website
    }
    if (options.showInfoLink) {
      venueInfo.groupInfoLink =
        window.location.pathname +
        '?' +
        serializeUrlParams(_.assign(parseUrlParams(window.location.search), { mode: 'info' }))
    }

    var $container = $(options.container)
    $container
      .hide()
      .html(Handlebars.templates.venueHeader(venueInfo))
      .addClass('venue-header')
    return $container.fadeIn().promise()
  }

  var linksList = function (linksArr, options) {
    var defaults = {
      jsLinks: true,
      container: '#notes',
    }
    options = _.defaults(options, defaults)

    var linksHtml =
      '<ul class="list-unstyled venues-list">' +
      _.map(linksArr, function (link) {
        if (link.type === 'divider') {
          return '<li>&nbsp;</li>'
        }
        return '<li><a href="' + link.url + '">' + link.name + '</a></li>'
      }).join('\n') +
      '</ul>'

    var $container = $(options.container)
    $container.append(linksHtml)
  }

  var accordion = function (contentArr, options) {
    var defaults = {
      html: true,
      id: 'accordion-' + Math.floor(Math.random() * 1000),
      collapsed: true,
      extraClasses: '',
      container: '#notes',
    }
    options = _.defaults(options, defaults)

    if (!contentArr || !contentArr.length) {
      return
    }

    var accordionHtml = Handlebars.templates['partials/accordion']({
      sections: contentArr,
      options: options,
    })
    var $container = $(options.container)
    $container.append(accordionHtml)
  }

  var invitationButtonAndNoteEditor = function (invitationData, user, options) {
    var defaults = {
      container: '#invitation',
      largeLabel: true,
      onNoteCreated: function () {
        // eslint-disable-next-line no-console
        console.warn('onNoteCreated option is required')
      },
    }
    options = _.assign(defaults, options)

    var $container = $(options.container)
    var onClick = function () {
      // Toggle new note form, or prompt user to login if they aren't already
      if (!user || _.startsWith(user.id, 'guest_')) {
        promptLogin(user)
        return
      }

      if ($('.note_editor', $container).length) {
        $('.note_editor', $container).slideUp('normal', function () {
          $(this).remove()
        })
        return
      }
      var newNoteEditorFn = invitationData.edit ? view2.mkNewNoteEditor : view.mkNewNoteEditor
      newNoteEditorFn(invitationData, null, null, user, {
        onCompleted: function ($editor) {
          if (!$editor) return
          $editor.hide()
          $container.append($editor)
          $editor.slideDown()
        },
        onNoteCreated: options.onNoteCreated,
      })
    }
    $container.hide().append(view.mkInvitationButton(invitationData, onClick, options))

    return $container.fadeIn().promise()
  }

  // search filtering related functions
  class TreeNode {
    constructor(value, left, right) {
      this.value = value
      this.left = left
      this.right = right
    }
  }
  // parse search query to a tree
  const queryToTree = (queryParam) => {
    let currentOperand = null
    let middleOfOperand = false
    let stuffInBrackets = ''
    const query = queryParam.trim()
    const tokens = [...query]
    for (let i = 0; i < tokens.length; i++) {
      const t = tokens[i]
      if (t === 'A') {
        if (`A${tokens[i + 1]}${tokens[i + 2]}` === 'AND') {
          if (middleOfOperand) {
            currentOperand += 'AND'
            i += 2
            // eslint-disable-next-line no-continue
            continue
          } else if (stuffInBrackets.length) {
            return new TreeNode(
              'AND',
              queryToTree(stuffInBrackets),
              queryToTree(query.slice(i + 3))
            )
          } else {
            return new TreeNode('AND', currentOperand, queryToTree(query.slice(i + 3)))
          }
        } else {
          if (currentOperand) {
            currentOperand += t
          } else {
            currentOperand = t
          }
          // eslint-disable-next-line no-continue
          continue
        }
      }
      if (t === 'O') {
        if (`O${tokens[i + 1]}` === 'OR') {
          if (middleOfOperand) {
            currentOperand += 'OR'
            i += 1
            // eslint-disable-next-line no-continue
            continue
          } else if (stuffInBrackets.length) {
            return new TreeNode(
              'OR',
              queryToTree(stuffInBrackets),
              queryToTree(query.slice(i + 2))
            )
          } else {
            return new TreeNode('OR', currentOperand, queryToTree(query.slice(i + 2)))
          }
        } else {
          if (currentOperand) {
            currentOperand += t
          } else {
            currentOperand = t
          }
          // eslint-disable-next-line no-continue
          continue
        }
      } else if (t === '(') {
        if (middleOfOperand) {
          currentOperand += t
        } else {
          const lengthToRightBracket = getRightBracketIndex(query.slice(i + 1))
          stuffInBrackets = query.slice(i + 1, i + lengthToRightBracket + 1)
          i = i + lengthToRightBracket + 1
          if (i === query.length - 1) return queryToTree(query.slice(1, -1)) // no more expression
          // eslint-disable-next-line no-continue
          continue
        }
      } else if (t === '"' || t === "'") {
        middleOfOperand = !middleOfOperand
      } else if (currentOperand) {
        currentOperand += t
      } else {
        currentOperand = t
      }
    }
    return currentOperand
  }

  // find index of match right bracket
  const getRightBracketIndex = (remainingQuery) => {
    let bracketLevel = 0
    let middleOfOperand = false
    const tokens = [...remainingQuery]
    for (let i = 0; i < tokens.length; i++) {
      const t = tokens[i]
      if (t === ')') {
        if (bracketLevel === 0) {
          return i
        } else {
          bracketLevel -= 1
        }
      }
      if (t === '(') {
        if (!middleOfOperand) {
          bracketLevel += 1
        }
      }
      if (t === '"') {
        middleOfOperand = !middleOfOperand
      }
    }
  }

  const filterTreeNode = (
    collections,
    treeNode,
    filterOperators,
    propertiesAllowed,
    uniqueIdentifier
  ) => {
    if (treeNode instanceof TreeNode) {
      return combineResults(
        filterTreeNode(
          collections,
          treeNode.left,
          filterOperators,
          propertiesAllowed,
          uniqueIdentifier
        ),
        filterTreeNode(
          collections,
          treeNode.right,
          filterOperators,
          propertiesAllowed,
          uniqueIdentifier
        ),
        treeNode.value,
        uniqueIdentifier
      )
    }
    // single expression
    return filterOneOperand(collections, treeNode, filterOperators, propertiesAllowed)
  }

  // extract property to search, the expected value and how the value should be compared
  // like =,>,< from string of filtering criteria
  const operandToPropertyValue = (operandPram, filterOperators) => {
    const operand = operandPram.trim()
    const filterOperator = filterOperators.find((p) => operand.includes(p))
    if (!filterOperator) throw new Error('operator is invalid')
    const [property, value] = operand.split(filterOperator)
    return {
      property: property.trim(),
      value: value.replace(/"/g, '').trim(),
      filterOperator,
    }
  }

  const evaluateOperator = (operator, propertyValue, targetValue) => {
    // propertyValue can be number/array/string/obj
    let isString = false
    if (
      propertyValue === null ||
      propertyValue === undefined ||
      targetValue === null ||
      targetValue === undefined
    ) {
      return false
    }
    if (typeof targetValue === 'number' && propertyValue === 'N/A') propertyValue = 0
    if (typeof propertyValue === 'object' && !Array.isArray(propertyValue)) {
      // reviewers are objects
      propertyValue = [
        ...Object.values(propertyValue).map((p) => p.name),
        ...Object.values(propertyValue).map((p) => p.email),
      ]
      targetValue = targetValue.toString().toLowerCase()
    }
    if (
      !(typeof propertyValue === 'number' && typeof targetValue === 'number') &&
      !Array.isArray(propertyValue)
    ) {
      propertyValue = propertyValue.toString().toLowerCase()
      targetValue = targetValue.toString().toLowerCase()
      isString = true
    }
    const allowGreaterLessComparison = !(
      typeof propertyValue === 'string' && typeof targetValue === 'string'
    )
    switch (operator) {
      case '=':
        if (Array.isArray(propertyValue)) {
          return propertyValue.some((p) =>
            p.toString().toLowerCase().includes(targetValue.toString().toLowerCase())
          )
        }
        return isString ? propertyValue.includes(targetValue) : propertyValue === targetValue
      case '>':
        if (allowGreaterLessComparison) return propertyValue > targetValue
        throw new Error('operator is invalid')
      case '<':
        if (allowGreaterLessComparison) return propertyValue < targetValue
        throw new Error('operator is invalid')
      case '>=':
        if (allowGreaterLessComparison) return propertyValue >= targetValue
        throw new Error('operator is invalid')
      case '<=':
        if (allowGreaterLessComparison) return propertyValue <= targetValue
        throw new Error('operator is invalid')
      case '!=':
        if (Array.isArray(propertyValue)) {
          return !propertyValue.some((p) =>
            p.toString().toLowerCase().includes(targetValue.toString().toLowerCase())
          )
        }
        return propertyValue !== targetValue
      default:
        throw new Error('operator is invalid')
    }
  }

  // filter a collection by 1 filter criteria
  const filterOneOperand = (collections, operand, filterOperators, propertiesAllowed) => {
    if (!operand || operand.trim().length === 0) return null
    const { property, value, filterOperator } = operandToPropertyValue(
      operand,
      filterOperators
    )
    if (!propertiesAllowed[property]) throw new Error('property is invalid')
    const propertyPath =
      propertiesAllowed[property].length === 0
        ? [property] // not a nested property
        : propertiesAllowed[property].map((p) => p.split('.')) // has dot or match multiple properties

    const convertedValue = isNaN(Number(value)) ? value : Number(value)
    return collections.filter((p) => {
      if (propertyPath.length === 1) {
        return evaluateOperator(
          filterOperator,
          propertyPath[0].reduce((r, s) => r?.[s], p),
          convertedValue
        )
      }
      return propertyPath
        .map((q) => q.reduce((r, s) => r?.[s], p))
        .some((t) => evaluateOperator(filterOperator, t, convertedValue))
    })
  }

  // combind two collections by operator AND(intersection) or OR(unique union)
  const combineResults = (collection1, collection2, operator, uniqueIdentifier) => {
    if (!collection1) {
      if (!collection2) {
        return []
      }
      return collection2
    }
    if (!collection2) return collection1
    const propertyPath = uniqueIdentifier.includes('.')
      ? uniqueIdentifier.split('.')
      : [uniqueIdentifier]
    switch (operator) {
      case 'OR':
        return [...new Set([...collection1, ...collection2])]
      case 'AND':
        // eslint-disable-next-line no-case-declarations
        const collection2UniqueIdentifiers = collection2.map((p) =>
          propertyPath.reduce((r, s) => r?.[s], p)
        )
        return collection1.filter((p) =>
          collection2UniqueIdentifiers.includes(propertyPath.reduce((r, s) => r?.[s], p))
        )
      default:
        return []
    }
  }

  const filterCollections = (
    collections,
    filterString,
    filterOperators,
    propertiesAllowed,
    uniqueIdentifier
  ) => {
    try {
      const syntaxTree = queryToTree(filterString)
      const filterResult = filterTreeNode(
        collections,
        syntaxTree,
        filterOperators,
        propertiesAllowed,
        uniqueIdentifier
      )
      return { filteredRows: filterResult }
    } catch (error) {
      return { filteredRows: collections, queryIsInvalid: true }
    }
  }

  var submissionList = function (notes, options) {
    var defaults = {
      heading: 'Submitted Papers',
      container: '#notes',
      emptyContainer: true,
      search: {
        enabled: true,
        localSearch: true,
        invitation: null,
        venue: null,
        subjectAreas: null,
        subjectAreaDropdown: 'advanced',
        pageSize: 1000,
        placeholder: 'Search by paper title and metadata',
        onResults: function () {},
        onReset: function () {},
      },
      displayOptions: defaultDisplayOptions,
      autoLoad: true,
      noteCount: null,
      onNoteEdited: null,
      onNoteTrashed: null,
      onNoteRestored: null,
      pageSize: null,
      fadeIn: true,
    }
    options = _.defaultsDeep(options, defaults)

    var $container = $(options.container)
    if (options.fadeIn) {
      $container.hide()
    }

    if (_.isEmpty(notes)) {
      // Don't show search bar if there are no notes to display
      options.search.enabled = false
    }

    // Add any data to note object that the template might need, such as note-specific
    // tag invitations
    var allTagInvitations = options.displayOptions.tagInvitations
    var includeTagInvitations =
      options.displayOptions.showTags && allTagInvitations && allTagInvitations.length
    var noteSpecificTagInvitations = {}
    var generalTagInvitations = []
    if (includeTagInvitations) {
      for (var i = 0; i < allTagInvitations.length; i++) {
        var inv = allTagInvitations[i]
        var invReplyForum = _.get(inv, 'reply.forum')
        if (invReplyForum) {
          if (!noteSpecificTagInvitations.hasOwnProperty(invReplyForum)) {
            noteSpecificTagInvitations[invReplyForum] = []
          }
          noteSpecificTagInvitations[invReplyForum].push(inv)
        } else {
          generalTagInvitations.push(inv)
        }
      }
      options.displayOptions.tagInvitations = generalTagInvitations
    }

    var now = Date.now()
    for (var j = 0; j < notes.length; j++) {
      notes[j].isDeleted = notes[j].ddate && notes[j].ddate < now

      if (includeTagInvitations) {
        notes[j].details.tagInvitations = noteSpecificTagInvitations[notes[j].id] || []
      }
    }

    // If there is a custom default sort order sort notes before displaying
    if (options.search.enabled && options.search.sort) {
      var customSort = _.find(options.search.sort, 'default')
      if (customSort) {
        notes = _.sortBy(notes, customSort.compareProp)
      }
    }

    // Wrap in IIFE to prevent memory leaks
    ;(function () {
      var submissionListHtml = Handlebars.templates['components/submissions']({
        heading: options.heading,
        notes: options.pageSize ? notes.slice(0, options.pageSize) : notes,
        search: options.search,
        options: options.displayOptions,
      })

      // Remove existing submission list and search form
      if (options.emptyContainer) {
        $container.html(submissionListHtml)
      } else {
        $container.append(submissionListHtml)
      }
    })()

    if (options.search.enabled) {
      if (!_.isEmpty(options.search.subjectAreas)) {
        // Add subject area dropdown to search form (if it's enabled)
        var subjectAreaFilter = function (update, prefix) {
          var $formElem = $(this).closest('form.notes-search-form')
          var subjectDropdownVal = $formElem.find('.subject-area-dropdown input').val()
          if (prefix === '' && !subjectDropdownVal) {
            update(options.search.subjectAreas)

            var term = $formElem.find('.search-content input').val().trim().toLowerCase()
            if (term) {
              filterNotes(notes, {
                term: term,
                pageSize: options.search.pageSize,
                invitation: options.search.invitation,
                venue: options.search.venue,
                venueid: options.search.venueid,
                onResults: options.search.onResults,
                localSearch: options.search.localSearch,
              })
            } else {
              options.search.onReset()
            }
          } else if (prefix) {
            prefix = prefix.trim().toLowerCase()
            update(
              _.filter(options.search.subjectAreas, function (subject) {
                return subject.toLowerCase().indexOf(prefix) !== -1
              })
            )
          }
        }

        var subjectAreaSelected = function (selectedSubject, subjectId, focus) {
          if (selectedSubject && !focus) {
            var $formElem = $(this).closest('form.notes-search-form')
            var term = $formElem.find('.search-content input').val().trim().toLowerCase()

            if (selectedSubject === 'All' && !term) {
              options.search.onReset()
            } else {
              filterNotes(notes, {
                term: term,
                pageSize: options.search.pageSize,
                subject: selectedSubject,
                invitation: options.search.invitation,
                venue: options.search.venue,
                venueid: options.search.venueid,
                onResults: options.search.onResults,
                localSearch: options.search.localSearch,
              })
            }
          }
        }

        if (options.search.subjectAreaDropdown === 'advanced') {
          $container
            .find('form.notes-search-form .subject-area')
            .append(
              view.mkDropdown(
                'Enter a subject area to filter by',
                false,
                '',
                _.debounce(subjectAreaFilter, 300),
                _.debounce(subjectAreaSelected, 300),
                'subject-area-dropdown show-arrow'
              )
            )
        } else if (options.search.subjectAreaDropdown === 'basic') {
          $container.on(
            'change',
            'form.notes-search-form .subject-area-dropdown',
            function (e) {
              var selectedSubject = $(this).val().toLowerCase()
              var term = $(this)
                .closest('form.notes-search-form')
                .find('.search-content input')
                .val()
                .trim()
                .toLowerCase()

              if (!selectedSubject && !term) {
                options.search.onReset()
                return
              }

              filterNotes(notes, {
                term: term,
                pageSize: options.search.pageSize,
                subject: selectedSubject,
                invitation: options.search.invitation,
                venue: options.search.venue,
                venueid: options.search.venueid,
                onResults: options.search.onResults,
                localSearch: options.search.localSearch,
              })
            }
          )
        }
      }

      // Set up handler for basic text search
      var searchFormHandler = function (minLength) {
        return function () {
          var $formElem = $(this).closest('form.notes-search-form')
          var term = $formElem.find('.search-content input').val().trim().toLowerCase()

          var $subjectDropdown
          var selectedSubject = ''
          if (options.search.subjectAreaDropdown === 'advanced') {
            $subjectDropdown = $formElem.find('.subject-area-dropdown input')
          } else {
            $subjectDropdown = $formElem.find('.subject-area-dropdown')
          }
          if ($subjectDropdown.length) {
            selectedSubject = $subjectDropdown.val().trim()
          }
          var filterSubjects = selectedSubject && selectedSubject !== 'All'

          if (!term && !filterSubjects) {
            options.search.onReset()
          } else if (term.length >= minLength || (!term && filterSubjects)) {
            $formElem.append(Handlebars.templates.spinner({ extraClasses: 'spinner-mini' }))

            // Use a timeout so the loading indicator will show
            setTimeout(function () {
              var extraParams = filterSubjects ? { subject: selectedSubject } : {}
              filterNotes(
                notes,
                _.assign(
                  {
                    term: term,
                    pageSize: options.search.pageSize,
                    invitation: options.search.invitation,
                    venue: options.search.venue,
                    venueid: options.search.venueid,
                    onResults: options.search.onResults,
                    localSearch: options.search.localSearch,
                  },
                  extraParams
                )
              )
              $formElem.find('.spinner-container').remove()
            }, 50)
          }

          return false
        }
      }

      $container.on('submit', 'form.notes-search-form', searchFormHandler(2))
      $container.on(
        'keyup',
        'form.notes-search-form .search-content input',
        _.debounce(searchFormHandler(3), 400)
      )

      // Set up sorting handler
      if (!_.isEmpty(options.search.sort)) {
        $container.on('change', 'form.notes-search-form .sort-dropdown', searchFormHandler)
      }
    }

    if (options.displayOptions.showTags || options.displayOptions.showEdges) {
      var buildArray = function (tagInvitationId, fieldName, paperNumber, isTagWidget) {
        var tagInvitation = isTagWidget
          ? _.find(allTagInvitations, ['id', tagInvitationId])
          : _.find(options.displayOptions.edgeInvitations, ['id', tagInvitationId])

        if (_.has(tagInvitation, 'reply.' + fieldName + '.values')) {
          return tagInvitation.reply[fieldName].values
        } else if (_.has(tagInvitation, 'reply.' + fieldName + '.values-copied')) {
          return _.compact(
            _.map(tagInvitation.reply[fieldName]['values-copied'], function (value) {
              if (value === '{signatures}') {
                return window.user.profile.id
              }
              if (value === '{tail}') {
                return window.user.profile.id
              }
              if (value[0] === '{') {
                return null
              }
              return value
            })
          )
        } else if (_.has(tagInvitation, 'reply.' + fieldName + '.values-regex')) {
          return _.compact(
            _.map(tagInvitation.reply[fieldName]['values-regex'].split('|'), function (value) {
              if (value.indexOf('Paper.*') !== -1) {
                return value.replace('Paper.*', 'Paper' + paperNumber)
              } else {
                return value
              }
            })
          )
        }

        return []
      }

      // Register event handler for tag widgets
      var bidWidgetHandler = function (event) {
        var $self = $(this)
        var $widget = $self.closest('.tag-widget')
        var $note = $self.closest('.note')
        var newValue = $self.data('value') || $self.text().trim()
        var tagId = $widget.data('id') || null
        var isTagWidget = !$widget.hasClass('edge-widget')
        var returnVal

        if ($self.parent().hasClass('disabled')) {
          return false
        }

        if ($widget.data('type') === 'bid') {
          // dropdown tag widget
          $widget.find('button.dropdown-toggle .bid-value').text(newValue)
          $widget.find('button.dropdown-toggle').click()
          returnVal = false
        } else if ($widget.data('type') === 'radio') {
          // radio tag widget
          $self.parent().addClass('disabled')
        }

        // Build readers array
        var tagInvitationId = $widget.data('invitationId')
        var noteNumber = $note.data('number')
        var readers = buildArray(tagInvitationId, 'readers', noteNumber, isTagWidget)
        var nonreaders = buildArray(tagInvitationId, 'nonreaders', noteNumber, isTagWidget)
        var writers = buildArray(tagInvitationId, 'writers', noteNumber, isTagWidget)

        // For radio tag widgets, if user is de-selecting result the tag should be deleted
        var ddate = null
        if ($widget.data('type') === 'radio' && $self.hasClass('active')) {
          ddate = Date.now()
          $self.removeClass('active')
          $self.children('input').prop('checked', false)
          returnVal = false
        }

        // Make API call
        var apiSuccess = function (result) {
          $widget.data('id', result.id)
          $widget.removeClass('incomplete')
          $self.parent().removeClass('disabled')

          $widget.trigger('bidUpdated', [result])
        }
        var apiError = function (jqXhr, textStatus) {
          var errorText = getErrorFromJqXhr(jqXhr, textStatus)
          promptError(
            _.isString(errorText)
              ? errorText
              : 'The specified tag could not be updated. Please reload the page and try again.'
          )
          $self.parent().removeClass('disabled')
          $widget.trigger('apiReturnedError', errorText)
        }

        var requestBody
        if (isTagWidget) {
          requestBody = {
            id: tagId,
            forum: $note.data('id'),
            invitation: tagInvitationId,
            tag: newValue,
            signatures: [window.user.profile.id], // TODO: remove global user
            readers: readers,
            ddate: ddate,
          }
          post('/tags', requestBody, { handleErrors: false }).then(apiSuccess, apiError)
        } else {
          requestBody = {
            id: tagId,
            invitation: tagInvitationId,
            label: newValue,
            weight: $self.data('weight'),
            head: $note.data('id'),
            tail: window.user.profile.id,
            signatures: [window.user.profile.id], // TODO: remove global user
            readers: readers,
            nonreaders: nonreaders,
            writers: writers,
            ddate: ddate,
          }
          post('/edges', requestBody, { handleErrors: false }).then(apiSuccess, apiError)
        }

        return returnVal
      }

      var addTagHandler = function (event) {
        var $widget = $(this).closest('.tag-widget')
        var $note = $(this).closest('.note')
        var tagId = $widget.data('id') || null
        var tagInvitationId = $widget.data('invitationId')
        var tagInvitation = _.find(allTagInvitations, ['id', tagInvitationId])
        var isTagWidget = !$widget.hasClass('edge-widget')

        var readers = buildArray(tagInvitation, 'readers', $note.data('number'), isTagWidget)

        var values = tagInvitation.reply.content.tag['values-dropdown'].map(function (v) {
          return { id: v, description: v }
        })
        var filteredOptions = function (options, prefix) {
          var selectedIds = []
          $('.selected-reviewer', $widget).each(function (index) {
            selectedIds.push($(this).data('tag'))
          })

          return _.filter(options, function (p) {
            return (
              !_.includes(selectedIds, p.id) &&
              p.description.toLowerCase().indexOf(prefix.toLowerCase()) !== -1
            )
          })
        }

        var description = tagInvitation.reply.content.tag.description || ''
        var $reviewerDropdown = view.mkDropdown(
          description,
          false,
          {},
          function (update, prefix) {
            if (values.length) {
              update(filteredOptions(values, prefix))
            }
          },
          function (value, id, focusOut) {
            if (focusOut) {
              return
            }

            $('.dropdown-container', $widget).before(
              '<span class="selected-reviewer" data-tag="' +
                id +
                '">' +
                value +
                ' <a href="#" title="Delete recommendation"><span class="glyphicon glyphicon-remove" aria-hidden="true"></span></a>' +
                '</span>'
            )
            $('.dropdown input', $widget).val('').focus()

            var requestBody = {
              id: tagId,
              forum: $note.data('id'),
              invitation: tagInvitation.id,
              tag: id,
              signatures: [window.user.profile.id], // TODO: remove global user
              readers: readers,
              ddate: null,
            }
            post('/tags', requestBody, { handleErrors: false }).then(
              function (result) {
                $('.selected-reviewer', $widget).last().data('id', result.id)
                $widget.trigger('tagUpdated', [result])
              },
              function (jqXhr, textStatus) {
                var errorText = getErrorFromJqXhr(jqXhr, textStatus)
                promptError(
                  _.isString(errorText)
                    ? errorText
                    : 'The specified tag could not be updated. Please reload the page and try again.'
                )
              }
            )
          }
        )

        $('.dropdown-container', $widget).empty().append($reviewerDropdown).show()
        $(this).hide()
        $('.hide-reviewer-dropdown', $widget).show()
        return false
      }

      var removeTagHandler = function (event) {
        $(this)
          .parent()
          .fadeOut('fast', function () {
            $(this).remove()
          })
        var deletedId = $(this).parent().data('id')
        var deletedValue = $(this).parent().data('tag')
        var $widget = $(this).closest('.tag-widget')
        var $note = $(this).closest('.note')
        var tagInvitationId = $widget.data('invitationId')
        var tagInvitation = _.find(allTagInvitations, ['id', tagInvitationId])
        var readers = buildArray(tagInvitation, 'readers', $note.data('number'))

        var requestBody = {
          id: deletedId,
          forum: $note.data('id'),
          invitation: tagInvitation.id,
          tag: deletedValue,
          signatures: [window.user.profile.id], // TODO: remove global user
          readers: readers,
          ddate: Date.now(),
        }
        post('/tags', requestBody, { handleErrors: false }).then(
          function (result) {
            $widget.trigger('tagUpdated', [result])
          },
          function (jqXhr, textStatus) {
            var errorText = getErrorFromJqXhr(jqXhr, textStatus)
            promptError(
              _.isString(errorText)
                ? errorText
                : 'The specified tag could not be updated. Please reload the page and try again.'
            )
          }
        )
        return false
      }

      var doneAddingHandler = function () {
        var $widget = $(this).closest('.tag-widget')
        $('.dropdown-container', $widget).hide()
        $(this).hide()
        $('.show-reviewer-dropdown', $widget).show()
        return false
      }

      $container.on(
        'click',
        '.tag-widget[data-type="recommend"] .show-reviewer-dropdown',
        addTagHandler
      )
      $container.on(
        'click',
        '.tag-widget[data-type="recommend"] .selected-reviewer a',
        removeTagHandler
      )
      $container.on(
        'click',
        '.tag-widget[data-type="recommend"] .hide-reviewer-dropdown',
        doneAddingHandler
      )

      $container.on('click', '.tag-widget.bid .dropdown-menu li a', bidWidgetHandler)
      $container.on(
        'click',
        '.tag-widget[data-type="radio"] .btn-group .radio-toggle',
        bidWidgetHandler
      )
    }

    if (options.displayOptions.showActionButtons) {
      _registerActionButtonHandlers(
        $container,
        notes,
        Handlebars.templates['partials/noteBasic'],
        options
      )
    }

    // Pagination via page buttons or auto loading (aka infinite scroll)
    if (options.autoLoad && options.pageSize && notes.length > options.pageSize) {
      var currentOffset = 0

      var scrollHandler = function () {
        if (window.pageYOffset > $(document).height() - window.innerHeight - 600) {
          currentOffset += options.pageSize
          $container.append(
            Handlebars.templates['partials/noteList']({
              notes: notes.slice(currentOffset, currentOffset + options.pageSize),
              options: options.displayOptions,
            })
          )
          $container.append($('.spinner-container', $container).detach())
        }
      }

      // Show loading icon at bottom of list
      $container.append(Handlebars.templates.spinner({ extraClasses: 'spinner-inline' }))

      $(window).off('scroll').on('scroll', _.debounce(scrollHandler, 200))
    } else if (!options.autoLoad && options.noteCount) {
      var paginateWidgetHtml = view.paginationLinks(options.noteCount, options.pageSize, 1)
      $container.append(paginateWidgetHtml)

      $container
        .off('click', 'ul.pagination > li > a')
        .on('click', 'ul.pagination > li > a', function () {
          if (!_.isFunction(options.onPageClick)) {
            // eslint-disable-next-line no-console
            console.warn('Missing required onPageClick callback')
            return false
          }

          if ($(this).parent().hasClass('disabled') || $(this).parent().hasClass('active')) {
            return false
          }

          var pageNum = parseInt($(this).parent().data('pageNumber'), 10)
          if (isNaN(pageNum)) {
            return false
          }

          // Update pagination widget
          var $paginationContainer = $(this).closest('.pagination-container')
          $paginationContainer.replaceWith(
            view.paginationLinks(options.noteCount, options.pageSize, pageNum)
          )

          var $overlay = $('<div class="content-overlay">&nbsp;</div>')
          $container.append($overlay)

          // Load next page of results and replace current note list
          var offset = (pageNum - 1) * options.pageSize
          options.onPageClick(offset).then(function (newNotes) {
            var scrollPos = $container.offset().top - 51 - 12
            $('html, body').animate({ scrollTop: scrollPos }, 400)
            $('.submissions-list', $container).replaceWith(
              Handlebars.templates['partials/noteList']({
                notes: newNotes,
                options: options.displayOptions,
              })
            )
            setTimeout(function () {
              $overlay.remove()
            }, 100)

            if (_.isFunction(options.onPageClickComplete)) {
              options.onPageClickComplete()
            }
          })

          return false
        })
    }

    typesetMathJax()

    if (options.fadeIn) {
      return $container.fadeIn('fast').promise()
    }
    return $container
  }

  var activityList = function (notes, options) {
    var activityDefaults = {
      container: '.activity-container > div',
      showGroup: true,
      showTags: false,
      showActionButtons: false,
      onNoteEdited: null,
      onNoteTrashed: null,
      onNoteRestored: null,
      emptyMessage: 'No recent activity.',
      user: null,
    }
    options = _.defaults(options, activityDefaults, defaultDisplayOptions)

    // Format notes data
    notes = notes || []
    notes.forEach(function (note) {
      if (!note.details) {
        note.details = {}
      }

      var noteAuthors = note.tauthor ? [note.tauthor] : note.signatures
      note.details.userIsSignatory =
        options.user && _.intersection(noteAuthors, options.user.emails).length
      if (note.details.userIsSignatory) {
        note.details.formattedSignature = 'You'
      } else {
        var prettySig = view.prettyId(note.signatures[0])
        if (prettySig === '(anonymous)' || prettySig === '(guest)') {
          prettySig = 'Anonymous'
        } else if (prettySig === 'Super User') {
          prettySig = 'An Administrator'
        }
        note.details.formattedSignature = prettySig
      }

      note.details.isForum = note.forum === note.id

      var invitationArr =
        note.version === 2 ? note.invitations[0].split('/-/') : note.invitation.split('/-/')
      note.details.group = invitationArr[0]

      var invitationLower = invitationArr[1].toLowerCase()
      note.details.isSubmission = invitationLower.indexOf('submission') !== -1
      note.details.isReview = invitationLower.indexOf('review') !== -1
      note.details.isComment = invitationLower.indexOf('comment') !== -1
      note.details.isDecision = invitationLower.indexOf('decision') !== -1
      note.details.isAssignment = invitationLower.indexOf('assignment') !== -1

      note.details.isDeleted = note.ddate && note.ddate < Date.now()
      note.details.isUpdated = note.tmdate > note.tcdate
    })

    // Filter out any notes that should not be displayed
    notes = notes.filter(function (note) {
      return !note.isAssignment
    })

    var $container = $(options.container).eq(0)
    $container.append(
      Handlebars.templates['partials/activityList']({
        notes: notes,
        activityOptions: options,
      })
    )

    if (options.showActionButtons) {
      _registerActionButtonHandlers(
        $container,
        notes,
        Handlebars.templates['partials/noteActivity'],
        options
      )
    }

    typesetMathJax()
  }

  var _registerActionButtonHandlers = function ($container, notes, noteTemplateFn, options) {
    var user = _.isEmpty(options.user)
      ? window.user
      : { id: options.user.id, profile: options.user }

    // Edit button handler
    $container.on('click', '.note-action-edit', function (e) {
      var $note = $(this).closest('.note')
      var noteId = $note.data('id')
      var existingNote = _.find(notes, ['id', noteId])
      if (!existingNote) {
        return
      }
      var details = existingNote.details
      existingNote = _.omit(existingNote, ['details'])

      return get('/invitations', { id: existingNote.invitation }).then(function (result) {
        var invitationObj = _.get(result, 'invitations[0]', {})

        $('#note-editor-modal').remove()
        $('body').append(
          Handlebars.templates.genericModal({
            id: 'note-editor-modal',
            extraClasses: 'modal-lg',
            showHeader: false,
            showFooter: false,
          })
        )
        $('#note-editor-modal').on('hidden.bs.modal', function () {
          $('#note-editor-modal').find('div.note_editor.panel').remove()
        })

        view.mkNoteEditor(existingNote, invitationObj, user, {
          onNoteEdited: function (result) {
            $('#note-editor-modal').modal('hide')
            existingNote.content = result.content
            existingNote.tmdate = Date.now()
            details.isUpdated = true
            $note.html(
              noteTemplateFn(
                Object.assign({}, existingNote, { details: details, options: options })
              )
            )
            promptMessage('Note updated successfully')

            // update notes object so that subsequent update has latest value
            // result (from POST) can have more properties so can't just assign to note (from GET)
            var indexOfUpdatedNote = _.findIndex(notes, ['id', result.id])
            Object.keys(notes[indexOfUpdatedNote]).forEach(function (key) {
              if (key !== 'details') {
                notes[indexOfUpdatedNote][key] = result[key]
              }
            })
            notes[indexOfUpdatedNote].details.isUpdated = true

            MathJax.typesetPromise()
            return _.isFunction(options.onNoteEdited)
              ? options.onNoteEdited(existingNote)
              : true
          },
          onError: function (errors) {
            $('#note-editor-modal .modal-body .alert-danger').remove()

            $('#note-editor-modal .modal-body').prepend(
              '<div class="alert alert-danger"><strong>Error:</strong> </div>'
            )
            var errorText = 'Could not save note'
            if (errors && errors.length) {
              errorText = translateErrorMessage(errors[0])
            }
            $('#note-editor-modal .modal-body .alert-danger').append(errorText)
            $('#note-editor-modal').animate({ scrollTop: 0 }, 400)
          },
          onNoteCancelled: function () {
            $('#note-editor-modal').modal('hide')
          },
          onCompleted: function ($editor) {
            if (!$editor) return
            $('#note-editor-modal .modal-body')
              .empty()
              .addClass('legacy-styles')
              .append(
                '<button type="button" class="close" data-dismiss="modal" aria-label="Close">' +
                  '<span aria-hidden="true">&times;</span>' +
                  '</button>',
                $editor
              )
            $('#note-editor-modal').modal('show')
          },
        })
      })
    })

    // Trash button handler
    $container.on('click', '.note-action-trash', function (e) {
      var $note = $(this).closest('.note')
      var noteId = $note.data('id')
      var noteTitle = $note.find('h4 > a').eq(0).text()
      var existingNote = _.find(notes, ['id', noteId])
      if (!existingNote) {
        return
      }

      view.deleteOrRestoreNote(existingNote, noteTitle, user, function (newNote) {
        $note.addClass('trashed').html(
          noteTemplateFn({
            ...newNote,
            details: { ...existingNote.details, isDeleted: true },
            options: options,
          })
        )
        return _.isFunction(options.onNoteTrashed) ? options.onNoteTrashed(newNote) : true
      })
    })

    // Restore button handler
    $container.on('click', '.note-action-restore', function (e) {
      var $note = $(this).closest('.note')
      var noteId = $note.data('id')
      var existingNote = _.find(notes, ['id', noteId])
      if (!existingNote) {
        return
      }
      var details = existingNote.details
      existingNote = _.omit(existingNote, ['details'])
      existingNote.ddate = null

      post('/notes', existingNote).then(function (newNote) {
        details.isDeleted = false
        $note
          .removeClass('trashed')
          .html(
            noteTemplateFn(Object.assign({}, newNote, { details: details, options: options }))
          )
        return _.isFunction(options.onNoteRestored) ? options.onNoteRestored(newNote) : true
      })
    })
  }

  var tabPanel = function (sections, options) {
    options = _.defaults(options, {
      container: '#notes',
      containerClasses: '',
      hidden: false,
    })

    if (_.isEmpty(sections)) {
      // eslint-disable-next-line no-console
      console.warn('Missing required parameter for tabPanel: sections')
      return
    }

    var displayNone = ''
    if (options.hidden) {
      displayNone = 'display: none;'
    }

    var $container = $(options.container)
    var $tabs = $(
      '<div class="tabs-container ' +
        options.containerClasses +
        '" style="' +
        displayNone +
        '">' +
        Handlebars.templates['components/tabs']({ sections: sections }) +
        '</div>'
    )
    $container.append($tabs)
  }

  var setupAutoLoading = function (invitationId, pageSize, options) {
    var defaults = {
      container: '#notes',
      queryParams: {},
    }
    options = _.defaults(options, defaults, defaultDisplayOptions)

    var $container = $(options.container)
    var currentOffset = 0
    var processing = false

    var scrollHandler = function () {
      if (processing) {
        return
      }
      if (window.pageYOffset > $(document).height() - window.innerHeight - 400) {
        currentOffset += pageSize
        processing = true
        $container.append(Handlebars.templates.spinner())

        var submissionOptions = _.defaults(
          { pageSize: pageSize, offset: currentOffset },
          options.queryParams
        )
        var notesP = getSubmissions(invitationId, submissionOptions)
        notesP.then(function (newNotes) {
          $('.spinner-container', $container).remove()
          if (_.isEmpty(newNotes)) {
            $(window).off('scroll')
          } else {
            $('.submissions-list', $container).append(moreNotes(newNotes, options))
          }
          processing = false
        })
      }
    }

    $(window).off('scroll').on('scroll', _.debounce(scrollHandler, 200))
  }

  var disableAutoLoading = function () {
    $(window).off('scroll')
  }

  var moreNotes = function (notes, displayOptions) {
    displayOptions = _.defaults(displayOptions, defaultDisplayOptions)

    return _.map(notes, function (note) {
      note.options = displayOptions
      return (
        '<li class="note" data-id="' +
        note.id +
        '">' +
        Handlebars.templates['partials/noteBasic'](note) +
        '</li>'
      )
    }).join('\n')
  }

  var searchResults = function (notes, options) {
    var defaults = {
      container: '#notes',
      pageSize: null,
      autoLoad: true,
      emptyContainer: false,
      emptyMessage: 'No papers to display at this time',
    }
    options = _.defaults(options, defaults, defaultDisplayOptions)

    var $container = $(options.container)
    var noteListHtml = Handlebars.templates['partials/noteList']({
      notes: options.pageSize ? notes.slice(0, options.pageSize) : notes,
      options: options,
    })

    if (options.emptyContainer) {
      $container.empty()
    } else {
      $container.find('.submissions-list, .spinner-container, .pagination-container').remove()
    }

    if (options.autoLoad && options.pageSize && notes.length > options.pageSize) {
      var currentOffset = 0
      $container.data('currentOffset', currentOffset)

      var scrollHandler = function () {
        if (window.pageYOffset > $(document).height() - window.innerHeight - 600) {
          currentOffset += options.pageSize
          $container.append(
            Handlebars.templates['partials/noteList']({
              notes: notes.slice(currentOffset, currentOffset + options.pageSize),
              options: options,
            })
          )
          $container.append($('.spinner-container', $container).detach())
        }
      }

      // Show loading icon at bottom of list
      $container.append(Handlebars.templates.spinner({ extraClasses: 'spinner-inline' }))

      $(window).on('scroll', _.debounce(scrollHandler, 200))
    }

    $container.append(noteListHtml)
    typesetMathJax()
  }

  // Deprecated
  var taskList = function (notePairs, tagInvitations, options) {
    var taskDefaults = {
      container: '#notes',
      showTasks: true,
      emptyMessage: 'No outstanding tasks to display',
    }
    options = _.defaults(options, taskDefaults, defaultDisplayOptions)

    var taskRows = []
    _.forEach(tagInvitations, function (inv) {
      var duedate = new Date(inv.duedate)
      var duedateStr = duedate.toLocaleDateString('en-GB', dateOptions)

      if (inv.web) {
        taskRows.push(
          [
            '<li class="note invitation-link">',
            '<a href="/invitation?id=' + inv.id + '">' + view.prettyId(inv.id) + '</a>',
            '<span class="duedate ' +
              getDueDateStatus(duedate) +
              '">Due: ' +
              duedateStr +
              '</span>',
            '</li>',
          ].join('\n')
        )
      }
    })

    _.forEach(notePairs, function (pair) {
      var inv = pair.invitation
      var replytoNote = pair.replytoNote

      var duedate = new Date(inv.duedate)
      inv.dueDateStr = duedate.toLocaleDateString('en-GB', dateOptions)
      inv.dueDateStatus = getDueDateStatus(duedate)
      inv.groupId = inv.id.split('/-/')[0]
      replytoNote.taskInvitation = inv
      replytoNote.options = options

      taskRows.push(
        [
          '<li class="note" data-id="' + replytoNote.id + '">',
          Handlebars.templates['partials/noteBasic'](replytoNote),
          '</li>',
        ].join('\n')
      )
    })

    var $container = $(options.container)
    var taskRowsOrEmpty = taskRows.length
      ? taskRows.join('\n')
      : '<li><p class="empty-message">' + options.emptyMessage + '</p></li>'
    var noteListHtml =
      '<ul class="list-unstyled submissions-list">' + taskRowsOrEmpty + '</ul>'

    $container.append(noteListHtml)
  }

  var newTaskList = function (noteInvitations, tagInvitations, options) {
    var taskDefaults = {
      container: '#notes',
      showTasks: true,
      showContents: true,
      referrer: null,
      emptyMessage: 'No outstanding tasks to display',
    }
    options = _.defaults(options, taskDefaults, defaultDisplayOptions)

    var allInvitations = tagInvitations.concat(noteInvitations).sort(function (a, b) {
      return a.duedate - b.duedate
    })

    allInvitations.forEach(function (inv) {
      var duedate = new Date(inv.duedate)
      inv.dueDateStr = duedate.toLocaleDateString('en-GB', dateOptions)
      inv.dueDateStatus = getDueDateStatus(duedate)
      inv.groupId = inv.id.split('/-/')[0]

      if (!inv.details) {
        inv.details = {}
      }

      if (!_.isEmpty(inv.details.replytoNote) || inv.reply.forum) {
        inv.noteInvitation = true

        if (inv.details.repliedNotes?.length > 0) {
          inv.completed = true
        }
        inv.noteId =
          inv.details.repliedNotes?.length === 1
            ? inv.details.repliedNotes[0].id
            : inv.reply.replyto

        if (_.isEmpty(inv.details.replytoNote)) {
          // Some invitations returned by the API do not contain replytoNote
          inv.details.replytoNote = { forum: inv.reply.forum }
        }
      } else {
        inv.tagInvitation = true

        if (inv.taskCompletionCount && inv.details) {
          var repliedCount =
            (inv.details.repliedTags && inv.details.repliedTags.length) ||
            (inv.details.repliedEdges && inv.details.repliedEdges.length)
          if (repliedCount && repliedCount >= inv.taskCompletionCount) {
            // Temporary special case for Recommendation invitations. Uses hardcoded constant for
            // number of papers assigned.
            if (_.endsWith(inv.id, 'Recommendation')) {
              var groupedEdgesCounts = _.countBy(inv.details.repliedEdges, 'head')
              var allPapersRecommended = Object.keys(groupedEdgesCounts).length >= 30
              inv.completed =
                allPapersRecommended &&
                _.every(groupedEdgesCounts, function (count) {
                  return count >= inv.taskCompletionCount
                })
            } else {
              inv.completed = true
            }
          }
        }
      }
    })

    var $container = $(options.container)
    var taskListHtml = Handlebars.templates['partials/taskList']({
      invitations: allInvitations,
      taskOptions: options,
    })

    $container.append(taskListHtml)
  }

  var errorMessage = function (message) {
    message = message || 'The page could not be loaded at this time. Please try again later.'
    $('#notes')
      .hide()
      .html('<div class="alert alert-danger"><strong>Error:</strong> ' + message + '</div>')
    return $('#notes').fadeIn('fast')
  }

  var loadingSpinner = function (container, options) {
    var defaults = {
      inline: false,
      overwrite: true,
      extraClasses: null,
    }
    options = _.defaults(options, defaults)

    if (_.isEmpty(container)) {
      // eslint-disable-next-line no-console
      console.warn('Missing required parameter for spinner: container')
      return
    }

    if (options.inline) {
      options.extraClasses = options.extraClasses
        ? options.extraClasses + ' spinner-inline'
        : 'spinner-inline'
    }

    var $container = $(container)
    if (options.overwrite) {
      $container.empty()
    }
    return $container.append(
      Handlebars.templates.spinner({
        extraClasses: options.extraClasses,
      })
    )
  }

  var done = function (options) {
    // Should be called after page is entirely finished rendering so that actions like registering
    // handlers and scrolling to anchors can be performed.
    var defaults = {
      tooltip: true,
      scrollTo: true,
      showFirstTab: true,
    }
    options = _.defaults(options, defaults)

    if (options.tooltip) {
      $('[data-toggle="tooltip"]').tooltip()
    }

    if (options.scrollTo) {
      var scrollToElem
      var scrollToElemId = window.location.hash
      if ($('a[href="' + scrollToElemId + '"]').length) {
        scrollToElem = $('a[href="' + scrollToElemId + '"]')
      } else if ($(scrollToElemId).length) {
        scrollToElem = $(scrollToElemId)
      }

      if (scrollToElem) {
        scrollToElem.trigger('click', [true])
        // 51 is the height of the nav bar, 12 is for padding
        var scrollPos = scrollToElem.offset().top - 51 - 12
        $('html, body').animate({ scrollTop: scrollPos }, 400)
      }
    }

    if (
      options.showFirstTab &&
      $('.tabs-container').length &&
      !$('.tabs-container ul.nav-tabs > li.active').length
    ) {
      $('.tabs-container ul.nav-tabs > li > a:visible').eq(0).trigger('click', [true])
    }
  }

  return {
    get: get,
    post: post,
    put: put,
    delete: xhrDelete,
    getAll: getAll,
    setToken: setToken,
    sendFile: sendFile,
    sendFileChunk: sendFileChunk,
    getErrorFromJqXhr: getErrorFromJqXhr,
    setupAutoLoading: setupAutoLoading,
    disableAutoLoading: disableAutoLoading,
    filterCollections: filterCollections,
    _registerActionButtonHandlers: _registerActionButtonHandlers,
    api: {
      getSubmissionInvitation: getSubmissionInvitation,
      getSubmissions: getSubmissions,
      getTagInvitations: getTagInvitations,
    },

    ui: {
      setup: setup,
      header: basicHeader,
      venueHeader: venueHeader,
      linksList: linksList,
      accordion: accordion,
      submissionButton: invitationButtonAndNoteEditor,
      submissionList: submissionList,
      taskList: taskList,
      newTaskList: newTaskList,
      activityList: activityList,
      tabPanel: tabPanel,
      searchResults: searchResults,
      spinner: loadingSpinner,
      errorMessage: errorMessage,
      done: done,
    },
  }
})()
