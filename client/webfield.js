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

module.exports = (function() {
  // Save authentication token as a private var
  var token;

  // AJAX Functions
  var get = function(url, queryObj, options) {
    var defaults = {
      handleErrors: true,
      cache: true // Note: IE won't get updated when cache is enabled
    };
    options = _.defaults(options, defaults);
    var defaultHeaders = { 'Access-Control-Allow-Origin': '*' }
    var authHeaders =  token ? { Authorization: 'Bearer ' + token } : {};
    var baseUrl = window.OR_API_URL ? window.OR_API_URL : '';
    var errorCallback = options.handleErrors ? jqErrorCallback : null;

    return $.ajax({
      cache: options.cache,
      dataType: 'json',
      type: 'get',
      contentType: 'application/x-www-form-urlencoded; charset=UTF-8',
      url: baseUrl + url,
      data: queryObj,
      headers: Object.assign(defaultHeaders, authHeaders),
      xhrFields: {
        withCredentials: true
      }
    }).then(jqSuccessCallback, errorCallback);
  };

  var post = function(url, queryObj, options) {
    var defaults = {
      handleErrors: true,
    };
    options = _.defaults(options, defaults);
    var defaultHeaders = { 'Access-Control-Allow-Origin': '*' }
    var authHeaders =  token ? { Authorization: 'Bearer ' + token } : {};
    var baseUrl = window.OR_API_URL ? window.OR_API_URL : '';
    var errorCallback = options.handleErrors ? jqErrorCallback : null;

    return $.ajax({
      cache: false,
      dataType: 'json',
      type: 'post',
      contentType: 'application/json; charset=UTF-8',
      url: baseUrl + url,
      data: JSON.stringify(queryObj),
      headers: Object.assign(defaultHeaders, authHeaders),
      xhrFields: {
        withCredentials: true
      }
    }).then(jqSuccessCallback, errorCallback);
  };

  var put = function(url, queryObj, options) {
    var defaults = {
      handleErrors: true,
    };
    options = _.defaults(options, defaults);
    var defaultHeaders = { 'Access-Control-Allow-Origin': '*' }
    var authHeaders =  token ? { Authorization: 'Bearer ' + token } : {};
    var baseUrl = window.OR_API_URL ? window.OR_API_URL : '';
    var errorCallback = options.handleErrors ? jqErrorCallback : null;

    return $.ajax({
      cache: false,
      dataType: 'json',
      type: 'put',
      contentType: 'application/json; charset=UTF-8',
      url: baseUrl + url,
      data: JSON.stringify(queryObj),
      headers: Object.assign(defaultHeaders, authHeaders),
      xhrFields: {
        withCredentials: true
      }
    }).then(jqSuccessCallback, errorCallback);
  };

  var xhrDelete = function(url, queryObj, options) {
    var defaults = {
      handleErrors: true,
    };
    options = _.defaults(options, defaults);
    var defaultHeaders = { 'Access-Control-Allow-Origin': '*' }
    var authHeaders =  token ? { Authorization: 'Bearer ' + token } : {};
    var baseUrl = window.OR_API_URL ? window.OR_API_URL : '';
    var errorCallback = options.handleErrors ? jqErrorCallback : null;

    return $.ajax({
      cache: false,
      dataType: 'json',
      type: 'delete',
      contentType: 'application/json; charset=UTF-8',
      url: baseUrl + url,
      data: JSON.stringify(queryObj),
      headers: Object.assign(defaultHeaders, authHeaders),
      xhrFields: {
        withCredentials: true
      }
    }).then(jqSuccessCallback, errorCallback);
  };

  var getAll = function(url, queryObjParam, resultsKey) {
    const queryObj = {...queryObjParam};
    queryObj.limit = Math.min(queryObj.limit || 1000, 1000);
    var offset = queryObj.offset || 0;

    if (!resultsKey) {
      if (url.indexOf('notes') !== -1) {
        resultsKey = 'notes';
      } else if (url.indexOf('groups') !== -1) {
        resultsKey = 'groups';
      } else if (url.indexOf('profiles') !== -1) {
        resultsKey = 'profiles';
      } else if (url.indexOf('invitations') !== -1) {
        resultsKey = 'invitations';
      } else if (url.indexOf('tags') !== -1) {
        resultsKey = 'tags';
      } else if (url.indexOf('edges') !== -1) {
        resultsKey = 'edges';
      } else {
        return $.Deferred().reject('Unknown API endpoint');
      }
    }

    return get(url, Object.assign({}, queryObj, { offset: offset }))
      .then(function(results) {
        if (!results || !results[resultsKey]) {
          return [];
        }

        var initialResults = results[resultsKey];
        var totalCount = results.count || initialResults.length;
        if (!totalCount) {
          return [];
        }

        if (totalCount - initialResults.length <= 0) {
          return initialResults;
        } else {
          var offsetList = _.range(offset + queryObj.limit, totalCount, queryObj.limit);
          var remainingRequests = offsetList.map(function(n) {
            return get(url, Object.assign({}, queryObj, { offset: n }));
          });
          return $.when.apply($, remainingRequests)
            .then(function() {
              var rest = _.compact(_.flatMap(arguments, resultsKey));
              return initialResults.concat(rest);
            });
        }
      });
  };

  var jqSuccessCallback = function(response) {
    return response;
  };

  var jqErrorCallback = function(jqXhr, textStatus, errorThrown) {
    console.warn('Xhr Error: ' + errorThrown + ': ' + textStatus);
    console.warn('jqXhr: ' + JSON.stringify(jqXhr, null, 2));

    var errorText = getErrorFromJqXhr(jqXhr, textStatus);
    var errorName = jqXhr.responseJSON?.name || jqXhr.responseJSON?.errors?.[0]?.type;
    var errorDetails = jqXhr.responseJSON?.details || jqXhr.responseJSON?.errors?.[0];
    var notSignatoryError = errorName === 'NotSignatoryError' && _.startsWith(errorDetails.user, 'guest_');
    var forbiddenError = errorName === 'ForbiddenError' && _.startsWith(errorDetails.user, 'guest_');

    if (errorText === 'User does not exist') {
      location.reload(true);
    } else if (notSignatoryError || forbiddenError) {
      location.href = '/login?redirect=' + encodeURIComponent(
        location.pathname + location.search + location.hash
      );
    } else {
      promptError(errorText);
    }

    return errorText;
  };

  var getErrorFromJqXhr = function(jqXhr, textStatus) {
    if (textStatus === 'timeout') {
      // If the request timed out, display a special message
      return 'OpenReview is currently under heavy load. Please try again soon.';
    }

    return jqXhr.responseJSON?.message || 'Something went wrong';
  };

  var setToken = function(newAccessToken) {
    token = newAccessToken;
  };

  var sendFile = function(url, data, contentType) {
    var baseUrl = window.OR_API_URL ? window.OR_API_URL : '';
    var defaultHeaders = { 'Access-Control-Allow-Origin': '*' }
    var authHeaders =  token ? { Authorization: 'Bearer ' + token } : {};
    return $.ajax({
      url: baseUrl + url,
      type: 'put',
      cache: false,
      dataType: 'json',
      processData: false,
      contentType: contentType ? contentType : false,
      data: data,
      headers:  Object.assign(defaultHeaders, authHeaders),
      xhrFields: {
        withCredentials: true
      }
    }).fail(function(jqXhr, textStatus, errorThrown) {
      console.warn('Xhr Error: ' + errorThrown + ': ' + textStatus);
      console.warn('jqXhr: ' + JSON.stringify(jqXhr, null, 2));
    });
  };

  // API Functions
  var getSubmissionInvitation = function(invitationId, options) {
    var defaults = {
    };
    options = _.assign(defaults, options);

    // Don't use the Webfield get function so the fail callback can be overridden
    return get('/invitations', { id: invitationId }, { handleErrors: false })
      .then(function(result) {
        if (result.invitations.length) {
          return result.invitations[0];
        }
        return null;
      }, function() {
        // In case of error return null, but continue the promise chain
        return $.Deferred().resolve(null);
      });
  };

  var getSubmissions = function(invitationId, options) {
    // Any url param accepted by /notes can be passed in via the options object
    var defaults = {
      details: 'replyCount,invitation,tags',
      pageSize: 100,
      offset: 0,
      includeCount: false
    };
    options = _.defaults(options, defaults);

    var query = _.omit(options, ['pageSize', 'includeCount']);
    query.limit = options.pageSize;
    query.invitation = invitationId;

    return get('/notes', query)
      .then(function(result) {
        if (options.includeCount) {
          return result;
        } else {
          return result.notes;
        }
      });
  };

  var searchSubmissions = function(groupId, term, options) {
    var defaults = {
      pageSize: 100,
      offset: 0,
      invitation: null
    };
    options = _.assign(defaults, options);

    var searchParams = {
      term: term,
      type: 'terms',
      content: 'all',
      source: 'forum',
      group: groupId,
      limit: options.pageSize,
      offset: options.offset,
    };

    if (options.invitation) {
      searchParams.invitation = options.invitation;
    }

    if (options.venue) {
      searchParams.venue = options.venue;
    }

    return get('/notes/search', searchParams)
      .then(function(result) {
        return result.notes;
      });
  };

  var getTagInvitations = function(replyInvitation) {
    var urlParams = {
      replyInvitation: replyInvitation,
      tags: true
    };

    return get('/invitations', urlParams)
      .then(function(result) {
        return result.invitations;
      });
  };


  // Utility Functions
  var filterNotes = function(allNotes, searchParams) {
    if (searchParams.localSearch) {
      // Search notes locally
      var matchingNotes = [];
      var searchFields = ['title', 'abstract', 'TL;DR', 'keywords'];
      var searchSubject = _.toLower(searchParams.subject);

      for (var i = 0; i < allNotes.length; i++) {
        var noteContent = allNotes[i].content;
        var foundTermMatch = true;
        if (searchParams.term) {
          foundTermMatch = false;
          for (var j = 0; j < searchFields.length; j++) {
            var contentField = noteContent[searchFields[j]];
            if (contentField) {
              if (_.isString(contentField)) {
                contentField = contentField.toLowerCase();
                if (contentField.indexOf(searchParams.term) !== -1) {
                  // indexOf works for both arrays and strings
                  foundTermMatch = true;
                  break;
                }
              }
              if (_.isArray(contentField)) {
                var found = _.some(contentField, function(value, searchParams) {
                  return value.toLowerCase().indexOf(searchParams.term) !== -1;
                });
                if (found) {
                  foundTermMatch = true;
                  break;
                }
              }
            }
          }
        }

        var foundSubjectMatch = true;
        if (searchSubject) {
          var subjectAreas = [];
          if (_.isArray(noteContent.subject_areas)) { // jshint ignore:line
            subjectAreas = noteContent.subject_areas; // jshint ignore:line
          } else if (_.isArray(noteContent.keywords)) {
            subjectAreas = noteContent.keywords;
          }
          foundSubjectMatch = _.includes(subjectAreas.map(_.toLower), searchSubject);
        }

        if (foundTermMatch && foundSubjectMatch) {
          matchingNotes.push(allNotes[i]);
        }
      }

      return searchParams.onResults(matchingNotes);
    } else {
      // Use search API
      var groupId = $('#group-container').data('groupId') || $('#invitation-container').data('groupId');
      if (searchParams.subject) {
        searchParams.term += ' ' + searchParams.subject;
        searchParams.term = searchParams.term.trim();
      }
      return searchSubmissions(groupId, searchParams.term, {pageSize: searchParams.pageSize, invitation: searchParams.invitation, venue: searchParams.venue})
        .then(searchParams.onResults);
    }
  };


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
    emptyMessage: 'No papers to display at this time'
  };

  var dateOptions = {
    hour: 'numeric', minute: 'numeric', day: '2-digit', month: 'short', year: 'numeric', timeZoneName: 'long'
  };

  var getDueDateStatus = function(date) {
    var day = 24 * 60 * 60 * 1000;
    var diff = Date.now() - date.getTime();

    if (diff > 0) {
      return 'expired';
    }
    if (diff > -3 * day) {
      return 'warning';
    }
    return '';
  };

  var defaultEmptyMessage = function(groupId) {
    return [
      'var container = $(\'#group-container\').length ? $(\'#group-container\') : $(\'#invitation-container\');',
      'Webfield.ui.setup(container, \'' + groupId + '\');',
      'Webfield.ui.header(\'' + view.prettyId(groupId) + '\').append(\'<p><em>Nothing to display</em></p>\');',
    ].join('\n');
  };

  var setup = function(container, groupId) {
    $(container).empty().append(
      '<div id="header"></div>',
      '<div id="invitation"></div>',
      '<div id="notes"></div>'
    );

    if (groupId) {
      $(container).data('groupId', groupId);
    }
  };

  var basicHeader = function(title, instructions, options) {
    var defaults = {
      container: '#header',
      underline: false
    };
    options = _.defaults(options, defaults);

    var $container = $(options.container);
    $container.html('<h1>' + title + '</h1>');

    if (instructions) {
      $container.append('<div class="description">' + instructions + '</div>');
    }
    if (options.underline) {
      $container.append('<hr class="spacer">');
    }
    return $container;
  };

  var venueHeader = function(venueInfo, options) {
    var defaults = {
      container: '#header',
      showInfoLink: false
    };
    options = _.defaults(options, defaults);

    if (venueInfo.website && !venueInfo.website.startsWith('http')) {
      venueInfo.website = 'http://' + venueInfo.website
    }
    if (options.showInfoLink) {
      venueInfo.groupInfoLink = window.location.pathname + '?' +
        serializeUrlParams(_.assign(parseUrlParams(window.location.search), { mode: 'info' }));
    }

    var $container = $(options.container);
    $container.hide()
      .html(Handlebars.templates.venueHeader(venueInfo))
      .addClass('venue-header');
    return $container.fadeIn().promise();
  };

  var linksList = function(linksArr, options) {
    var defaults = {
      jsLinks: true,
      container: '#notes'
    };
    options = _.defaults(options, defaults);

    var linksHtml = '<ul class="list-unstyled venues-list">' + _.map(linksArr, function(link) {
      if (link.type === 'divider') {
        return '<li>&nbsp;</li>';
      }
      return '<li><a href="' + link.url + '">' + link.name + '</a></li>';
    }).join('\n') + '</ul>';

    var $container = $(options.container);
    $container.append(linksHtml);
  };

  var accordion = function(contentArr, options) {
    var defaults = {
      html: true,
      id: 'accordion-' + Math.floor(Math.random() * 1000),
      collapsed: true,
      extraClasses: '',
      container: '#notes'
    };
    options = _.defaults(options, defaults);

    if (!contentArr || !contentArr.length) {
      return;
    }

    var accordionHtml = Handlebars.templates['partials/accordion']({
      sections: contentArr,
      options: options
    });
    var $container = $(options.container);
    $container.append(accordionHtml);
  };

  var invitationButtonAndNoteEditor = function(invitationData, user, options) {
    var defaults = {
      container: '#invitation',
      largeLabel: true,
      onNoteCreated: function() { console.warn('onNoteCreated option is required'); },
    };
    options = _.assign(defaults, options);

    var $container = $(options.container);
    var onClick = function() {
      // Toggle new note form, or prompt user to login if they aren't already
      if (!user || _.startsWith(user.id, 'guest_')) {
        promptLogin(user);
        return;
      }

      if ($('.note_editor', $container).length) {
        $('.note_editor', $container).slideUp('normal', function() {
          $(this).remove();
        });
        return;
      }
      var newNoteEditorFn = invitationData.edit ? view2.mkNewNoteEditor : view.mkNewNoteEditor;
      newNoteEditorFn(invitationData, null, null, user, {
        onCompleted: function($editor) {
          if (!$editor) return;
          $editor.hide();
          $container.append($editor);
          $editor.slideDown();
        },
        onNoteCreated: options.onNoteCreated
      });
    };
    $container.hide().append(view.mkInvitationButton(invitationData, onClick, options));

    return $container.fadeIn().promise();
  };

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
    let query = queryParam.trim()
    const tokens = [...query]
    for (let i = 0; i < tokens.length; i++) {
      const t = tokens[i];
      if (t === 'A') {
        if (`A${tokens[i + 1]}${tokens[i + 2]}` === 'AND') {
          if (middleOfOperand) {
            currentOperand += 'AND'
            i = i + 2
            continue
          } else {
            if (stuffInBrackets.length) {
              return new TreeNode('AND', queryToTree(stuffInBrackets), queryToTree(query.slice(i + 3)))
            } else {
              return new TreeNode('AND', currentOperand, queryToTree(query.slice(i + 3)))
            }
          }
        } else {
          currentOperand ? currentOperand += t : currentOperand = t
          continue
        }
      }
      if (t === 'O') {
        if (`O${tokens[i + 1]}` === 'OR') {
          if (middleOfOperand) {
            currentOperand += 'OR'
            i = i + 1
            continue
          } else {
            if (stuffInBrackets.length) {
              return new TreeNode('OR', queryToTree(stuffInBrackets), queryToTree(query.slice(i + 2)))
            } else {
              return new TreeNode('OR', currentOperand, queryToTree(query.slice(i + 2)))
            }
          }
        } else {
          currentOperand ? currentOperand += t : currentOperand = t
          continue
        }
      }
      else if (t === '(') {
        if (middleOfOperand) {
          currentOperand += t
        } else {
          const lengthToRightBracket = getRightBracketIndex(query.slice(i + 1))
          stuffInBrackets = query.slice(i + 1, i + lengthToRightBracket + 1)
          i = i + lengthToRightBracket + 1
          if (i === query.length - 1) return queryToTree(query.slice(1, -1))//no more expression
          continue
        }
      }
      else if (t === '"' || t==="'") {
        middleOfOperand = !middleOfOperand
      } else {
        currentOperand ? currentOperand += t : currentOperand = t
      }
    }
    return currentOperand
  }

  //find index of match right bracket
  const getRightBracketIndex = (remainingQuery) => {
    let bracketLevel = 0
    let middleOfOperand = false
    const tokens = [...remainingQuery]
    for (let i = 0; i < tokens.length; i++) {
      const t = tokens[i];
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

  const filterTreeNode = (collections, treeNode, filterOperators, propertiesAllowed, uniqueIdentifier) => {
    if (treeNode instanceof TreeNode) {
      return combineResults(
        filterTreeNode(collections, treeNode.left, filterOperators, propertiesAllowed, uniqueIdentifier),
        filterTreeNode(collections, treeNode.right, filterOperators, propertiesAllowed, uniqueIdentifier),
        treeNode.value, uniqueIdentifier
      )
    }
    // single expression
    return filterOneOperand(collections, treeNode, filterOperators, propertiesAllowed)
  }

  // extract property to search, the expected value and how the value should be compared
  // like =,>,< from string of filtering criteria
  const operandToPropertyValue = (operandPram, filterOperators) => {
    const operand = operandPram.trim()
    const filterOperator = filterOperators.find(p => operand.includes(p))
    if (!filterOperator) throw new Error('operator is invalid')
    const [property, value] = operand.split(filterOperator)
    return {
      property:property.trim(), value: value.replace(/"/g, '').trim(), filterOperator
    }
  }

  const evaluateOperator = (operator, propertyValue, targetValue) => {
    // propertyValue can be number/array/string/obj
    let isString = false
    if (propertyValue === null || propertyValue === undefined || targetValue === null || targetValue === undefined) return false
    if (typeof (targetValue) === 'number' && propertyValue === 'N/A') propertyValue = 0
    if (typeof (propertyValue) === 'object' && !Array.isArray(propertyValue)) { // reviewers are objects
      propertyValue = [
        ...Object.values(propertyValue).map(p => p.name),
        ...Object.values(propertyValue).map(p => p.email)
      ]
      targetValue = targetValue.toString().toLowerCase()
    }
    if (!(typeof (propertyValue) === 'number' && typeof (targetValue) === 'number') && !Array.isArray(propertyValue)) {
      propertyValue = propertyValue.toString().toLowerCase()
      targetValue = targetValue.toString().toLowerCase()
      isString = true
    }
    const allowGreaterLessComparison = !(typeof propertyValue === 'string' && typeof targetValue === 'string')
    switch (operator) {
      case '=':
        if (Array.isArray(propertyValue)) return propertyValue.some(p => p.toString().toLowerCase().includes(targetValue.toString().toLowerCase()))
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
        if (Array.isArray(propertyValue)) return !propertyValue.some(p => p.toString().toLowerCase().includes(targetValue.toString().toLowerCase()))
        return propertyValue !== targetValue
      default:
        throw new Error('operator is invalid')
    }
  }

  // filter a collection by 1 filter criteria
  const filterOneOperand = (collections, operand, filterOperators, propertiesAllowed) => {
    if (!operand || operand.trim().length === 0) return null
    const { property, value, filterOperator } = operandToPropertyValue(operand, filterOperators)
    if (!propertiesAllowed[property]) throw new Error('property is invalid')
    const propertyPath = propertiesAllowed[property].length === 0
      ? [property] // not a nested property
      : propertiesAllowed[property].map(p => p.split('.')) // has dot or match multiple properties

    const convertedValue = isNaN(Number(value))?value:Number(value)
    return collections.filter(p => {
      if (propertyPath.length === 1) {
        return evaluateOperator(filterOperator, propertyPath[0].reduce((r, s) => r?.[s], p), convertedValue)
      }
      return propertyPath.map(q => q.reduce((r, s) => r?.[s], p))
        .some(t => evaluateOperator(filterOperator, t, convertedValue))
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
    const propertyPath = uniqueIdentifier.includes('.') ? uniqueIdentifier.split('.') : [uniqueIdentifier]
    switch (operator) {
      case 'OR':
        return [...new Set([...collection1, ...collection2])]
      case 'AND':
        const collection2UniqueIdentifiers = collection2.map(p => propertyPath.reduce((r, s) => r?.[s], p))
        return collection1.filter(p => collection2UniqueIdentifiers.includes(propertyPath.reduce((r, s) => r?.[s], p)))
      default:
        return []
    }
  }

  const filterCollections = (collections, filterString, filterOperators, propertiesAllowed, uniqueIdentifier) => {
    try {
      const syntaxTree = queryToTree(filterString)
      const filterResult = filterTreeNode(collections, syntaxTree, filterOperators, propertiesAllowed, uniqueIdentifier)
      return { filteredRows: filterResult }
    } catch (error) {
      return { filteredRows: collections, queryIsInvalid: true }
    }
  }

  // Deprecated
  var invitationForm = function(invitationData, user, options) {
    var defaults = {
      container: '#invitation',
      largeLabel: true,
      onNoteCreated: function() { console.warn('onNoteCreated option is required'); },
    };
    options = _.assign(defaults, options);

    var $container = $(options.container);
    view.mkNewNoteEditor(invitationData, null, null, user, {
      onCompleted: function($editor) {
        if (!$editor) return;
        $editor.hide();
        $editor.children().eq(3).hide();
        $editor.children().eq(4).hide();
        $container.append($editor);
        $editor.slideDown();
      },
      onNoteCreated: options.onNoteCreated
    });
  };

  // Deprecated
  var singleNote = function(note, options) {
    var defaults = {
      container: '#notes',
      displayOptions: defaultDisplayOptions,
      fadeIn: true,
      forumDate: '1234',
      creationDate: 'abcd',
    };
    options = _.defaultsDeep(options, defaults);

    var $container = $(options.container);

    $container.append(Handlebars.templates['components/singleNote']({
      note: note,
      options: options.displayOptions,
      forumDate: options.forumDate,
      creationDate: options.creationDate
    }));

    return $container;
  };

  var submissionList = function(notes, options) {
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
        onResults: function() {},
        onReset: function() {}
      },
      displayOptions: defaultDisplayOptions,
      autoLoad: true,
      noteCount: null,
      onNoteEdited: null,
      onNoteTrashed: null,
      onNoteRestored: null,
      pageSize: null,
      fadeIn: true
    };
    options = _.defaultsDeep(options, defaults);

    var $container = $(options.container);
    if (options.fadeIn) {
      $container.hide();
    }

    if (_.isEmpty(notes)) {
      // Don't show search bar if there are no notes to display
      options.search.enabled = false;
    }

    // Add any data to note object that the template might need, such as note-specific
    // tag invitations
    var allTagInvitations = options.displayOptions.tagInvitations;
    var includeTagInvitations = options.displayOptions.showTags && allTagInvitations && allTagInvitations.length;
    var noteSpecificTagInvitations = {};
    var generalTagInvitations = [];
    if (includeTagInvitations) {
      for (var i = 0; i < allTagInvitations.length; i++) {
        var inv = allTagInvitations[i];
        var invReplyForum = _.get(inv, 'reply.forum');
        if (invReplyForum) {
          if (!noteSpecificTagInvitations.hasOwnProperty(invReplyForum)) {
            noteSpecificTagInvitations[invReplyForum] = [];
          }
          noteSpecificTagInvitations[invReplyForum].push(inv);
        } else {
          generalTagInvitations.push(inv);
        }
      }
      options.displayOptions.tagInvitations = generalTagInvitations;
    }

    var now = Date.now();
    for (var j = 0; j < notes.length; j++) {
      notes[j].isDeleted = notes[j].ddate && notes[j].ddate < now;

      if (includeTagInvitations) {
        notes[j].details.tagInvitations = noteSpecificTagInvitations[notes[j].id] || [];
      }
    }

    // If there is a custom default sort order sort notes before displaying
    if (options.search.enabled && options.search.sort) {
      var customSort = _.find(options.search.sort, 'default');
      if (customSort) {
        notes = _.sortBy(notes, customSort.compareProp);
      }
    }

    // Wrap in IIFE to prevent memory leaks
    (function() {
      var submissionListHtml = Handlebars.templates['components/submissions']({
        heading: options.heading,
        notes: options.pageSize ? notes.slice(0, options.pageSize) : notes,
        search: options.search,
        options: options.displayOptions
      });

      // Remove existing submission list and search form
      if (options.emptyContainer) {
        $container.html(submissionListHtml);
      } else {
        $container.append(submissionListHtml);
      }
    })();

    if (options.search.enabled) {
      if (!_.isEmpty(options.search.subjectAreas)) {
        // Add subject area dropdown to search form (if it's enabled)
        var subjectAreaFilter = function(update, prefix) {
          var $formElem = $(this).closest('form.notes-search-form');
          var subjectDropdownVal = $formElem.find('.subject-area-dropdown input').val();
          if (prefix === '' && !subjectDropdownVal) {
            update(options.search.subjectAreas);

            var term = $formElem.find('.search-content input').val().trim().toLowerCase();
            if (term) {
              filterNotes(notes, {
                term: term,
                pageSize: options.search.pageSize,
                invitation: options.search.invitation,
                venue: options.search.venue,
                onResults: options.search.onResults,
                localSearch: options.search.localSearch
              });
            } else {
              options.search.onReset();
            }
          } else if (prefix) {
            prefix = prefix.trim().toLowerCase();
            update(_.filter(options.search.subjectAreas, function(subject) {
              return subject.toLowerCase().indexOf(prefix) !== -1;
            }));
          }
        };

        var subjectAreaSelected = function(selectedSubject, subjectId, focus) {
          if (selectedSubject && !focus) {
            var $formElem = $(this).closest('form.notes-search-form');
            var term = $formElem.find('.search-content input').val().trim().toLowerCase();

            if (selectedSubject === 'All' && !term) {
              options.search.onReset();
            } else {
              filterNotes(notes, {
                term: term,
                pageSize: options.search.pageSize,
                subject: selectedSubject,
                invitation: options.search.invitation,
                venue: options.search.venue,
                onResults: options.search.onResults,
                localSearch: options.search.localSearch
              });
            }
          }
        };

        if (options.search.subjectAreaDropdown === 'advanced') {
          $container.find('form.notes-search-form .subject-area').append(view.mkDropdown(
            'Enter a subject area to filter by',
            false,
            '',
            _.debounce(subjectAreaFilter, 300),
            _.debounce(subjectAreaSelected, 300),
            'subject-area-dropdown show-arrow'
          ));
        } else if (options.search.subjectAreaDropdown === 'basic') {
          $container.on('change', 'form.notes-search-form .subject-area-dropdown', function(e) {
            var selectedSubject = $(this).val().toLowerCase();
            var term = $(this).closest('form.notes-search-form')
              .find('.search-content input')
              .val().trim().toLowerCase();

            if (!selectedSubject && !term) {
              options.search.onReset();
              return;
            }

            filterNotes(notes, {
              term: term,
              pageSize: options.search.pageSize,
              subject: selectedSubject,
              invitation: options.search.invitation,
              venue: options.search.venue,
              onResults: options.search.onResults,
              localSearch: options.search.localSearch
            });
          });
        }
      }

      // Set up handler for basic text search
      var searchFormHandler = function(minLength) {
        return function() {
          var $formElem = $(this).closest('form.notes-search-form');
          var term = $formElem.find('.search-content input').val().trim().toLowerCase();

          var $subjectDropdown;
          var selectedSubject = '';
          if (options.search.subjectAreaDropdown === 'advanced') {
            $subjectDropdown = $formElem.find('.subject-area-dropdown input');
          } else {
            $subjectDropdown = $formElem.find('.subject-area-dropdown');
          }
          if ($subjectDropdown.length) {
            selectedSubject = $subjectDropdown.val().trim();
          }
          var filterSubjects = selectedSubject && selectedSubject !== 'All';

          if (!term && !filterSubjects) {
            options.search.onReset();
          } else if (term.length >= minLength || (!term && filterSubjects)) {
            $formElem.append(Handlebars.templates.spinner({ extraClasses: 'spinner-mini' }));

            // Use a timeout so the loading indicator will show
            setTimeout(function() {
              var extraParams = filterSubjects ? {subject: selectedSubject} : {};
              filterNotes(notes, _.assign({
                term: term,
                pageSize: options.search.pageSize,
                invitation: options.search.invitation,
                venue: options.search.venue,
                onResults: options.search.onResults,
                localSearch: options.search.localSearch
              }, extraParams));
              $formElem.find('.spinner-container').remove();
            }, 50);
          }

          return false;
        }
      };

      $container.on('submit', 'form.notes-search-form', searchFormHandler(2));
      $container.on('keyup', 'form.notes-search-form .search-content input', _.debounce(searchFormHandler(3), 400));

      // Set up sorting handler
      if (!_.isEmpty(options.search.sort)) {
        $container.on('change', 'form.notes-search-form .sort-dropdown', searchFormHandler);
      }
    }

    if (options.displayOptions.showTags || options.displayOptions.showEdges) {
      var buildArray = function(tagInvitationId, fieldName, paperNumber, isTagWidget) {
        var tagInvitation = isTagWidget ?
          _.find(allTagInvitations, ['id', tagInvitationId]) :
          _.find(options.displayOptions.edgeInvitations, ['id', tagInvitationId]);

        if (_.has(tagInvitation, 'reply.' + fieldName + '.values')) {
          return tagInvitation.reply[fieldName].values;
        } else if (_.has(tagInvitation, 'reply.' + fieldName + '.values-copied')) {
          return _.compact(_.map(tagInvitation.reply[fieldName]['values-copied'], function(value) {
            if (value === '{signatures}') {
              return window.user.profile.id;
            } else if (value[0] === '{') {
              return null;
            } else {
              return value;
            }
          }));
        } else if (_.has(tagInvitation, 'reply.' + fieldName + '.values-regex')) {
          return _.compact(_.map(tagInvitation.reply[fieldName]['values-regex'].split('|'), function(value) {
            if (value.indexOf('Paper.*') !== -1) {
              return value.replace('Paper.*', 'Paper' + paperNumber);
            } else {
              return value;
            }
          }));
        }

        return [];
      };

      // Register event handler for tag widgets
      var bidWidgetHandler = function(event) {
        var $self = $(this);
        var $widget = $self.closest('.tag-widget');
        var $note = $self.closest('.note');
        var newValue = $self.data('value') || $self.text().trim();
        var tagId = $widget.data('id') || null;
        var isTagWidget = !$widget.hasClass('edge-widget');
        var returnVal;

        if ($self.parent().hasClass('disabled')) {
          return false;
        }

        if ($widget.data('type') === 'bid') {  // dropdown tag widget
          $widget.find('button.dropdown-toggle .bid-value').text(newValue);
          $widget.find('button.dropdown-toggle').click();
          returnVal = false;

        } else if ($widget.data('type') === 'radio') {  // radio tag widget
          $self.parent().addClass('disabled');
        }

        // Build readers array
        var tagInvitationId = $widget.data('invitationId');
        var readers = buildArray(tagInvitationId, 'readers', $note.data('number'), isTagWidget);
        var nonreaders = buildArray(tagInvitationId, 'nonreaders', $note.data('number'), isTagWidget);

        // For radio tag widgets, if user is de-selecting result the tag should be deleted
        var ddate = null;
        if ($widget.data('type') === 'radio' && $self.hasClass('active')) {
          ddate = Date.now();
          $self.removeClass('active');
          $self.children('input').prop('checked', false);
          returnVal = false;
        }

        // Make API call
        var apiSuccess = function(result) {
          $widget.data('id', result.id);
          $widget.removeClass('incomplete');
          $self.parent().removeClass('disabled');

          $widget.trigger('bidUpdated', [result]);
        };
        var apiError = function(jqXhr, textStatus) {
          var errorText = getErrorFromJqXhr(jqXhr, textStatus);
          promptError(_.isString(errorText) ? errorText : 'The specified tag could not be updated. Please reload the page and try again.');
          $self.parent().removeClass('disabled');
          $widget.trigger('apiReturnedError', errorText);
        };

        var requestBody;
        if (isTagWidget) {
          requestBody = {
            id: tagId,
            forum: $note.data('id'),
            invitation: tagInvitationId,
            tag: newValue,
            signatures: [window.user.profile.id],  // TODO: remove global user
            readers: readers,
            ddate: ddate
          };
          post('/tags', requestBody, { handleErrors: false })
            .then(apiSuccess, apiError);
        } else {
          requestBody = {
            id: tagId,
            invitation: tagInvitationId,
            label: newValue,
            weight: $self.data('weight'),
            head: $note.data('id'),
            tail: window.user.profile.id,
            signatures: [window.user.profile.id],  // TODO: remove global user
            writers: [window.user.profile.id],
            readers: readers,
            nonreaders: nonreaders,
            ddate: ddate
          };
          post('/edges', requestBody, { handleErrors: false })
            .then(apiSuccess, apiError);
        }

        return returnVal;
      };

      var addTagHandler = function(event) {
        var $widget = $(this).closest('.tag-widget');
        var $note = $(this).closest('.note');
        var tagId = $widget.data('id') || null;
        var tagInvitationId = $widget.data('invitationId');
        var tagInvitation = _.find(allTagInvitations, ['id', tagInvitationId]);
        var isTagWidget = !$widget.hasClass('edge-widget');

        var readers = buildArray(tagInvitation, 'readers', $note.data('number'), isTagWidget);

        var values = tagInvitation.reply.content.tag['values-dropdown'].map(function(v) {
          return { id: v, description: v };
        });
        var filteredOptions = function(options, prefix) {
          var selectedIds = [];
          $('.selected-reviewer', $widget).each(function(index) {
            selectedIds.push($(this).data('tag'));
          });

          return _.filter(options, function(p) {
            return !_.includes(selectedIds, p.id) && p.description.toLowerCase().indexOf(prefix.toLowerCase()) !== -1;
          });
        };

        var description = tagInvitation.reply.content.tag.description || '';
        var $reviewerDropdown = view.mkDropdown(description, false, {}, function(update, prefix) {
          if (values.length) {
            update(filteredOptions(values, prefix));
          }
        }, function(value, id, focusOut) {
          if (focusOut) {
            return;
          }

          $('.dropdown-container', $widget).before(
            '<span class="selected-reviewer" data-tag="' + id + '">' +
              value + ' <a href="#" title="Delete recommendation"><span class="glyphicon glyphicon-remove" aria-hidden="true"></span></a>' +
            '</span>'
          );
          $('.dropdown input', $widget).val('').focus();

          var requestBody = {
            id: tagId,
            forum: $note.data('id'),
            invitation: tagInvitation.id,
            tag: id,
            signatures: [window.user.profile.id],  // TODO: remove global user
            readers: readers,
            ddate: null
          };
          post('/tags', requestBody, { handleErrors: false })
            .then(function(result) {
              $('.selected-reviewer', $widget).last().data('id', result.id);
              $widget.trigger('tagUpdated', [result]);
            }, function(jqXhr, textStatus) {
              var errorText = getErrorFromJqXhr(jqXhr, textStatus);
              promptError(_.isString(errorText) ? errorText : 'The specified tag could not be updated. Please reload the page and try again.');
            });
        });

        $('.dropdown-container', $widget).empty().append($reviewerDropdown).show();
        $(this).hide();
        $('.hide-reviewer-dropdown', $widget).show();
        return false;
      };

      var removeTagHandler = function(event) {
        $(this).parent().fadeOut('fast', function() { $(this).remove(); });
        var deletedId = $(this).parent().data('id');
        var deletedValue = $(this).parent().data('tag');
        var $widget = $(this).closest('.tag-widget');
        var $note = $(this).closest('.note');
        var tagInvitationId = $widget.data('invitationId');
        var tagInvitation = _.find(allTagInvitations, ['id', tagInvitationId]);
        var readers = buildArray(tagInvitation, 'readers', $note.data('number'));

        var requestBody = {
          id: deletedId,
          forum: $note.data('id'),
          invitation: tagInvitation.id,
          tag: deletedValue,
          signatures: [window.user.profile.id],  // TODO: remove global user
          readers: readers,
          ddate: Date.now()
        };
        post('/tags', requestBody, { handleErrors: false })
          .then(function(result) {
            $widget.trigger('tagUpdated', [result]);
          }, function(jqXhr, textStatus) {
            var errorText = getErrorFromJqXhr(jqXhr, textStatus);
            promptError(_.isString(errorText) ? errorText : 'The specified tag could not be updated. Please reload the page and try again.');
          });
        return false;
      };

      var doneAddingHandler = function() {
        var $widget = $(this).closest('.tag-widget');
        $('.dropdown-container', $widget).hide();
        $(this).hide();
        $('.show-reviewer-dropdown', $widget).show();
        return false;
      };

      $container.on('click', '.tag-widget[data-type="recommend"] .show-reviewer-dropdown', addTagHandler);
      $container.on('click', '.tag-widget[data-type="recommend"] .selected-reviewer a', removeTagHandler);
      $container.on('click', '.tag-widget[data-type="recommend"] .hide-reviewer-dropdown', doneAddingHandler);

      $container.on('click', '.tag-widget.bid .dropdown-menu li a', bidWidgetHandler);
      $container.on('click', '.tag-widget[data-type="radio"] .btn-group .radio-toggle', bidWidgetHandler);
    }

    if (options.displayOptions.showActionButtons) {
      _registerActionButtonHandlers(
        $container, notes, Handlebars.templates['partials/noteBasic'], options
      );
    }

    // Pagination via page buttons or auto loading (aka infinite scroll)
    if (options.autoLoad && options.pageSize && notes.length > options.pageSize) {
      var currentOffset = 0;

      var scrollHandler = function() {
        if (window.pageYOffset > $(document).height() - window.innerHeight - 600) {
          currentOffset += options.pageSize;
          $container.append(Handlebars.templates['partials/noteList']({
            notes: notes.slice(currentOffset, currentOffset + options.pageSize),
            options: options.displayOptions
          }));
          $container.append($('.spinner-container', $container).detach());
        }
      };

      // Show loading icon at bottom of list
      $container.append(Handlebars.templates.spinner({extraClasses: 'spinner-inline'}));

      $(window).off('scroll').on('scroll', _.debounce(scrollHandler, 200));

    } else if (!options.autoLoad && options.noteCount) {
      var paginateWidgetHtml = view.paginationLinks(options.noteCount, options.pageSize, 1);
      $container.append(paginateWidgetHtml);

      $container.off('click', 'ul.pagination > li > a').on('click', 'ul.pagination > li > a', function() {
        if (!_.isFunction(options.onPageClick)) {
          console.warn('Missing required onPageClick callback');
          return false;
        }

        if ($(this).parent().hasClass('disabled') || $(this).parent().hasClass('active')) {
          return false;
        }

        var pageNum = parseInt($(this).parent().data('pageNumber'), 10);
        if (isNaN(pageNum)) {
          return false;
        }

        // Update pagination widget
        var $paginationContainer = $(this).closest('.pagination-container');
        $paginationContainer.replaceWith(
          view.paginationLinks(options.noteCount, options.pageSize, pageNum)
        );

        var $overlay = $('<div class="content-overlay">&nbsp;</div>');
        $container.append($overlay);

        // Load next page of results and replace current note list
        var offset = (pageNum - 1) * options.pageSize;
        options.onPageClick(offset).then(function(newNotes) {
          var scrollPos = $container.offset().top - 51 - 12;
          $('html, body').animate({scrollTop: scrollPos}, 400);
          $('.submissions-list', $container).replaceWith(
            Handlebars.templates['partials/noteList']({
              notes: newNotes,
              options: options.displayOptions
            })
          );
          setTimeout(function() { $overlay.remove(); }, 100);

          if (_.isFunction(options.onPageClickComplete)) {
            options.onPageClickComplete();
          }
        });

        return false;
      });
    }

    typesetMathJax();

    if (options.fadeIn) {
      return $container.fadeIn('fast').promise();
    }
    return $container;
  };

  var activityList = function(notes, options) {
    var activityDefaults = {
      container: '.activity-container > div',
      showGroup: true,
      showTags: false,
      showActionButtons: false,
      onNoteEdited: null,
      onNoteTrashed: null,
      onNoteRestored: null,
      emptyMessage: 'No recent activity.',
      user: null
    };
    options = _.defaults(options, activityDefaults, defaultDisplayOptions);

    // Format notes data
    notes = notes || [];
    notes.forEach(function(note) {
      if (!note.details) {
        note.details = {};
      }

      var noteAuthors = note.tauthor ? [note.tauthor] : note.signatures;
      note.details.userIsSignatory = options.user && _.intersection(noteAuthors, options.user.emails).length;
      if (note.details.userIsSignatory) {
        note.details.formattedSignature = 'You';
      } else {
        var prettySig = view.prettyId(note.signatures[0]);
        if (prettySig === '(anonymous)' || prettySig === '(guest)') {
          prettySig = 'Anonymous';
        } else if (prettySig === 'Super User') {
          prettySig = 'An Administrator';
        }
        note.details.formattedSignature = prettySig;
      }

      note.details.isForum = note.forum === note.id;

      var invitationArr = note.version === 2 ? note.invitations[0].split('/-/') : note.invitation.split('/-/');
      note.details.group = invitationArr[0];

      var invitationLower = invitationArr[1].toLowerCase();
      note.details.isSubmission = invitationLower.indexOf('submission') !== -1;
      note.details.isReview = invitationLower.indexOf('review') !== -1;
      note.details.isComment = invitationLower.indexOf('comment') !== -1;
      note.details.isDecision = invitationLower.indexOf('decision') !== -1;
      note.details.isAssignment = invitationLower.indexOf('assignment') !== -1;

      note.details.isDeleted = note.ddate && note.ddate < Date.now();
      note.details.isUpdated = note.tmdate > note.tcdate;
    });

    // Filter out any notes that should not be displayed
    notes = notes.filter(function(note) {
      return !note.isAssignment;
    });

    var $container = $(options.container).eq(0);
    $container.append(Handlebars.templates['partials/activityList']({
      notes: notes,
      activityOptions: options
    }));

    if (options.showActionButtons) {
      _registerActionButtonHandlers(
        $container, notes, Handlebars.templates['partials/noteActivity'], options
      );
    }

    typesetMathJax();
  };

  var _registerActionButtonHandlers = function($container, notes, noteTemplateFn, options) {
    var user = _.isEmpty(options.user) ?
      window.user :
      { id: options.user.id, profile: options.user };

    // Edit button handler
    $container.on('click', '.note-action-edit', function(e) {
      var $note = $(this).closest('.note');
      var noteId = $note.data('id');
      var existingNote = _.find(notes, ['id', noteId]);
      if (!existingNote) {
        return;
      }
      var details = existingNote.details;
      existingNote = _.omit(existingNote, ['details']);

      return get('/invitations', { id: existingNote.invitation }).then(function(result) {
        var invitationObj = _.get(result, 'invitations[0]', {});

        $('#note-editor-modal').remove();
        $('body').append(Handlebars.templates.genericModal({
          id: 'note-editor-modal',
          extraClasses: 'modal-lg',
          showHeader: false,
          showFooter: false
        }));
        $('#note-editor-modal').on('hidden.bs.modal', function() {
          $('#note-editor-modal').find('div.note_editor.panel').remove();
        });

        view.mkNoteEditor(existingNote, invitationObj, user, {
          onNoteEdited: function(result) {
            $('#note-editor-modal').modal('hide');
            existingNote.content = result.content;
            existingNote.tmdate = Date.now();
            details.isUpdated = true;
            $note.html(
              noteTemplateFn(Object.assign({}, existingNote, { details: details, options: options }))
            );
            promptMessage('Note updated successfully');

            // update notes object so that subsequent update has latest value
            // result (from POST) can have more properties so can't just assign to note (from GET)
            var indexOfUpdatedNote = _.findIndex(notes, ['id', result.id]);
            Object.keys(notes[indexOfUpdatedNote]).forEach(function(key) {
              if (key !== 'details') {
                notes[indexOfUpdatedNote][key] = result[key];
              }
            });
            notes[indexOfUpdatedNote].details.isUpdated = true;

            MathJax.typesetPromise();
            return _.isFunction(options.onNoteEdited) ? options.onNoteEdited(existingNote) : true;
          },
          onError: function(errors) {
            $('#note-editor-modal .modal-body .alert-danger').remove();

            $('#note-editor-modal .modal-body').prepend(
              '<div class="alert alert-danger"><strong>Error:</strong> </div>'
            );
            var errorText = 'Could not save note';
            if (errors && errors.length) {
              errorText = translateErrorMessage(errors[0]);
            }
            $('#note-editor-modal .modal-body .alert-danger').append(errorText);
            $('#note-editor-modal').animate({ scrollTop: 0 }, 400);
          },
          onNoteCancelled: function() {
            $('#note-editor-modal').modal('hide');
          },
          onCompleted: function($editor) {
            if (!$editor) return;
            $('#note-editor-modal .modal-body').empty().addClass('legacy-styles').append(
              '<button type="button" class="close" data-dismiss="modal" aria-label="Close">' +
                '<span aria-hidden="true">&times;</span>' +
              '</button>',
              $editor
            );
            $('#note-editor-modal').modal('show');
          }
        });
      });
    });

    // Trash button handler
    $container.on('click', '.note-action-trash', function(e) {
      var $note = $(this).closest('.note');
      var noteId = $note.data('id');
      var noteTitle = $note.find('h4 > a').eq(0).text();
      var existingNote = _.find(notes, ['id', noteId]);
      if (!existingNote) {
        return;
      }
      var details = existingNote.details;
      existingNote = _.omit(existingNote, ['details']);

      view.deleteOrRestoreNote(existingNote, noteTitle, user, function(newNote) {
        details.isDeleted = true;
        $note.addClass('trashed').html(
          noteTemplateFn(Object.assign({}, newNote, { details: details, options: options }))
        );
        return _.isFunction(options.onNoteTrashed) ? options.onNoteTrashed(newNote) : true;
      });
    });

    // Restore button handler
    $container.on('click', '.note-action-restore', function(e) {
      var $note = $(this).closest('.note');
      var noteId = $note.data('id');
      var existingNote = _.find(notes, ['id', noteId]);
      if (!existingNote) {
        return;
      }
      var details = existingNote.details;
      existingNote = _.omit(existingNote, ['details']);
      existingNote.ddate = null;

      post('/notes', existingNote).then(function(newNote) {
        details.isDeleted = false;
        $note.removeClass('trashed').html(
          noteTemplateFn(Object.assign({}, newNote, { details: details, options: options }))
        );
        return _.isFunction(options.onNoteRestored) ? options.onNoteRestored(newNote) : true;
      });
    });
  };

  var tabPanel = function(sections, options) {
    options = _.defaults(options, {
      container: '#notes',
      containerClasses: '',
      hidden: false
    });

    if (_.isEmpty(sections)) {
      console.warn('Missing required parameter for tabPanel: sections');
      return;
    }

    var displayNone = '';
    if (options.hidden) {
      displayNone = 'display: none;';
    }

    var $container = $(options.container);
    var $tabs = $(
      '<div class="tabs-container ' + options.containerClasses + '" style="' + displayNone + '">' +
        Handlebars.templates['components/tabs']({sections: sections}) +
      '</div>'
    );
    $container.append($tabs);
  };

  var setupAutoLoading = function(invitationId, pageSize, options) {
    var defaults = {
      container: '#notes',
      queryParams: {}
    };
    options = _.defaults(options, defaults, defaultDisplayOptions);

    var $container = $(options.container);
    var currentOffset = 0;
    var processing = false;

    var scrollHandler = function() {
      if (processing) {
        return;
      }
      if (window.pageYOffset > $(document).height() - window.innerHeight - 400) {
        currentOffset += pageSize;
        processing = true;
        $container.append(Handlebars.templates.spinner());

        var submissionOptions = _.defaults({pageSize: pageSize, offset: currentOffset}, options.queryParams);
        var notesP = getSubmissions(invitationId, submissionOptions);
        notesP.then(function(newNotes) {
          $('.spinner-container', $container).remove();
          if (_.isEmpty(newNotes)) {
            $(window).off('scroll');
          } else {
            $('.submissions-list', $container).append(moreNotes(newNotes, options));
          }
          processing = false;
        });
      }
    };

    $(window).off('scroll').on('scroll', _.debounce(scrollHandler, 200));
  };

  var disableAutoLoading = function() {
    $(window).off('scroll');
  };

  var moreNotes = function(notes, displayOptions) {
    displayOptions = _.defaults(displayOptions, defaultDisplayOptions);

    return _.map(notes, function(note) {
      note.options = displayOptions;
      return '<li class="note" data-id="' + note.id + '">' +
        Handlebars.templates['partials/noteBasic'](note) +
        '</li>';
    }).join('\n');
  };

  var searchResults = function(notes, options) {
    var defaults = {
      container: '#notes',
      pageSize: null,
      autoLoad: true,
      emptyContainer: false,
      emptyMessage: 'No papers to display at this time'
    };
    options = _.defaults(options, defaults, defaultDisplayOptions);

    var $container = $(options.container);
    var noteListHtml = Handlebars.templates['partials/noteList']({
      notes: options.pageSize ? notes.slice(0, options.pageSize) : notes,
      options: options
    });

    if (options.emptyContainer) {
      $container.empty();
    } else {
      $container.find('.submissions-list, .spinner-container, .pagination-container').remove();
    }

    if (options.autoLoad && options.pageSize && notes.length > options.pageSize) {
      var currentOffset = 0;
      $container.data('currentOffset', currentOffset);

      var scrollHandler = function() {
        if (window.pageYOffset > $(document).height() - window.innerHeight - 600) {
          currentOffset += options.pageSize;
          $container.append(Handlebars.templates['partials/noteList']({
            notes: notes.slice(currentOffset, currentOffset + options.pageSize),
            options: options
          }));
          $container.append($('.spinner-container', $container).detach());
        }
      };

      // Show loading icon at bottom of list
      $container.append(Handlebars.templates.spinner({extraClasses: 'spinner-inline'}));

      $(window).on('scroll', _.debounce(scrollHandler, 200));
    }

    $container.append(noteListHtml);
    typesetMathJax();
  };

  var groupInfo = function(group, options) {
    var defaults = {
      container: '#notes',
      showAddForm: true
    };
    options = _.defaults(options, defaults);

    var $container = $(options.container);
    var membersCount = group.members.length > 4 ? group.members.length : 0;
    var groupParent = group.id.split('/').slice(0, -1).join('/');

    $container.empty().append(Handlebars.templates['partials/groupInfo']({
      group: group,
      groupParent: groupParent,
      groupMembersCount: membersCount,
      options: { showAddForm: options.showAddForm }
    }));

    loadChildGroups(group.id);
    loadRelatedInvitations(group.id);
    loadSignedNotes(group.id);
  };

  var groupEditor = function(group, options) {
    var defaults = {
      container: '#notes',
      showAddForm: true,
      isSuperUser: false
    };
    options = _.defaults(options, defaults);

    var groupId = group.id;
    var removedMembers = [];
    var selectedMembers = [];
    var matchingMembers = []; // list to store result filtered by search
    var searchTerm = '';
    var $container = $(options.container);
    var editor;

    // Helper functions
    var renderMembersTable = async function(groupMembers, removedMembers, startPage) {
      let memberAnonIdMap = new Map()
      if (group.anonids && options.isSuperUser) {
        const anonGroupRegex = groupId.endsWith('s') ? `${groupId.slice(0, -1)}_` : `${groupId}_`
        const result = await get(`/groups?regex=${anonGroupRegex}`)
        groupMembers.forEach(m => {
          const anonId = result.groups.find(p => p?.members == m)?.id
          memberAnonIdMap.set(m, {
            id: anonId,
            prettyId: anonId ? view.prettyId(anonId) : null
          })
        })
      }
      var limit = 15;
      var membersCount = groupMembers ? groupMembers.length : 0;
      var removedCount = removedMembers ? removedMembers.length : 0;
      var offset = getOffsetFromPageNum(limit, membersCount + removedCount, startPage);
      var addButtonEnabled = searchTerm && !_.includes(groupMembers, searchTerm);
      var selectedLabel = '<span style="' + (selectedMembers.length ? '' : 'display: none') +
        '"> total, <span class="selected-count">' + selectedMembers.length + '</span> selected</span>';

      var $section = $container.find('section.members').html(
        '<h4>Group Members ' + (membersCount > 3 ? '(' + membersCount + selectedLabel + ')' : '') + '</h4>' +
        Handlebars.templates['partials/groupMembersTable']({
          groupMembers: groupMembers.concat(removedMembers).slice(offset, offset + limit),
          removedMembersIndex: membersCount - offset - 1,
          selectedMembers: selectedMembers,
          searchTerm: searchTerm,
          addButtonEnabled: addButtonEnabled,
          memberAnonIdMap: memberAnonIdMap,
          options: { showAddForm: options.showAddForm }
        }
      ));

      // Move cursor to end of the search input
      var $input = $section.find('.group-members-form .add-member-input');
      $input.trigger('focus');
      var pos = searchTerm.length;
      if ($input[0].setSelectionRange) {
        $input[0].setSelectionRange(pos, pos);
      } else if ($input[0].createTextRange) {
        var range = $input[0].createTextRange();
        range.collapse(true);
        range.moveEnd('character', pos);
        range.moveStart('character', pos);
        range.select();
      }

      if (membersCount > limit) {
        $section.append(
          view.paginationLinks(membersCount + removedCount, limit, startPage)
        );

        // Render next page of results by only replacing list items
        $section.off('click', 'ul.pagination > li > a').on('click', 'ul.pagination > li > a', function() {
          var currOffset;
          paginationOnClick($(this).parent(), $('table.group-members-table tbody', $section), {
            count: membersCount + removedCount,
            limit: limit,
            loadFunc: function(limit, offset) {
              currOffset = offset;
              return $.Deferred().resolve({
                items: groupMembers.concat(removedMembers).slice(offset, offset + limit)
              });
            },
            renderFunc: function(groupId, i) {
              return Handlebars.templates['partials/groupMembersTableRow']({
                memberId: groupId,
                removed: i > membersCount - currOffset - 1,
                selected: selectedMembers.indexOf(groupId) > -1
              });
            }
          });
          return false;
        });
      }
    };

    var getOffsetFromPageNum = function(limit, membersCount, pageNum) {
      pageNum = pageNum || 1;
      if (pageNum < 0) {
        var overflow = membersCount % limit === 0 ? 0 : 1;
        var pageCount = Math.floor(membersCount / limit) + overflow;
        pageNum = pageCount + pageNum + 1;
      }

      return (pageNum - 1) * limit;
    };

    var addMemberToGroup = function($input) {
      var idsToAdd = $input.val().trim();
      if (!idsToAdd) {
        return false;
      }

      $('.group-members-form .add-member').attr('disabled', true);

      idsToAdd = idsToAdd.split(',')
        .map(function(id) {
          return id.indexOf('@') !== -1 ? id.trim().toLowerCase() : id.trim();
        })
        .filter(function(id) { return id; });  // Filter empty strings

      if (!idsToAdd.length) {
        return false;
      }
      put('/groups/members', { id: groupId, members: idsToAdd }).then(function(groupObj) {
        group = groupObj;
        removedMembers = _.difference(removedMembers, idsToAdd);
        searchTerm = '';
        selectedMembers = [];
        renderMembersTable(group.members, removedMembers, -1);

        $('.group-members-form .add-member').attr('disabled', false);
        var othersText = idsToAdd.length > 1 ? ' and ' + (idsToAdd.length - 1) + ' others' : '';
        showAlert(idsToAdd[0] + othersText + ' added to ' + groupId + '. Some emails may have been converted to lowercase.');

        $input.val('');
      }, function() {
        // Error
        $('.group-members-form .add-member').attr('disabled', false);
        setTimeout(function() { editModeBanner(groupId, 'edit'); }, 8250);
      });
    };

    var showAlert = function(message, alertOptions) {
      var defaults = {
        scrollToTop: true,
        noTimeout: true,
        overlay: true
      };
      alertOptions = _.defaults(alertOptions, defaults);

      $('#flash-message-container').slideUp('fast', function() {
        promptMessage(message, alertOptions);
        setTimeout(function() {
          $('#flash-message-container').slideUp('fast', function() {
            editModeBanner(groupId, 'edit');
          });
        }, 2500);
      });
    };

    var membersCount = group.members.length > 4 ? group.members.length : 0;
    var groupParent = groupId.split('/').slice(0, -1).join('/');
    $container.empty().append(Handlebars.templates['partials/groupEditor']({
      group: group,
      groupParent: groupParent,
      groupMembersCount: membersCount,
      removedMembers: removedMembers,
      isSuperUser: options.isSuperUser
    }));
    $container.off();

    renderMembersTable(group.members, removedMembers);
    loadChildGroups(groupId);
    loadRelatedInvitations(groupId);
    loadSignedNotes(groupId);

    // Event handlers
    $container.on('click', '.edit-group-info', function() {
      $(this).hide();
      $('.group-info-table').hide();
      $('.group-info-form').show();
    });

    $container.on('submit', '.group-info-form', function() {
      var $submitButton = $(this).find('button[type="submit"]');
      if ($submitButton.hasClass('disabled')) {
        return false;
      }
      $submitButton.addClass('disabled');

      var formData = _.reduce($(this).serializeArray(), function(result, field) {
        if (field.name === 'anonids') {
          result[field.name] = field.value === '' ? null : field.value === 'True';
        } else {
          result[field.name] = _.compact(field.value.split(',').map(_.trim));
        }
        return result;
      }, {});

      get('/groups', { id: groupId }).then(function(response) {
        if (!response.groups || !response.groups.length) {
          return $.Deferred().reject();
        }

        var updatedGroupObj = _.assign(response.groups[0], formData);
        return post('/groups', updatedGroupObj).then(function(response) {
          group = response;

          $('section.general').html(
            '<h4>General Info</h4>' +
            Handlebars.templates['partials/groupInfoTable']({
              group: group,
              groupParent: groupParent,
              editable: true,
              isSuperUser: options.isSuperUser
            })
          );
          showAlert('Settings for ' + view.prettyId(groupId) + ' updated');
        }).always(function() {
          $submitButton.removeClass('disabled');
          //may need to show/remove annon id
          if(options.isSuperUser) renderMembersTable(group.members, removedMembers);
        });
      });

      return false;
    });

    $container.on('click', '.group-info-form .cancel-edit-group', function() {
      $('.group-info-form').hide();
      $('.edit-group-info').show();
      $('.group-info-table').show();
    });

    $container.on('click', '.remove-member', function() {
      var id = $(this).closest('tr').data('id') + '';

      xhrDelete('/groups/members', { id: groupId, members: [id] }).then(function(groupObj) {
        group = groupObj;
        removedMembers.push(id);
        searchTerm = '';
        selectedMembers = [];
        renderMembersTable(group.members, removedMembers, -1);
      });

      return false;
    });

    $container.on('click', '.undo-remove-member', function() {
      var idToAdd = $(this).closest('tr').data('id') + '';

      put('/groups/members', { id: groupId, members: [idToAdd] }).then(function(groupObj) {
        group = groupObj;
        removedMembers = _.without(removedMembers, idToAdd);
        searchTerm = '';
        selectedMembers = [];
        renderMembersTable(group.members, removedMembers, -1);
      });

      return false;
    });

    $container.on('click', '.message-member', function() {
      var id = $(this).closest('tr').data('id') + '';

      showMessageGroupMembersModal([id]);

      return false;
    });

    $container.on('click', '.group-members-form .add-member', function() {
      var $input = $(this).closest('.group-members-form').find('.add-member-input');
      addMemberToGroup($input);

      return false;
    });

    $container.on('keyup', '.group-members-form .add-member-input', _.debounce(function(e) {
      // Don't handle tab, enter, or arrow key presses
      var excludedKeys = [9, 13, 37, 38, 29, 40];
      if (_.includes(excludedKeys, e.keyCode)) {
        return;
      }

      var newSearchTerm = $(this).val().trim();
      if (newSearchTerm === searchTerm) {
        return;
      }
      searchTerm = newSearchTerm;
      if (!searchTerm) {
        renderMembersTable(group.members, removedMembers);
      }

      var searchTermLower = searchTerm.toLowerCase();
      matchingMembers = group.members.filter(function(member) {
        return member.toLowerCase().indexOf(searchTermLower) > -1;
      });
      renderMembersTable(matchingMembers, []);
    }, 300));

    $container.on('keydown', '.group-members-form .add-member-input', function(e) {
      if (e.keyCode === 13) {
        return false;
      }
    });

    $container.on('click', '.group-members-form .select-all-members', function() {
      var isSelected = $(this).data('selected');
      var buttonText = isSelected ? 'Deselect All' : 'Select All';
      $(this).text(buttonText).data('selected', !isSelected);

      $('tbody tr:not(.removed) input[type="checkbox"]').prop('checked', isSelected);

      if (isSelected) {
        $('tbody tr:not(.removed)').addClass('selected');
        selectedMembers = _.clone(searchTerm ? matchingMembers : group.members);
      } else {
        $('tbody tr').removeClass('selected');
        selectedMembers = [];
      }

      if (selectedMembers.length) {
        $container.find('section.members > h4 > span').show()
          .children('.selected-count').text(selectedMembers.length);
      } else {
        $container.find('section.members > h4 > span').hide();
      }
    });

    $container.on('click', '.group-members-form .remove-selected-members', function() {
      if (!selectedMembers.length) {
        return false;
      }

      $(this).attr('disabled', true);

      xhrDelete('/groups/members', { id: groupId, members: selectedMembers }).then(function(groupObj) {
        group = groupObj;
        removedMembers = removedMembers.concat(selectedMembers);
        searchTerm = '';
        selectedMembers = [];
        renderMembersTable(group.members, removedMembers, -1);

        $(this).attr('disabled', false);
      });

      return false;
    });

    $container.on('click', '.group-members-form .message-selected-members', function() {
      if (!selectedMembers.length) {
        return false;
      }

      showMessageGroupMembersModal(selectedMembers);
      return false;
    });

    var showMessageGroupMembersModal = function(selectedMembers) {
      $('#message-group-members-modal').remove();

      var modalHtml = Handlebars.templates.messageGroupMembersModal({
        numRecipients: selectedMembers.length,
        recipientNames: selectedMembers.map(function(groupId) {
          return groupId.indexOf('@') < 0 ? view.prettyId(groupId) : groupId;
        }),
        defaultSubject: 'Message to ' + view.prettyId(groupId),
        defaultBody: '',
      });
      $(document.body).append(modalHtml);

      $('#message-group-members-modal .btn-primary').on('click', function() {
        $('#message-group-members-modal form').submit();
      });
      $('#message-group-members-modal form').on('submit', function() {
        sendGroupMembersEmails(selectedMembers);
        return false;
      });

      $('#message-group-members-modal').modal();
    };

    var sendGroupMembersEmails = function(groupIds) {
      $('#message-group-members-modal .alert-danger').hide();
      if (!groupIds || !groupIds.length) {
        return $.Deferred().reject();
      }

      var subject = $('#message-group-members-modal input[name="subject"]').val().trim();
      var message = $('#message-group-members-modal textarea[name="message"]').val().trim();
      if (!subject || !message) {
        $('#message-group-members-modal .alert-danger span')
          .text('Email Subject and Body are required to send messages.')
          .parent().show();
        return $.Deferred().reject();
      }

      $('#message-group-members-modal .btn-primary').prop('disabled', true).append([
        '<div class="spinner-small">',
          '<div class="rect1"></div><div class="rect2"></div>',
          '<div class="rect3"></div><div class="rect4"></div>',
        '</div>'
      ].join(''));
      $('#message-group-members-modal .btn-default').prop('disabled', true);

      return post('/messages', {
        groups: groupIds,
        subject: subject,
        message: message,
        parentGroup: groupId,
        useJob: true
      }, { handleErrors: false })
        .then(function(response) {
          $('#message-group-members-modal').modal('hide');

          var scrollPos = $container.find('section.messages').offset().top - 51 - 12;
          $('html, body').animate({scrollTop: scrollPos}, 400);

          showEmailProgress(response.jobId)

          // Save the timestamp in the local storage (used in PC console)
          for (var i = 0; i < groupIds.length; i++) {
            localStorage.setItem(groupId + '|' + groupIds[i], Date.now());
          }
        })
        .fail(function(jqXhr, textStatus) {
          var errorToShow = getErrorFromJqXhr(jqXhr, textStatus);
          var msgHtml = _.flatten([
            '<strong>Error: </strong>',
            translateErrorMessage(errorToShow)
          ]);
          $('#message-group-members-modal .alert-danger span').empty().append(msgHtml)
            .parent().show();
        })
        .always(function() {
          $('#message-group-members-modal .btn-primary').prop('disabled', false)
            .find('.spinner-small').remove();
          $('#message-group-members-modal .btn-default').prop('disabled', false);
        });
    };

    var getMessagedIds = function(groups) {
      var messagedIds = [];
      if (!groups) {
        return messagedIds;
      }

      for (var i = 0; i < groups.length; i++) {
        var g = groups[i];
        if (g.hasOwnProperty('message')) {
          messagedIds.push(g.message.content.to);
        } else if (g.hasOwnProperty('messages')) {
          for (var j = 0; j < g.messages.length; j++) {
            messagedIds.push(g.messages[j].content.to);
          }
        }
      }

      return messagedIds;
    };

    var showEmailProgress = function(jobId) {
      var $progress = $container.find('section.messages .progress').show();
      var failures = 0;
      var loadProgress = function() {
        get('/logs/process', { id: jobId }).then(function(response) {
          if (!response.logs || !response.logs.length) {
            return $.Deferred().reject('Email progress could not be loaded. See link below for more details.');
          }
          var status = response.logs[0];

          if (status.status === 'error') {
            return $.Deferred().reject('Error: ' + status.error.message);
          }
          if (!status.progress || !status.progress.groupsProcessed) {
            return $.Deferred().reject('Email progress could not be loaded. See link below for more details.');
          }
          var queued = status.progress.groupsProcessed[0];
          var totalQueued = status.progress.groupsProcessed[1];
          var sent = status.progress.emailsProcessed ? status.progress.emailsProcessed[0] : 0;
          var totalSent = status.progress.emailsProcessed ? status.progress.emailsProcessed[1] : 0;
          var isQueuing = queued < totalQueued;
          var percentComplete = _.round((isQueuing ? (queued / totalQueued) : (sent / totalSent)) * 100, 2);

          var statusText;
          if (status.status === 'ok') {
            statusText = '<strong>All ' + totalSent + ' emails have been sent</strong>' +
              '<br><br><em>Note: The number of emails sent may not exactly match the number of users you selected if multiple IDs belonging to the same user were included.</em>'
          } else if (isQueuing) {
            statusText = '<strong>Queuing emails:</strong> ' + queued + ' / ' + totalQueued + ' complete'
          } else {
            statusText = '<strong>Sending emails:</strong> ' + sent + ' / ' + totalSent + ' complete'
          }

          $progress.find('.progress-bar')
            .attr('aria-valuenow', isQueuing ? queued : sent)
            .attr('aria-valuemax', isQueuing ? totalQueued : totalSent)
            .css('width', percentComplete + '%')
            .find('span').text(percentComplete + '%');
          $container.find('section.messages .progress-status')
            .html(statusText);

          if (status.status === 'ok') {
            clearInterval(refreshTimer)
          }
        }).fail(function(err) {
          $container.find('section.messages .progress-status').text(err);

          failures += 1;
          if (failures > 5) {
            clearInterval(refreshTimer);
          }
        });
      };
      var refreshTimer = setInterval(loadProgress, 1000);

      $container.find('section.messages .progress-bar')
        .attr('aria-valuenow', 0).attr('aria-valuemax', 10).css('width', 0 + '%').find('span').text(0 + '%');
      $container.find('section.messages .progress-status')
        .text('');
      loadProgress();
    };

    $container.on('change', 'tbody input[type="checkbox"]', function() {
      var $row = $(this).closest('tr');
      var selectedId = $row.data('id') + '';
      $row.toggleClass('selected');

      if (this.checked) {
        selectedMembers = selectedMembers.concat(selectedId);
      } else {
        selectedMembers = selectedMembers.filter(function(gId) {
          return gId !== selectedId;
        });
      }

      if (selectedMembers.length) {
        $container.find('section.members > h4 > span').show()
          .children('.selected-count').text(selectedMembers.length);
      } else {
        $container.find('section.members > h4 > span').hide();
      }
    });

    $container.on('click', 'tbody tr', function(e) {
      if ($(e.target).is('input, a')) {
        return true;
      }
      $(this).find('input[type="checkbox"]').click();
    });

    $container.on('click', 'button.load-editor-btn', function() {
      var $btn = $(this);
      if ($btn.prop('disabled')) {
        return false;
      }

      $btn.prop('disabled', true).append([
        '<div class="spinner-small">',
          '<div class="rect1"></div><div class="rect2"></div>',
          '<div class="rect3"></div><div class="rect4"></div>',
        '</div>'
      ].join('\n'));

      $('section.webfield .alert-danger').remove();

      var showError = function(errorMsg) {
        $btn.prop('disabled', false).find('.spinner-small').remove();
        $btn.before(
          '<div class="alert alert-danger"><span>' + errorMsg + '</span></div>'
        );
      };

      get('/groups', { id: group.id }).then(function(response) {
        if (!response.groups || !response.groups.length) {
          showError('Could not group UI code. Please refresh the page and try again.');
          return;
        }

        var webfieldCode = response.groups[0].web;

        $.ajax({
          url: 'https://cdn.jsdelivr.net/npm/ace-builds@1.4.12/src-min/ace.js',
          dataType: 'script',
          cache: true
        }).then(function() {
          editor = ace.edit('webfield-editor');
          editor.setTheme('ace/theme/chrome');
          editor.setOption('tabSize', 2);
          editor.setOption('showPrintMargin', false);
          editor.session.setMode('ace/mode/javascript');
          editor.session.setUseWrapMode(true);
          editor.session.setUseSoftTabs(true);
          editor.session.setValue(webfieldCode ? webfieldCode : '');  // setValue doesn't accept null

          $btn.hide().prop('disabled', false).find('.spinner-small').remove();
          $('.webfield-editor-container').show();
        }, function() {
          showError('Could not load code editor. Please refresh the page and try again.');
        });
      });

      return false;
    });

    $container.on('click', 'button.save-btn', function() {
      var $btn = $(this);
      if ($btn.prop('disabled')) {
        return false;
      }

      $btn.prop('disabled', true).append([
        '<div class="spinner-small">',
          '<div class="rect1"></div><div class="rect2"></div>',
          '<div class="rect3"></div><div class="rect4"></div>',
        '</div>'
      ].join('\n'));

      var newCode = editor.getSession().getValue().trim();
      if (newCode) {
        newCode += '\n';
        group.web = newCode;
      } else {
        group.web = null;
      }

      editor.setValue(newCode);
      editor.gotoLine(1);

      post('/groups', group).then(function(response) {
        group = response;
        showAlert('UI code for ' + group.id + ' has been updated', { scrollToTop: false });
      }).always(function() {
        $btn.prop('disabled', false).find('.spinner-small').remove();
      });

      return false;
    });

    $container.on('click', 'button.cancel-btn', function() {
      $('.webfield-editor-container').hide();
      $('.load-editor-btn').show();
      ace = undefined;
    });

  };

  var loadChildGroups = function(groupId) {
    renderPaginatedList($('section.children'), {
      templateName: 'partials/paginatedGroupList',
      loadItems: function(limit, offset) {
        return get('/groups?regex=' + groupId + '/[^/]%2B$', {
          limit: limit, offset: offset
        })
          .then(apiResponseHandler('groups'));
      },
      renderItem: renderGroupListItem
    });
  };

  var loadRelatedInvitations = function(groupId) {
    renderPaginatedList($('section.invitations'), {
      templateName: 'partials/paginatedInvitationList',
      loadItems: function(limit, offset) {
        return get('/invitations?regex=' + groupId + '/-/.*', {
          expired: true, type: 'all', limit: limit, offset: offset
        })
          .then(apiResponseHandler('invitations'));
      },
      renderItem: renderInvitationListItem
    });
  };

  var loadSignedNotes = function(groupId) {
    renderPaginatedList($('section.notes'), {
      templateName: 'partials/paginatedNoteList',
      loadItems: function(limit, offset) {
        return get('/notes', { signature: groupId, limit: limit, offset: offset })
          .then(apiResponseHandler('notes'));
      },
      renderItem: renderNoteListItem
    });
  };

  var loadChildInvitations = function(invitationId) {
    renderPaginatedList($('section.subinvitations'), {
      templateName: 'partials/paginatedInvitationList',
      loadItems: function(limit, offset) {
        return get('/invitations', { super: invitationId, limit: limit, offset: offset })
          .then(apiResponseHandler('invitations'));
      },
      renderItem: renderInvitationListItem
    });
  };

  var renderPaginatedList = function($container, options) {
    var defaults = {
      templateName: 'partials/paginatedGroupList',
      limit: 15,
      loadItems: function() { return $.Deferred().resolve({items: [], count: 0}); },
      renderItem: function() { return null; },
    };
    options = _.defaults(options, defaults);

    var limit = options.limit;
    var offset = 0;

    // Load first page of results
    return options.loadItems(limit, offset).then(function(response) {
      var items = response.items;
      var totalCount = response.count;
      if (!items || !items.length) {
        $container.empty().hide();
        return;
      }

      // Render full template with first page of results
      var title = $container.find('h4').text();
      $container.html(Handlebars.templates[options.templateName]({
        title: title,
        sortedList: items,
        totalCount: totalCount,
        limit: limit,
      }));

      if (totalCount > limit) {
        // Add pagination widget to container
        var paginateWidgetHtml = view.paginationLinks(totalCount, limit, 1);
        $container.append(paginateWidgetHtml);

        // Render next page of results by only replacing list items
        $container.off('click', 'ul.pagination > li > a').on('click', 'ul.pagination > li > a', function(e) {
          paginationOnClick($(this).parent(), $('ul.list-paginated', $container), {
            count: totalCount,
            limit: limit,
            loadFunc: options.loadItems,
            renderFunc: options.renderItem
          });
          return false;
        });
      }
    });
  };

  var apiResponseHandler = function(responseKey) {
    return function(response) {
      if (response && response[responseKey]) {
        return { items: response[responseKey], count: response.count };
      }
      return { items: [], count: 0 };
    };
  };

  var renderNoteListItem = function(note) {
    var forumNoteParam = note.id === note.forum ? '' : '&noteId=' + note.id;
    return [
      '<li data-id="' + note.id + '">',
        '<a href="/forum?id=' + note.forum + forumNoteParam + '">',
          view.prettyInvitationId(note.invitation) + ': ' + (note.content.title || note.forum),
        '</a>',
      '</li>'
    ].join('\n');
  };

  var renderGroupListItem = function(group) {
    var groupUrl = '/group/edit?id=' + group.id;
    if (group.id.indexOf('~') === 0) {
      groupUrl = '/profile?id=' + group.id;
    } else if (group.id.indexOf('@') !== -1) {
      groupUrl = '/profile?email=' + group.id;
    }

    return [
      '<li data-id="' + group.id + '">',
        '<a href="' + groupUrl + '">' + view.prettyId(group.id) + '</a>',
      '</li>'
    ].join('\n');
  };

  var renderInvitationListItem = function(invitation) {
    var id = invitation.id;
    return [
      '<li data-id="' + id + '">',
        '<a href="/invitation/edit?id=' + id + '">' + view.prettyId(id) + '</a>',
      '</li>'
    ].join('\n');
  };

  var paginationOnClick = function($target, $container, options) {
    if ($target.hasClass('disabled') || $target.hasClass('active')) {
      return false;
    }

    // Get page number that was clicked
    var pageNum = parseInt($target.data('pageNumber'), 10);
    if (isNaN(pageNum)) {
      return false;
    }

    // Update pagination widget
    var $paginationContainer = $target.closest('.pagination-container');
    $paginationContainer.replaceWith(
      view.paginationLinks(options.count, options.limit, pageNum)
    );

    // Load next page of results and replace current note list
    var offset = (pageNum - 1) * options.limit;
    options.loadFunc(options.limit, offset).then(function(newResults) {
      $container.empty().append(newResults.items.map(options.renderFunc));
    });

    return false;
  };

  // Deprecated: This function is no longer used in favor of renderPaginatedList
  var renderExpandableList = function(groupsOrInvitations, container, templateName) {
    var sortedList = sortByRelevance(groupsOrInvitations);
    if (!sortedList.length) {
      $(container).empty().hide();
      return;
    }

    var title = $(container).find('h4').text();
    $(container).html(Handlebars.templates[templateName]({
      title: title,
      sortedList: sortedList.slice(0, 10),
      sortedListOverflow: sortedList.slice(10),
      sortedListCount: sortedList.length
    }));
  };

  // Deprecated: This function is no longer used due to being incompatible with pagination
  var sortByRelevance = function(groupsOrInvitations) {
    // Order the list of objects so ids that include 'Paper' are in order at the end of the list
    if (!groupsOrInvitations || !groupsOrInvitations.length) {
      return [];
    }

    var paperRe = /Paper(\d+)/;
    var otherIds = [];
    var paperIds = [];
    for (var i = 0; i < groupsOrInvitations.length; i++) {
      var obj = { id: groupsOrInvitations[i].id };
      var match = obj.id.match(paperRe);
      if (match) {
        (paperIds[match[1]] || (paperIds[match[1]] = [])).push(obj);
      } else {
        otherIds.push(obj);
      }
    }

    // Sort non-paper ids alphabetically
    otherIds.sort(function(a, b) { return a.id > b.id ? 1 : -1; });
    return otherIds.concat(_.flatten(_.compact(paperIds)));
  };

  var invitationInfo = function(invitation, options) {
    var defaults = {
      container: '#notes',
      showAddForm: true
    };
    options = _.defaults(options, defaults);

    var $container = $(options.container);
    var parentGroupId = invitation.id.split('/-/')[0];

    $container.empty().append(Handlebars.templates['partials/invitationInfo']({
      invitation: invitation,
      parentGroupId: parentGroupId,
      replyJson: JSON.stringify(invitation.reply, undefined, 4),
      options: { apiVersion: 1 }
    }));

    loadChildInvitations(invitation.id);
  };

  var userModerationQueue = function(options) {
    var defaults = {
      container: '#notes',
      title: 'New Profiles Pending Moderation',
      onlyModeration: true,
      pageSize: 15
    };
    options = _.defaults(options, defaults);

    var $container = $(options.container).eq(0);

    var loadProfiles = function(offset) {
      offset = offset || 0;
      var needsModerationQuery = options.onlyModeration ? { needsModeration: true } : {};
      return get('/profiles', Object.assign(needsModerationQuery, {
        sort: 'tcdate:desc',
        limit: options.pageSize,
        offset: offset
      }))
        .then(function(result) {
          if (!result || !result.profiles) {
            return $.Deferred.reject();
          }
          return {
            profiles: result.profiles,
            totalCount: result.count,
            offset: offset
          };
        })
        .fail(showLoadingError);
    };

    var renderList = function(apiResult) {
      var pageNum = Math.floor(apiResult.offset / options.pageSize) + 1;
      $container.html(Handlebars.templates['partials/userModerationQueue']({
        title: options.title,
        profiles: apiResult.profiles,
        isModerationQueue: options.onlyModeration,
        totalCount: apiResult.totalCount,
        pageSize: options.pageSize,
        pageNum: pageNum
      }));
    };

    var initializeModal = function() {
      var formHtml = [
        '<form method="POST">',
          '<div class="form-group">',
            '<label for="message">Reason for Rejection:</label>',
            '<textarea name="message" class="form-control" rows="5" required></textarea>',
          '</div>',
        '</form>'
      ].join('');

      $(document.body).append(Handlebars.templates.genericModal({
        id: 'rejection-message-modal',
        showHeader: false,
        showFooter: true,
        body: formHtml
      }));
    };

    var showLoadingError = function() {
      $container.html('<div class="alert alert-danger"><strong>Error:</strong> ' +
        'Could not load profiles. Please reload the page and try again"</div>');
    };

    var registerEventHandlers = function() {
      $container.on('click', '.accept-profile', function() {
        var $row = $(this).closest('li');
        postModerationDecision($row.data('id'), true).then(function() {
          promptMessage($row.find('.col-name').text() + ' is now active', { scrollToTop: false });
          $row.fadeOut('fast');
        });
      });

      $container.on('click', '.reject-profile', function() {
        $('#rejection-message-modal form').data('profileId', $(this).closest('li').data('id'));
        $('#rejection-message-modal textarea').val('');
        $('#rejection-message-modal').modal('show');
      });

      $container.on('click', '.delete-profile', function() {
        console.warn('Deleting profiles is not currently possible from the UI');
      });

      $container.off('click', 'ul.pagination > li > a').on('click', 'ul.pagination > li > a', function() {
        var $target = $(this).parent();
        if ($target.hasClass('disabled') || $target.hasClass('active')) {
          return false;
        }
        var newPageNum = parseInt($target.data('pageNumber'), 10);
        if (isNaN(newPageNum)) {
          return false;
        }

        var newOffset = (newPageNum - 1) * options.pageSize;
        loadProfiles(newOffset).then(renderList);
        return false;
      });

      $('#rejection-message-modal form').on('submit', function() {
        var profileId = $(this).data('profileId');
        var $row = $('.profiles-list').find('li[data-id="' + profileId + '"]');
        var name = $row.find('.col-name').text();
        var message = $(this).find('textarea').val().trim();
        if (!message) {
          return false;
        }

        postModerationDecision(profileId, false, message).then(function() {
          promptMessage(name + ' has been rejected', { scrollToTop: false });
          $row.fadeOut();
        });

        $('#rejection-message-modal').modal('hide');
        return false;
      });

      $('#rejection-message-modal .modal-footer .btn-primary').on('click', function() {
        $('#rejection-message-modal form').submit();
      });
    };

    var postModerationDecision = function(profileId, decision, rejectionMessage) {
      return post('/activate/moderate', {
        id: profileId,
        activate: decision,
        reason: rejectionMessage
      });
    };

    loadProfiles()
      .then(renderList)
      .then(initializeModal)
      .then(registerEventHandlers);
  };

  // Deprecated
  var taskList = function(notePairs, tagInvitations, options) {
    var taskDefaults = {
      container: '#notes',
      showTasks: true,
      emptyMessage: 'No outstanding tasks to display'
    };
    options = _.defaults(options, taskDefaults, defaultDisplayOptions);

    var taskRows = [];
    _.forEach(tagInvitations, function(inv) {
      var duedate = new Date(inv.duedate);
      var duedateStr = duedate.toLocaleDateString('en-GB', dateOptions);

      if (inv.web) {
        taskRows.push([
          '<li class="note invitation-link">',
            '<a href="/invitation?id=' + inv.id + '">' + view.prettyId(inv.id) + '</a>',
            '<span class="duedate ' + getDueDateStatus(duedate) + '">Due: ' + duedateStr + '</span>',
          '</li>'
        ].join('\n'));
      }
    });

    _.forEach(notePairs, function(pair) {
      var inv = pair.invitation;
      var replytoNote = pair.replytoNote;

      var duedate = new Date(inv.duedate);
      inv.dueDateStr = duedate.toLocaleDateString('en-GB', dateOptions);
      inv.dueDateStatus = getDueDateStatus(duedate);
      inv.groupId = inv.id.split('/-/')[0];
      replytoNote.taskInvitation = inv;
      replytoNote.options = options;

      taskRows.push([
        '<li class="note" data-id="' + replytoNote.id + '">',
          Handlebars.templates['partials/noteBasic'](replytoNote),
        '</li>'
      ].join('\n'));
    });

    var $container = $(options.container);
    var taskRowsOrEmpty = taskRows.length ?
      taskRows.join('\n') :
      '<li><p class="empty-message">' + options.emptyMessage + '</p></li>';
    var noteListHtml = '<ul class="list-unstyled submissions-list">' + taskRowsOrEmpty + '</ul>';

    $container.append(noteListHtml);
  };

  var newTaskList = function(noteInvitations, tagInvitations, options) {
    var taskDefaults = {
      container: '#notes',
      showTasks: true,
      showContents: true,
      referrer: null,
      emptyMessage: 'No outstanding tasks to display'
    };
    options = _.defaults(options, taskDefaults, defaultDisplayOptions);

    var allInvitations = tagInvitations.concat(noteInvitations).sort(function(a, b) {
      return a.duedate - b.duedate;
    });

    allInvitations.forEach(function(inv) {
      var duedate = new Date(inv.duedate);
      inv.dueDateStr = duedate.toLocaleDateString('en-GB', dateOptions);
      inv.dueDateStatus = getDueDateStatus(duedate);
      inv.groupId = inv.id.split('/-/')[0];

      if (!inv.details) {
        inv.details = {};
      }

      if (!_.isEmpty(inv.details.replytoNote) || inv.reply.forum) {
        inv.noteInvitation = true;

        if (inv.details.repliedNotes?.length > 0) {
          inv.completed = true;
        }
        inv.noteId = inv.details.repliedNotes?.length === 1 ? inv.details.repliedNotes[0].id : inv.reply.replyto;

        if (_.isEmpty(inv.details.replytoNote)) {
          // Some invitations returned by the API do not contain replytoNote
          inv.details.replytoNote = { forum: inv.reply.forum };
        }
      } else {
        inv.tagInvitation = true;

        if (inv.taskCompletionCount && inv.details) {
          var repliedCount = (inv.details.repliedTags && inv.details.repliedTags.length) ||
            (inv.details.repliedEdges && inv.details.repliedEdges.length);
          if (repliedCount && repliedCount >= inv.taskCompletionCount) {
            // Temporary special case for Recommendation invitations. Uses hardcoded constant for
            // number of papers assigned.
            if (_.endsWith(inv.id, 'Recommendation')) {
              var groupedEdgesCounts = _.countBy(inv.details.repliedEdges, 'head');
              var allPapersRecommended = Object.keys(groupedEdgesCounts).length >= 20;
              inv.completed = allPapersRecommended && _.every(groupedEdgesCounts, function(count) {
                return count >= inv.taskCompletionCount;
              });
            } else {
              inv.completed = true;
            }
          }
        }
      }
    });

    temporaryMarkExpertiseCompleted(allInvitations);

    var $container = $(options.container);
    var taskListHtml = Handlebars.templates['partials/taskList']({
      invitations: allInvitations,
      taskOptions: options
    });

    $container.append(taskListHtml);
  };

  // Temporary hack:
  // Mark expertise selection task as completed when reviewer profile confirmation
  // or AC profile confirmation tasks are complete
  var temporaryMarkExpertiseCompleted = function(invitationsGroup) {
    var profileConfirmationInv = _.find(invitationsGroup, function(inv) {
      return _.endsWith(inv.id, 'Profile_Confirmation') || _.endsWith(inv.id, 'Registration');
    });
    var expertiseInv = _.find(invitationsGroup, function(inv) {
      return _.endsWith(inv.id, 'Expertise_Selection');
    });
    if (expertiseInv && profileConfirmationInv && profileConfirmationInv.completed) {
      expertiseInv.completed = true;
    }
  };

  var errorMessage = function(message) {
    message = message || 'The page could not be loaded at this time. Please try again later.';
    $('#notes').hide().html(
      '<div class="alert alert-danger">' +
      '<strong>Error:</strong> ' + message +
      '</div>'
    );
    return $('#notes').fadeIn('fast');
  };

  var loadingSpinner = function(container, options) {
    var defaults = {
      inline: false,
      overwrite: true,
      extraClasses: null
    };
    options = _.defaults(options, defaults);

    if (_.isEmpty(container)) {
      console.warn('Missing required parameter for spinner: container');
      return;
    }

    if (options.inline) {
      options.extraClasses = options.extraClasses ?
        options.extraClasses + ' spinner-inline' :
        'spinner-inline';
    }

    var $container = $(container);
    if (options.overwrite) {
      $container.empty();
    }
    return $container.append(Handlebars.templates.spinner({
      extraClasses: options.extraClasses
    }));
  };

  var editModeBanner = function(groupOrInvitationId, mode, overlay=false) {
    mode = mode || 'default';
    var pageType = window.location.pathname.toLowerCase().indexOf('group') !== -1 ? 'group' : 'invitation';
    var buttonText = mode === 'default' ? 'Edit' : 'View';
    var buttonUrl = (mode === 'default' ? `/${pageType}/edit` : `/${pageType}`) + '?id=' + groupOrInvitationId;
    var messageHtml = '<span class="important_message profile-flash-message">' +
      'Currently showing ' + pageType + ' in ' + mode + ' mode &nbsp;' +
      '<a href="' + buttonUrl + '" class="btn btn-xs btn-primary toggle-profile-mode">' +
      buttonText + ' ' + _.upperFirst(pageType) +
      '</a></span>';

    generalPrompt('info', messageHtml, { html: true, noTimeout: true, overlay: overlay, scrollToTop: false });
  };

  var done = function(options) {
    // Should be called after page is entirely finished rendering so that actions like registering
    // handlers and scrolling to anchors can be performed.
    var defaults = {
      tooltip: true,
      scrollTo: true,
      showFirstTab: true
    };
    options = _.defaults(options, defaults);

    if (options.tooltip) {
      $('[data-toggle="tooltip"]').tooltip();
    }

    if (options.scrollTo) {
      var scrollToElem;
      var scrollToElemId = window.location.hash;
      if ($('a[href="' + scrollToElemId + '"]').length) {
        scrollToElem = $('a[href="' + scrollToElemId + '"]');
      } else if ($(scrollToElemId).length) {
        scrollToElem = $(scrollToElemId);
      }

      if (scrollToElem) {
        scrollToElem.trigger('click', [true]);
        // 51 is the height of the nav bar, 12 is for padding
        var scrollPos = scrollToElem.offset().top - 51 - 12;
        $('html, body').animate({scrollTop: scrollPos}, 400);
      }
    }

    if (options.showFirstTab && $('.tabs-container').length &&
        !$('.tabs-container ul.nav-tabs > li.active').length) {
      $('.tabs-container ul.nav-tabs > li > a:visible').eq(0).trigger('click', [true]);
    }
  };

  return {
    get: get,
    post: post,
    put: put,
    delete: xhrDelete,
    getAll: getAll,
    setToken: setToken,
    sendFile: sendFile,
    getErrorFromJqXhr: getErrorFromJqXhr,
    setupAutoLoading: setupAutoLoading,
    disableAutoLoading: disableAutoLoading,
    editModeBanner: editModeBanner,
    filterCollections: filterCollections,
    _registerActionButtonHandlers: _registerActionButtonHandlers,
    api: {
      getSubmissionInvitation: getSubmissionInvitation,
      getSubmissions: getSubmissions,
      getTagInvitations: getTagInvitations
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
      groupInfo: groupInfo,
      groupEditor: groupEditor,
      invitationInfo: invitationInfo,
      userModerationQueue: userModerationQueue,
      spinner: loadingSpinner,
      errorMessage: errorMessage,
      defaultEmptyMessage: defaultEmptyMessage,
      done: done
    }
  };
}());
