/* globals _: false */
/* globals $: false */
/* globals Handlebars: false */
/* globals moment: false */
/* globals MathJax: false */
/* globals Webfield: false */
/* globals view: false */
/* globals promptError: false */
/* globals promptLogin: false */
/* globals promptMessage: false */
/* globals translateErrorMessage: false */
/* globals typesetMathJax: false */
/* globals OpenBanner: false */

const copy = require('copy-to-clipboard')

// eslint-disable-next-line wrap-iife
module.exports = (function () {
  // Save authentication token as a private var
  var token

  // AJAX Functions
  var get = function (url, queryObj, options) {
    var defaults = {
      handleErrors: true,
      version: 2,
    }
    options = _.defaults(options, defaults)
    var defaultHeaders = { 'Access-Control-Allow-Origin': '*' }
    var authHeaders = token ? { Authorization: 'Bearer ' + token } : {}
    var baseUrl = window.OR_API_V2_URL || ''
    var errorCallback = options.handleErrors ? jqErrorCallback : null

    return $.ajax({
      dataType: 'json',
      type: 'get',
      contentType: 'application/x-www-form-urlencoded; charset=UTF-8',
      url: baseUrl + url,
      data: queryObj,
      headers: Object.assign(defaultHeaders, authHeaders),
      xhrFields: {
        withCredentials: true,
      },
    }).then(jqSuccessCallback, errorCallback)
  }

  var post = function (url, queryObj, options) {
    var defaults = {
      handleErrors: true,
      version: 2,
    }
    options = _.defaults(options, defaults)
    var defaultHeaders = { 'Access-Control-Allow-Origin': '*' }
    var authHeaders = token ? { Authorization: 'Bearer ' + token } : {}
    var baseUrl = window.OR_API_V2_URL || ''
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
      version: 2,
    }
    options = _.defaults(options, defaults)
    var defaultHeaders = { 'Access-Control-Allow-Origin': '*' }
    var authHeaders = token ? { Authorization: 'Bearer ' + token } : {}
    var baseUrl = window.OR_API_V2_URL || ''
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
      version: 2,
    }
    options = _.defaults(options, defaults)
    var defaultHeaders = { 'Access-Control-Allow-Origin': '*' }
    var authHeaders = token ? { Authorization: 'Bearer ' + token } : {}
    var baseUrl = window.OR_API_V2_URL || ''
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
        // eslint-disable-next-line prefer-spread
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

    var errorText = Webfield.getErrorFromJqXhr(jqXhr, textStatus)
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

  var setToken = function (newAccessToken) {
    token = newAccessToken
  }

  var getInvitation = function (invitationId) {
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
      details: 'replyCount',
      pageSize: 100,
      offset: 0,
      includeCount: false,
    }
    options = _.defaults(options, defaults)

    var query = _.omit(options, ['pageSize', 'includeCount'])
    query.limit = options.pageSize
    query.invitation = invitationId

    return get('/notes', query).then(function (result) {
      if (options.includeCount) {
        return result
      } else {
        return result.notes
      }
    })
  }

  var getAllSubmissions = function (invitationId, options) {
    var defaults = {
      details: 'replies',
      numbers: null,
      sort: 'number:desc',
    }
    options = _.defaults(options, defaults)
    var query = {
      invitation: invitationId,
      details: options.details,
      sort: options.sort,
    }

    if (options['content.venueid']) {
      query['content.venueid'] = options['content.venueid']
    }

    if (Array.isArray(options.numbers)) {
      if (!options.numbers.length) {
        return []
      }
      query.number = options.numbers.join(',')
    }

    if (options.domain) {
      query.domain = options.domain
    }

    return getAll('/notes', query)
  }

  var getAssignedInvitations = function (venueId, roleName, options) {
    var defaults = {
      submissionGroupName: 'Paper',
      numbers: null,
    }
    options = _.defaults(options, defaults)
    var invitationsP = getAll('/invitations', {
      prefix: venueId + '/.*',
      invitee: true,
      duedate: true,
      replyto: true,
      type: 'notes',
      details: 'replytoNote,repliedNotes',
      domain: venueId,
    })

    var edgeInvitationsP = getAll('/invitations', {
      prefix: venueId + '/.*',
      invitee: true,
      duedate: true,
      type: 'edges',
      details: 'repliedEdges',
      domain: venueId,
    })

    var tagInvitationsP = getAll('/invitations', {
      prefix: venueId + '/.*',
      invitee: true,
      duedate: true,
      type: 'tags',
      details: 'repliedTags',
      domain: venueId,
    })

    var filterInviteeAndNumbers = function (inv) {
      var number = getNumberfromInvitation(inv.id, options.submissionGroupName)
      var invMatchesNumber = !(number && options.numbers) || options.numbers.includes(number)
      return (
        (inv.id.includes(roleName) ||
          _.some(inv.invitees, function (invitee) {
            return invitee.includes(roleName)
          })) &&
        invMatchesNumber
      )
    }

    return $.when(invitationsP, edgeInvitationsP, tagInvitationsP).then(
      function (noteInvitations, edgeInvitations, tagInvitations) {
        var invitations = noteInvitations.concat(edgeInvitations).concat(tagInvitations)
        return _.filter(invitations, filterInviteeAndNumbers)
      }
    )
  }

  var getNumberfromGroup = function (groupId, name) {
    var tokens = groupId.split('/')
    var paper = _.find(tokens, function (token) {
      return _.startsWith(token, name)
    })

    if (paper) {
      return paper.replace(name, '')
    } else {
      return null
    }
  }

  var getNumberfromInvitation = function (invitationId, name) {
    var tokens = invitationId.split('/-/')
    return getNumberfromGroup(tokens[0], name)
  }

  var getPaperNumbersfromGroups = function (groups) {
    return _.uniq(
      _.map(groups, function (group) {
        return Number.parseInt(getNumberfromGroup(group.id, 'Paper'), 10)
      })
    )
  }

  var renderTable = function (container, rows, options) {
    var defaults = {
      emptyMessage: 'No information to show at this time.',
      renders: [],
      headings: rows.length ? Object.keys(rows[0]) : [],
      pageSize: null,
      extraClasses: '',
      reminderOptions: {
        container: 'a.send-reminder-link',
        defaultSubject: 'Reminder',
        defaultBody: 'This is a reminder to please submit your review. \n\n Thank you,\n',
        menu: [],
      },
      postRenderTable: function () {},
    }
    options = _.defaults(options, defaults)
    var $container = $(container).empty()
    var containerId = container.slice(1)
    var filteredRows = rows
    var selectedIds = []

    var defaultRender = function (row) {
      var propertiesHtml = ''
      Object.keys(row).forEach(function (key) {
        propertiesHtml =
          propertiesHtml +
          '<tr><td><strong>' +
          key +
          '</strong></td><td>' +
          row[key] +
          '</td></tr>'
      })
      return (
        '<div><table class="table table-condensed table-minimal"><tbody>' +
        propertiesHtml +
        '</tbody></table></div>'
      )
    }

    var render = function (rows, pageNumber) {
      var totalLength = rows.length
      var usePagination = options.pageSize && totalLength > options.pageSize
      if (usePagination) {
        var offset = (pageNumber - 1) * options.pageSize
        rows = rows.slice(offset, offset + options.pageSize)
      }

      var rowsHtml = rows.map(function (row) {
        return Object.values(row).map(function (cell, i) {
          var fn = options.renders[i] || defaultRender
          return fn(cell)
        })
      })

      var tableHtml = Handlebars.templates['components/table']({
        headings: options.headings,
        rows: rowsHtml,
        extraClasses: options.extraClasses,
      })

      var paginationHtml = null
      if (usePagination) {
        paginationHtml = view.paginationLinks(
          totalLength,
          options.pageSize,
          pageNumber,
          null,
          { showCount: true }
        )
      }

      $container.find('.table-container, .pagination-container').remove()
      $container.append(tableHtml, paginationHtml)

      if (paginationHtml) {
        $('ul.pagination', $container).css({ marginTop: '2.5rem', marginBottom: '0' })
      }

      selectedIds.forEach(function (id) {
        $container
          .find('input.select-note-reviewers[data-note-id="' + id + '"]')
          .prop('checked', true)
      })
      if (selectedIds.length === filteredRows.length) {
        $container.find('input.select-all-papers').prop('checked', true)
      }

      if (typeof options.postRenderTable === 'function') {
        options.postRenderTable()
      }
    }

    var registerHelpers = function () {
      $container.on('click', 'a.collapse-btn', function (e) {
        if ($(this).text() === 'Show reviewers') {
          $(this).text('Hide reviewers')
        } else {
          $(this).text('Show reviewers')
        }
      })

      $container.on('change', '.select-all-papers', function (e) {
        var $allPaperCheckBoxes = $container.find('input.select-note-reviewers')
        var $messageBtn = $container.find('.message-reviewers-btn')
        if ($(this).prop('checked')) {
          $allPaperCheckBoxes.prop('checked', true)
          selectedIds = filteredRows.map(function (row) {
            return row.checked.noteId
          })
          $messageBtn.attr('disabled', false)
        } else {
          $allPaperCheckBoxes.prop('checked', false)
          selectedIds = []
          $messageBtn.attr('disabled', true)
        }
      })

      $container.on('change', '.select-note-reviewers', function (e) {
        var noteId = $(this).data('noteId')
        if ($(this).prop('checked')) {
          selectedIds = selectedIds.concat(noteId)
        } else {
          selectedIds = selectedIds.filter(function (id) {
            return id !== noteId
          })
        }

        var $messageBtn = $container.find('.message-reviewers-btn')
        if (selectedIds.length > 0) {
          $messageBtn.attr('disabled', false)
        } else {
          $messageBtn.attr('disabled', true)
        }

        var $superCheckbox = $container.find('.select-all-papers')
        if (selectedIds.length === filteredRows.length) {
          $superCheckbox.prop('checked', true)
        } else {
          $superCheckbox.prop('checked', false)
        }
      })

      $container.on('click', 'ul.pagination > li > a', function (e) {
        var $target = $(this).parent()
        if ($target.hasClass('disabled') || $target.hasClass('active')) {
          return
        }

        var pageNumber = parseInt($target.data('pageNumber'), 10)
        if (isNaN(pageNumber)) {
          return
        }
        render(filteredRows, pageNumber)

        var scrollPos = $container.offset().top - 104
        $('html, body').animate({ scrollTop: scrollPos }, 400)

        $container.data('lastPageNum', pageNumber)
        return false
      })

      $container.on('click', '.msg-reviewers-container a', function (e) {
        var filter = $(this)[0].id
        $('#message-reviewers-modal').remove()

        var menuOption = options.reminderOptions.menu.find(function (menu) {
          return 'msg-' + menu.id === filter
        })
        if (!menuOption) {
          return false
        }

        var defaultBody = menuOption.messageBody || options.reminderOptions.defaultBody

        var modalHtml = Handlebars.templates.messageReviewersModalFewerOptions({
          filter: filter,
          defaultSubject: options.reminderOptions.defaultSubject,
          defaultBody: defaultBody,
        })
        $('body').append(modalHtml)

        $('#message-reviewers-modal .btn-primary.step-1').on(
          'click',
          sendReviewerReminderEmailsStep1
        )
        $('#message-reviewers-modal .btn-primary.step-2').on(
          'click',
          sendReviewerReminderEmailsStep2
        )
        $('#message-reviewers-modal form').on('submit', sendReviewerReminderEmailsStep1)

        $('#message-reviewers-modal').modal()

        return false
      })

      var sendReviewerReminderEmailsStep1 = function (e) {
        var subject = $('#message-reviewers-modal input[name="subject"]').val().trim()
        var messageContent = $('#message-reviewers-modal textarea[name="message"]')
          .val()
          .trim()
        var filter = $(this)[0].dataset.filter

        var menuOption = options.reminderOptions.menu.find(function (menu) {
          return 'msg-' + menu.id === filter
        })
        if (!menuOption) {
          return false
        }

        var users = menuOption.getUsers(selectedIds)
        var messages = []
        var count = 0
        var userCounts = Object.create(null)

        users.forEach(function (user) {
          if (user.groups?.length > 0) {
            var groupIds = []
            user.groups.forEach(function (group) {
              var groupId = group.anonymousGroupId || group.id
              groupIds.push(groupId)
              if (groupId in userCounts) {
                userCounts[groupId].count++
              } else {
                userCounts[groupId] = {
                  name: group.name,
                  email: group.email,
                  count: 1,
                }
              }
            })
            messages.push({
              groups: groupIds,
              message: messageContent,
              subject: subject,
              forumUrl: user.forumUrl,
              replyTo: options.reminderOptions.replyTo,
              invitation:
                options.reminderOptions.messageInvitationId &&
                options.reminderOptions.messageInvitationId.replace('{number}', user.number),
              signature:
                options.reminderOptions.messageInvitationId &&
                options.reminderOptions.messageSignature,
            })
            count += groupIds.length
          }
        })

        try {
          localStorage.setItem('messages', JSON.stringify(messages))
          localStorage.setItem('messageCount', count)
        } catch (error) {
          promptError(
            'Too many messages. Please select a smaller number of users and try again.'
          )
          return false
        }

        // Show step 2
        var namesHtml = _.flatMap(userCounts, function (obj) {
          var text = obj.name + ' <span>&lt;' + obj.email + '&gt;</span>'
          if (obj.count > 1) {
            text += ' (&times;' + obj.count + ')'
          }
          return text
        }).join(', ')
        $('#message-reviewers-modal .reviewer-list').html(namesHtml)
        $('#message-reviewers-modal .num-reviewers').text(count)
        $('#message-reviewers-modal .step-1').hide()
        $('#message-reviewers-modal .step-2').show()

        return false
      }

      var sendReviewerReminderEmailsStep2 = function (e) {
        var reviewerMessages = localStorage.getItem('messages')
        var messageCount = localStorage.getItem('messageCount')
        if (!reviewerMessages || !messageCount) {
          $('#message-reviewers-modal').modal('hide')
          promptError(
            'Could not send emails at this time. Please refresh the page and try again.'
          )
        }
        JSON.parse(reviewerMessages).forEach(postReviewerEmails)

        localStorage.removeItem('messages')
        localStorage.removeItem('messageCount')

        $('#message-reviewers-modal').modal('hide')
        promptMessage('Successfully sent ' + messageCount + ' emails')
      }

      $container.on('click', options.reminderOptions.container, function (e) {
        var $link = $(this)
        var userId = $link.data('userId')
        var forumUrl = $link.data('forumUrl')
        var paperNumber = $link.data('paperNumber')

        var sendReviewerReminderEmails = function (e) {
          var postData = {
            groups: [userId],
            forumUrl: forumUrl,
            subject: $('#message-reviewers-modal input[name="subject"]').val().trim(),
            message: $('#message-reviewers-modal textarea[name="message"]').val().trim(),
            replyTo: options.reminderOptions.replyTo,
            invitation:
              options.reminderOptions.messageInvitationId &&
              options.reminderOptions.messageInvitationId.replace('{number}', paperNumber),
            signature:
              options.reminderOptions.messageInvitationId &&
              options.reminderOptions.messageSignature,
          }

          $('#message-reviewers-modal').modal('hide')
          promptMessage('A reminder email has been sent to ' + view.prettyId(userId))
          postReviewerEmails(postData)
          $link.after(' (Last sent: ' + new Date().toLocaleDateString() + ')')

          return false
        }

        var modalHtml = Handlebars.templates.messageReviewersModalFewerOptions({
          singleRecipient: true,
          reviewerId: userId,
          forumUrl: forumUrl,
          defaultSubject: options.reminderOptions.defaultSubject,
          defaultBody: options.reminderOptions.defaultBody,
        })
        $('#message-reviewers-modal').remove()
        $('body').append(modalHtml)

        $('#message-reviewers-modal .btn-primary').on('click', sendReviewerReminderEmails)
        $('#message-reviewers-modal form').on('submit', sendReviewerReminderEmails)

        $('#message-reviewers-modal').modal()
        return false
      })

      $container.on('click', 'a.copy-email', function (e) {
        var $link = $(this)
        var userId = $link.data('userId')
        var name = $link.data('userName')

        if (!options.preferredEmailsInvitationId) {
          promptError('Email is not available.')
          return
        }

        get('/edges', { invitation: options.preferredEmailsInvitationId, head: userId }).then(
          function (result) {
            var email = result.edges?.[0]?.tail

            if (!email) {
              promptError('Email is not available.')
              return
            }
            copy(`${name} <${email}>`)
            promptMessage(`${email} copied to clipboard`)
          },
          function () {
            promptError('Email is not available.')
          }
        )
        return false
      })

      var postReviewerEmails = function (postData) {
        postData.message = postData.message.replace('{{forumUrl}}', postData.forumUrl)

        return post(
          '/messages',
          _.pick(postData, [
            'groups',
            'subject',
            'message',
            'replyTo',
            'invitation',
            'signature',
          ])
        ).then(function (response) {
          // Save the timestamp in the local storage
          for (var i = 0; i < postData.groups.length; i++) {
            var userId = postData.groups[i]
            try {
              localStorage.setItem(postData.forumUrl + '|' + userId, Date.now())
            } catch (error) {
              // eslint-disable-next-line no-console
              console.warn(`Could not set timestamp for ${userId}`)
            }
          }
        })
      }
    }

    if (!rows.length) {
      $container.append('<p class="empty-message">' + options.emptyMessage + '</p>')
      return
    }

    var reminderMenuHtml = ''
    if (options.reminderOptions.menu && options.reminderOptions.menu.length) {
      var optionsHtml = ''
      options.reminderOptions.menu.forEach(function (menu) {
        optionsHtml =
          optionsHtml + '<li><a id="msg-' + menu.id + '">' + menu.name + '</a></li>'
      })
      reminderMenuHtml =
        '<div class="btn-group msg-reviewers-container" role="group">' +
        '<button type="button" class="message-reviewers-btn btn btn-icon dropdown-toggle" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false" title="Select papers to message corresponding reviewers" disabled>' +
        '<span class="glyphicon glyphicon-envelope"></span>' +
        ' &nbsp;Message&nbsp; ' +
        '<span class="caret"></span>' +
        '</button>' +
        '<ul class="dropdown-menu" aria-labelledby="grp-msg-reviewers-btn">' +
        optionsHtml +
        '</ul>' +
        '</div>'
    }

    if (options.sortOptions) {
      var order = 'desc'
      var sortOptionHtml = Object.keys(options.sortOptions)
        .map(function (option) {
          return '<option value="' + option + '">' + option.replace(/_/g, ' ') + '</option>'
        })
        .join('\n')

      // #region sortBarHtml
      var searchHtml = options.searchProperties
        ? '<strong style="vertical-align: middle;">Search:</strong>' +
          '<input id="form-search-' +
          containerId +
          '" type="text" class="form-search form-control" class="form-control" placeholder="Enter search term or type + to start a query and press enter" style="width:440px; margin-right: 1.5rem; line-height: 34px;">'
        : ''

      var sortBarHtml =
        '<form class="form-inline search-form clearfix" role="search">' +
        reminderMenuHtml +
        '<div class="pull-right">' +
        searchHtml +
        '<strong>Sort By:</strong> ' +
        '<select id="form-sort-' +
        containerId +
        '" class="form-control" style="width: 250px; line-height: 1rem;">' +
        sortOptionHtml +
        '</select>' +
        '<button id="form-order-' +
        containerId +
        '" class="btn btn-icon" type="button"><span class="glyphicon glyphicon-sort"></span></button>' +
        '</div>' +
        '</form>'
      // #endregion

      if (rows.length) {
        $container.append(sortBarHtml)
      }

      // Need to add event handlers for these controls inside this function so they have access to row
      // data
      var sortResults = function (newOption, switchOrder) {
        if (switchOrder) {
          order = order === 'asc' ? 'desc' : 'asc'
        }
        filteredRows = _.orderBy(filteredRows, options.sortOptions[newOption], order)
        render(filteredRows, 1)
      }

      $container.on('change', '#form-sort-' + containerId, function (e) {
        sortResults($(e.target).val(), false)
      })
      $container.on('click', '#form-order-' + containerId, function (e) {
        sortResults($(this).prev().val(), true)
        return false
      })
    }

    if (options.searchProperties) {
      var filterOperators = ['!=', '>=', '<=', '>', '<', '='] // sequence matters
      var formSearchId = '#form-search-' + containerId
      var defaultFields = options.searchProperties.default || []
      var searchResults = function (searchText, isQueryMode) {
        $('#form-sort-' + containerId).val('Paper_Number')

        // Currently only searching on note title if exists
        var filterFunc = function (row) {
          return defaultFields.some(function (field) {
            var value = _.get(row, field)
            return value && value.toString().toLowerCase().indexOf(searchText) !== -1
          })
        }

        if (searchText) {
          if (isQueryMode) {
            var filterResult = Webfield.filterCollections(
              rows,
              searchText.slice(1),
              filterOperators,
              options.searchProperties,
              'note.id'
            )
            if (filterResult.queryIsInvalid) $(formSearchId).addClass('invalid-value')
            filteredRows = filterResult.filteredRows
          } else {
            filteredRows = _.filter(rows, filterFunc)
          }
        } else {
          filteredRows = rows
        }
        selectedIds = []
        render(filteredRows, 1)
      }

      $(formSearchId).on('keyup', function (e) {
        var searchText = $(formSearchId).val().trim()
        var searchLabel = $(formSearchId).prevAll('strong:first').text()
        $(formSearchId).removeClass('invalid-value')

        if (searchText.startsWith('+')) {
          // filter query mode
          if (searchLabel === 'Search:') {
            $(formSearchId).prevAll('strong:first').text('Query:')
            $(formSearchId)
              .prevAll('strong:first')
              .after(
                $('<span/>', {
                  class: 'glyphicon glyphicon-info-sign',
                }).hover(function (e) {
                  $(e.target).tooltip({
                    title:
                      '<strong class="tooltip-title">Query Mode Help</strong>' +
                      '<p>' +
                      'In Query mode, you can enter an expression and hit ENTER to search.<br/>' +
                      'The expression consists of property of a paper and a value you would like to search.' +
                      '</p>' +
                      '<p>' +
                      'e.g. +number=5 will return the paper 5' +
                      '</p>' +
                      '<p>' +
                      'Expressions may also be combined with AND/OR.<br>' +
                      'e.g. +number=5 OR number=6 OR number=7 will return paper 5,6 and 7.<br>' +
                      'If the value has multiple words, it should be enclosed in double quotes.<br>' +
                      'e.g. +title="some title to search"</p><p>Braces can be used to organize expressions.<br>' +
                      'e.g. +number=1 OR ((number=5 AND number=7) OR number=8) will return paper 1 and 8.' +
                      '</p>' +
                      '<p>' +
                      'Operators available: ' +
                      filterOperators.join(', ') +
                      '</p>' +
                      '<p>' +
                      'Properties available: ' +
                      Object.keys(options.searchProperties)
                        .filter(function (k) {
                          return k !== 'default'
                        })
                        .join(', ') +
                      '</p>',
                    html: true,
                    placement: 'bottom',
                  })
                })
              )
          }

          if (e.key === 'Enter') {
            searchResults(searchText, true)
          }
        } else {
          if (searchLabel !== 'Search:') {
            $(formSearchId).prev().remove() // remove info icon

            $(formSearchId).prev().text('Search:')
          }

          _.debounce(function () {
            searchResults(searchText.toLowerCase(), false)
          }, 300)()
        }
      })

      $(container + ' form.search-form').on('submit', function () {
        return false
      })
    }

    render(rows, 1)
    registerHelpers()
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

  var newTaskList = function (invitations, options) {
    var taskDefaults = {
      container: '#notes',
      showTasks: true,
      showContents: true,
      referrer: null,
      emptyMessage: 'No outstanding tasks to display',
      apiV2: true,
    }
    options = _.defaults(options, taskDefaults)

    var dateOptions = {
      hour: 'numeric',
      minute: 'numeric',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      timeZoneName: 'long',
    }

    var allInvitations = invitations.sort(function (a, b) {
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

      if (!_.isEmpty(inv.details.replytoNote) || (inv.edit && inv.edit.note)) {
        inv.noteInvitation = true

        if (inv.details.repliedNotes?.length > 0) {
          inv.completed = true
        }
        inv.noteId =
          inv.details.repliedNotes?.length === 1
            ? inv.details.repliedNotes[0].id
            : inv.edit.note.replyto

        if (_.isEmpty(inv.details.replytoNote)) {
          // Some invitations returned by the API do not contain replytoNote
          inv.details.replytoNote = { forum: inv.edit.note.forum }
        }
      } else {
        inv.tagInvitation = true

        if (inv.minReplies && inv.details) {
          var repliedCount =
            (inv.details.repliedTags && inv.details.repliedTags.length) ||
            (inv.details.repliedEdges && inv.details.repliedEdges.length)
          if (repliedCount && repliedCount >= inv.minReplies) {
            inv.completed = true
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

  // Used by TMLR Journal consoles
  var eicTaskList = function (invitations, forumId, options) {
    var defaults = {
      referrer: '',
      showEditLink: false,
    }
    options = _.defaults(options, defaults)

    invitations = invitations || []

    var dateFormatOptions = {
      hour: 'numeric',
      minute: 'numeric',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      timeZoneName: 'long',
    }

    // Order by duedate
    invitations.sort(function (a, b) {
      return a.duedate - b.duedate
    })

    invitations.forEach(function (inv) {
      if (inv.cdate > Date.now()) {
        var startDate = new Date(inv.cdate)
        inv.startDateStr = startDate.toLocaleDateString('en-GB', dateFormatOptions)
      }

      var duedate = new Date(inv.duedate)
      inv.dueDateStr = duedate.toLocaleDateString('en-GB', dateFormatOptions)
      inv.dueDateStatus = getDueDateStatus(duedate)
      inv.groupId = inv.id.split('/-/')[0]
      inv.forumId = forumId
    })

    var renderTaskItem = function (inv) {
      return (
        '<li class="note ' +
        (inv.complete ? 'completed' : '') +
        '">' +
        '<h4><a href="/forum?id=' +
        inv.forumId +
        (inv.complete ? '' : '&invitationId=' + inv.id) +
        (options.referrer ? '&referrer=' + options.referrer : '') +
        '" target="_blank">' +
        view.prettyInvitationId(inv.id) +
        '</a></h4>' +
        (options.showEditLink ? '<a href="/invitation/edit?id=' + inv.id + '">Edit</a>' : '') +
        (inv.startDateStr
          ? '<p class="mb-1"><span class="duedate">Start: ' + inv.startDateStr + '</span></p>'
          : '') +
        '<p class="mb-1"><span class="duedate ' +
        inv.dueDateStatus +
        '">Due: ' +
        inv.dueDateStr +
        '</span></p>' +
        '<p class="mb-0">' +
        (inv.complete ? 'Complete' : 'Incomplete') +
        ', ' +
        inv.replies.length +
        ' ' +
        (inv.replies.length === 1 ? 'Reply' : 'Replies') +
        '</p>' +
        '</li>'
      )
    }

    var incompleteInvitations = invitations.filter((inv) => !inv.complete)
    var completedInvitations = invitations.filter((inv) => inv.complete)

    return (
      (invitations.length > 0 ? '<h4>Tasks:</h4>' : '') +
      '<ul class="list-unstyled submissions-list task-list eic-task-list mt-0 mb-0">' +
      incompleteInvitations.map(renderTaskItem).join('\n') +
      '</ul>' +
      (incompleteInvitations.length > 0 && completedInvitations.length > 0
        ? '<hr class="small" style="margin-top: 0.5rem;">'
        : '') +
      '<ul class="list-unstyled submissions-list task-list eic-task-list mt-0 mb-0">' +
      completedInvitations.map(renderTaskItem).join('\n') +
      '</ul>'
    )
  }

  var renderTasks = function (container, invitations, options) {
    var defaults = {
      emptyMessage: 'No outstanding tasks for this venue',
    }
    options = _.defaults(options, defaults)

    var tasksOptions = {
      container: container,
      emptyMessage: options.emptyMessage,
      referrer: options.referrer,
    }
    $(tasksOptions.container).empty()

    newTaskList(invitations, tasksOptions)
    $('.tabs-container a[href="#' + container + '"]')
      .parent()
      .show()
  }

  var sendFile = function (url, data, contentType, fieldName) {
    var baseUrl = window.OR_API_V2_URL ? window.OR_API_V2_URL : ''
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
        $('input.form-control.note_content_value_input.note_' + fieldName).val('')
      }
    })
  }

  var sendFileChunk = function (data, $progressBar) {
    var baseUrl = window.OR_API_V2_URL ? window.OR_API_V2_URL : ''
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

  var searchSubmissions = function (term, options) {
    var defaults = {
      pageSize: 100,
      offset: 0,
      invitation: null,
      venue: null,
      venueid: null,
    }
    options = _.assign(defaults, options)

    var searchParams = {
      term: term,
      type: 'terms',
      content: 'all',
      source: 'forum',
      limit: options.pageSize,
      offset: options.offset,
    }

    if (options.invitation) {
      searchParams.invitation = options.invitation
    }

    if (options.venueid) {
      searchParams.venueid = options.venueid
    }

    if (options.venue) {
      searchParams.venue = options.venue
    }

    return get('/notes/search', searchParams).then(function (result) {
      return result.notes
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
              var contentFieldValue = contentField.value
              if (_.isString(contentFieldValue)) {
                contentFieldValue = contentFieldValue.toLowerCase()
                if (contentFieldValue.indexOf(searchParams.term) !== -1) {
                  // indexOf works for both arrays and strings
                  foundTermMatch = true
                  break
                }
              }
              if (_.isArray(contentFieldValue)) {
                var found = _.some(contentFieldValue, function (value, searchParams) {
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
          if (_.isArray(noteContent?.subject_areas.value)) {
            // jshint ignore:line
            subjectAreas = noteContent.subject_areas.value // jshint ignore:line
          } else if (_.isArray(noteContent?.keywords)) {
            subjectAreas = noteContent.keywords.value
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
      return searchSubmissions(searchParams.term, {
        pageSize: searchParams.pageSize,
        invitation: searchParams.invitation,
        venue: searchParams.venue,
        venueid: searchParams.venueid,
      }).then(searchParams.onResults)
    }
  }

  var getGroupsByNumber = function (venueId, roleName, options) {
    var defaults = {
      numberToken: 'Paper',
      withProfiles: false,
    }
    options = _.defaults(options, defaults)

    var anonRoleName = roleName.slice(0, -1) + '_'
    var numberToken = options.numberToken
    var query = {
      prefix: venueId + '/' + numberToken + '.*',
      select: 'id,members',
      stream: true,
      domain: venueId,
    }
    if (options && options.assigned) {
      query.member = window.user.id
    }
    return get('/groups', query).then(function (result) {
      var groups = result.groups
      var paperGroups = []
      var anonPaperGroups = []
      var memberIds = []
      groups.forEach(function (group) {
        if (group.id.endsWith('/' + roleName)) {
          paperGroups.push(group)
          memberIds = memberIds.concat(
            group.members.filter(function (member) {
              return member.indexOf('~') === 0 || member.indexOf('@') > -1
            })
          )
        } else if (_.includes(group.id, '/' + anonRoleName)) {
          anonPaperGroups.push(group)
          memberIds = memberIds.concat(
            group.members.filter(function (member) {
              return member.indexOf('~') === 0 || member.indexOf('@') > -1
            })
          )
        }
      })

      var profileP = $.Deferred().resolve({ profiles: [] })
      if (options.withProfiles) {
        profileP = post('/profiles/search', { ids: _.uniq(memberIds) })
      }

      return profileP.then(function (result) {
        var profilesById = _.keyBy(result.profiles, 'id')
        var groupsByNumber = {}
        paperGroups.forEach(function (group) {
          var number = getNumberfromGroup(group.id, numberToken)
          var memberGroups = []
          group.members.forEach(function (member) {
            var anonGroup = anonPaperGroups.find(function (anonGroup) {
              return (
                anonGroup.id.startsWith(venueId + '/' + numberToken + number) &&
                (anonGroup.members[0] === member || anonGroup.id === member)
              )
            })
            var deanonymizedMember = anonGroup ? anonGroup.members[0] : member
            var profile = profilesById[deanonymizedMember]
            var profileInfo = {
              id: deanonymizedMember,
              name:
                deanonymizedMember.indexOf('~') === 0
                  ? view.prettyId(deanonymizedMember)
                  : deanonymizedMember,
              email: deanonymizedMember,
              allEmails: [deanonymizedMember],
              allNames: [deanonymizedMember],
            }
            if (profile) {
              profileInfo = {
                id: profile.id,
                name: (
                  _.find(profile.content.names, ['preferred', true]) ||
                  _.first(profile.content.names)
                ).fullname,
                allNames: _.map(
                  _.filter(profile.content.names, function (name) {
                    return name.username
                  }),
                  'username'
                ),
                email: profile.content.preferredEmail || profile.content.emailsConfirmed[0],
                allEmails: profile.content.emailsConfirmed,
                affiliation: profile.content.history && profile.content.history[0],
              }
            }
            memberGroups.push({
              id: deanonymizedMember,
              anonId: anonGroup && getNumberfromGroup(anonGroup.id, anonRoleName),
              name: profileInfo.name,
              email: profileInfo.email,
              anonymousGroupId: anonGroup && anonGroup.id,
            })
          })
          groupsByNumber[number] = memberGroups
        })
        return groupsByNumber
      })
    })
  }

  var getGroup = function (groupId, options) {
    var defaults = {
      withProfiles: false,
    }
    options = _.defaults(options, defaults)

    return get('/groups', { id: groupId, select: 'id,members', limit: 1 }).then(
      function (result) {
        var group = result.groups?.length > 0 ? result.groups[0] : null
        if (group && options.withProfiles) {
          return post('/profiles/search', { ids: group.members }).then(function (result) {
            var profilesById = _.keyBy(result.profiles, 'id')
            var groupWithProfiles = { id: group.id, members: [] }
            groupWithProfiles.members = group.members.map(function (id) {
              var profile = profilesById[id]
              if (profile) {
                return {
                  id: profile.id,
                  name: view.prettyId(
                    (
                      _.find(profile.content.names, ['preferred', true]) ||
                      _.first(profile.content.names)
                    ).username
                  ),
                  allNames: _.map(
                    _.filter(profile.content.names, function (name) {
                      return name.username
                    }),
                    'username'
                  ),
                  email: profile.content.preferredEmail || profile.content.emailsConfirmed[0],
                  allEmails: profile.content.emailsConfirmed,
                  affiliation: profile.content.history && profile.content.history[0],
                }
              } else {
                return {
                  id: id,
                  name: id.indexOf('~') === 0 ? view.prettyId(id) : id,
                  email: id,
                  allEmails: [id],
                  allNames: [id],
                }
              }
            })
            return groupWithProfiles
          })
        }
        return group
      }
    )
  }

  var renderInvitationButton = function (container, invitationId, options) {
    var defaults = {
      onNoteCreated: function () {
        // eslint-disable-next-line no-console
        console.warn('onNoteCreated option is required')
      },
    }
    options = _.assign(defaults, options)
    getInvitation(invitationId).then(function (invitation) {
      Webfield.ui.submissionButton(invitation, window.user, {
        container: container,
        onNoteCreated: options.onNoteCreated,
      })
    })
  }

  var renderTabPanel = function (container, titles) {
    var loadingMessage = '<p class="empty-message">Loading...</p>'
    var tabsList = []
    titles.forEach(function (title) {
      tabsList.push({
        heading: title,
        id: title.replace(/\s/g, '-').toLowerCase(),
        content: loadingMessage,
        extraClasses: 'horizontal-scroll',
      })
    })

    Webfield.ui.tabPanel(tabsList, { container: container })
  }

  var setup = function (container, venueId, options) {
    var defaults = {
      title: venueId,
      instructions: 'Instructions here',
      tabs: [],
      referrer: null,
      showBanner: true,
      fullWidth: false,
    }
    options = _.defaults(options, defaults)

    // if (options.showBanner) {
    //   if (options.referrer) {
    //     OpenBanner.referrerLink(options.referrer)
    //   } else {
    //     OpenBanner.venueHomepageLink(venueId)
    //   }
    // }

    Webfield.ui.setup(container, venueId)
    Webfield.ui.header(options.title, options.instructions, { fullWidth: options.fullWidth })

    if (options.tabs.length) {
      renderTabPanel('#notes', options.tabs)
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
        venueid: null,
        subjectAreas: null,
        subjectAreaDropdown: 'advanced',
        pageSize: 1000,
        placeholder: 'Search by paper title and metadata',
        onResults: function () {},
        onReset: function () {},
      },
      displayOptions: Webfield.defaultDisplayOptions,
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
    // eslint-disable-next-line wrap-iife
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

        if (_.has(tagInvitation, 'reply.' + fieldName + '.const')) {
          return tagInvitation.reply[fieldName].const
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
        } else if (_.has(tagInvitation, 'reply.' + fieldName + '.regex')) {
          return _.compact(
            _.map(tagInvitation.reply[fieldName].regex.split('|'), function (value) {
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
          var errorText = Webfield.getErrorFromJqXhr(jqXhr, textStatus)
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

        var values = tagInvitation.reply.content.tag.enum.map(function (v) {
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
                var errorText = Webfield.getErrorFromJqXhr(jqXhr, textStatus)
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
            var errorText = Webfield.getErrorFromJqXhr(jqXhr, textStatus)
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

    // TODO: support action buttons in noteBasicV2 template
    // if (options.displayOptions.showActionButtons) {
    //   Webfield._registerActionButtonHandlersV2(
    //     $container, notes, Handlebars.templates['partials/noteBasic'], options
    //   );
    // }

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

  var renderSubmissionList = function (container, invitation, notes, count, options) {
    var defaults = {
      paperDisplayOptions: {},
      pageSize: 50,
      query: {},
      localSearch: false,
    }

    options = _.defaults(options, defaults)

    $(container).empty()

    var searchResultsListOptions = _.assign({}, options.paperDisplayOptions, {
      container: container,
      autoLoad: false,
    })

    submissionList(notes, {
      heading: null,
      container: container,
      search: {
        enabled: true,
        localSearch: options.localSearch,
        invitation: invitation,
        venue: options.query['content.venue'],
        venueid: options.query['content.venueid'],
        onResults: function (searchResults) {
          Webfield.ui.searchResults(searchResults, searchResultsListOptions)
        },
        onReset: function () {
          Webfield.ui.searchResults(notes, searchResultsListOptions)
          $(container).append(view.paginationLinks(count, options.pageSize, 1))
        },
      },
      displayOptions: options.paperDisplayOptions,
      autoLoad: false,
      noteCount: count,
      pageSize: options.pageSize,
      onPageClick: function (offset) {
        return getSubmissions(
          invitation,
          _.assign(options.query, {
            details: 'replyCount',
            pageSize: options.pageSize,
            offset: offset,
          })
        )
      },
      fadeIn: false,
    })
  }

  var getInvitationId = function (venueId, number, name, options) {
    var defaults = {
      submissionGroupName: 'Paper',
    }
    options = _.defaults(options, defaults)

    if (options.prefix) {
      return (
        venueId +
        '/' +
        options.submissionGroupName +
        number +
        '/' +
        options.prefix +
        '/-/' +
        name
      )
    }
    return venueId + '/' + options.submissionGroupName + number + '/-/' + name
  }

  var getRepliesfromSubmission = function (venueId, submission, name, options) {
    return submission.details.replies.filter(function (reply) {
      return reply.invitations.includes(
        getInvitationId(venueId, submission.number, name, options)
      )
    })
  }

  var renderEdgeWidget = function (container, invitation, options) {
    var defaults = {
      fieldName: 'weight',
    }
    options = _.defaults(options, defaults)
    var $tagWidget = view.mkTagInput(
      '_',
      {
        'value-dropdown': invitation.edge[options.fieldName].param.enum,
      },
      invitation.details.repliedEdges.map(function (e) {
        return { id: e.id, tag: e[options.fieldName] }
      }),
      {
        placeholder: invitation.edge[options.fieldName].param.default,
        label: view.prettyInvitationId(invitation.id),
        readOnly: false,
        onChange: function (id, value, deleted, done) {
          var body = {
            head: invitation.edge.head.param.const,
            tail: window.user.profile.id,
            signatures: [window.user.profile.id],
            invitation: invitation.id,
          }
          if (id) {
            body.id = id
          }
          if (deleted) {
            body.ddate = Date.now()
          }
          if (options.fieldName === 'weight') {
            body.weight = Number.parseInt(value, 10)
          }
          if (options.fieldName === 'label') {
            body.label = value
          }
          $('.tag-widget button').attr('disabled', true)
          post('/edges', body)
            .then(function (result) {
              done({
                id: result.id,
                tag: result[options.fieldName],
              })
              $('.tag-widget button').attr('disabled', false)
            })
            .fail(function (error) {
              promptError(error || 'The specified tag could not be updated')
              $('.tag-widget button').attr('disabled', false)
            })
        },
      }
    )
    $(container).append($tagWidget)
  }

  return {
    // Deprecated: All API functions have been moved to Webfield.api
    get: get,
    post: post,
    put: put,
    delete: xhrDelete,
    getAll: getAll,
    sendFile: sendFile,
    sendFileChunk: sendFileChunk,
    setToken: setToken,
    getErrorFromJqXhr: Webfield.getErrorFromJqXhr,

    api: {
      get: get,
      post: post,
      put: put,
      delete: xhrDelete,
      getAll: getAll,
      getInvitation: getInvitation,
      getSubmissions: getSubmissions,
      getAllSubmissions: getAllSubmissions,
      getGroupsByNumber: getGroupsByNumber,
      getAssignedInvitations: getAssignedInvitations,
      getGroup: getGroup,
      sendFile: sendFile,
    },

    ui: {
      renderInvitationButton: renderInvitationButton,
      renderTable: renderTable,
      renderTasks: renderTasks,
      renderSubmissionList: renderSubmissionList,
      renderEdgeWidget: renderEdgeWidget,
      setup: setup,
      submissionList: submissionList,
      eicTaskList: eicTaskList,
      errorMessage: Webfield.ui.errorMessage,
      done: Webfield.ui.done,
    },

    utils: {
      getPaperNumbersfromGroups: getPaperNumbersfromGroups,
      getNumberfromGroup: getNumberfromGroup,
      getInvitationId: getInvitationId,
      getRepliesfromSubmission: getRepliesfromSubmission,
    },
  }
})()
