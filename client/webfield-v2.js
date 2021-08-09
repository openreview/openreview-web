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
      version: 2,
      cache: true // Note: IE won't get updated when cache is enabled
    };
    options = _.defaults(options, defaults);
    var defaultHeaders = { 'Access-Control-Allow-Origin': '*' };
    var authHeaders = token ? { Authorization: 'Bearer ' + token } : {};
    var baseUrl = window.OR_API_V2_URL || '';
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
      version: 2,
    };
    options = _.defaults(options, defaults);
    var defaultHeaders = { 'Access-Control-Allow-Origin': '*' };
    var authHeaders = token ? { Authorization: 'Bearer ' + token } : {};
    var baseUrl = window.OR_API_V2_URL || '';
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
      version: 2,
    };
    options = _.defaults(options, defaults);
    var defaultHeaders = { 'Access-Control-Allow-Origin': '*' };
    var authHeaders = token ? { Authorization: 'Bearer ' + token } : {};
    var baseUrl = window.OR_API_V2_URL || '';
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
      version: 2,
    };
    options = _.defaults(options, defaults);
    var defaultHeaders = { 'Access-Control-Allow-Origin': '*' };
    var authHeaders = token ? { Authorization: 'Bearer ' + token } : {};
    var baseUrl = window.OR_API_V2_URL || '';
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
          // eslint-disable-next-line prefer-spread
          return $.when.apply($, remainingRequests)
            .then(function() {
              // eslint-disable-next-line prefer-rest-params
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
    var notSignatoryError = errorText.type === 'notSignatory' && errorText.path === 'signatures' && _.startsWith(errorText.user, 'guest_');
    var forbiddenError = (errorText.type === 'forbidden' || errorText.type === 'ForbiddenError') && _.startsWith(errorText.user, 'guest_');

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
    var errorResponse = jqXhr.responseJSON;
    var errorText = 'Something went wrong';
    if (textStatus === 'timeout') {
      // If the request timed out, display a special message and don't call
      // the onError callback to prevent it from chaining or not displaying the mesage.
      errorText = 'OpenReview is currently under heavy load. Please try again soon.';
      return errorText;
    }

    if (errorResponse) {
      if (errorResponse.errors && errorResponse.errors.length) {
        errorText = errorResponse.errors[0];
      } else if (errorResponse.message) {
        errorText = errorResponse.message;
      }
    }
    return errorText;
  };

  var setToken = function(newAccessToken) {
    token = newAccessToken;
  };

  var getInvitation = function(invitationId, options) {
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
      details: 'replyCount',
      pageSize: 100,
      offset: 0,
      includeCount: false
    };
    options = _.defaults(options, defaults);

    options.limit = options.pageSize;
    options = _.omit(options, 'pageSize');

    var urlParams = _.assign({invitation: invitationId}, options);
    return get('/notes', urlParams)
      .then(function(result) {
        if (options.includeCount) {
          return result;
        } else {
          return result.notes;
        }
      });
  };

  var sendFile = function(url, data, contentType) {
    var baseUrl = window.OR_API_V2_URL ? window.OR_API_V2_URL : '';
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
      const memberAnonIdMap = new Map();
      if (group.anonids && options.isSuperUser) {
        const anonGroupRegex = groupId.endsWith('s') ? `${groupId.slice(0, -1)}_` : `${groupId}_`;
        const result = await get(`/groups?regex=${anonGroupRegex}`);
        groupMembers.forEach((m) => {
          const anonId = result.groups.find(p => p?.members === m)?.id;
          memberAnonIdMap.set(m, {
            id: anonId,
            prettyId: anonId ? view.prettyId(anonId) : null
          });
        });
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
        })
      );

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
        .filter(function(id) { return id; }); // Filter empty strings

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
        setTimeout(function() { Webfield.editModeBanner(groupId, 'edit'); }, 8250);
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
            Webfield.editModeBanner(groupId, 'edit');
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
          // may need to show/remove annon id
          if (options.isSuperUser) renderMembersTable(group.members, removedMembers);
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

          showEmailProgress(response.jobId);

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
              '<br><br><em>Note: The number of emails sent may not exactly match the number of users you selected if multiple IDs belonging to the same user were included.</em>';
          } else if (isQueuing) {
            statusText = '<strong>Queuing emails:</strong> ' + queued + ' / ' + totalQueued + ' complete';
          } else {
            statusText = '<strong>Sending emails:</strong> ' + sent + ' / ' + totalSent + ' complete';
          }

          $progress.find('.progress-bar')
            .attr('aria-valuenow', isQueuing ? queued : sent)
            .attr('aria-valuemax', isQueuing ? totalQueued : totalSent)
            .css('width', percentComplete + '%')
            .find('span').text(percentComplete + '%');
          $container.find('section.messages .progress-status')
            .html(statusText);

          if (status.status === 'ok') {
            clearInterval(refreshTimer);
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
          // eslint-disable-next-line no-undef
          editor = ace.edit('webfield-editor');
          editor.setTheme('ace/theme/chrome');
          editor.setOption('tabSize', 2);
          editor.setOption('showPrintMargin', false);
          editor.session.setMode('ace/mode/javascript');
          editor.session.setUseWrapMode(true);
          editor.session.setUseSoftTabs(true);
          editor.session.setValue(webfieldCode || ''); // setValue doesn't accept null

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
      // eslint-disable-next-line no-undef
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
    if (Number.isNaN(pageNum)) {
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

  var invitationInfo = function(invitation, options) {
    var defaults = {
      container: '#notes',
    };
    options = _.defaults(options, defaults);

    var $container = $(options.container);
    var parentGroupId = invitation.id.split('/-/')[0];

    $container.empty().append(Handlebars.templates['partials/invitationInfo']({
      invitation: invitation,
      parentGroupId: parentGroupId,
      replyJson: JSON.stringify(invitation.edit, undefined, 4),
      options: { apiVersion: 2 }
    }));

    loadChildInvitations(invitation.id);
  };

  var invitationEditor = function(invitation, options) {
    var defaults = {
      container: '#notes',
      showProcessEditor: false,
    };
    options = _.defaults(options, defaults);

    var $container = $(options.container);
    var parentGroupId = invitation.id.split('/-/')[0];
    var editors = { webfield: null, process: null, preprocess: null };

    $container.empty().append(Handlebars.templates['partials/invitationEditor']({
      invitation: invitation,
      parentGroupId: parentGroupId,
      replyJson: JSON.stringify(invitation.edit, undefined, 4),
      replyForumViewsJson: JSON.stringify(invitation.replyForumViews || [], undefined, 4),
      options: {
        showProcessEditor: options.showProcessEditor,
        apiVersion: 2,
      }
    }));
    $container.off();

    loadChildInvitations(invitation.id);
    setupDatePickers();

    // Helpers
    function showAlert(message, alertOptions) {
      var defaults = {
        scrollToTop: true,
        noTimeout: true
      };
      alertOptions = _.defaults(alertOptions, defaults);

      $('#flash-message-container').slideUp('fast', function() {
        promptMessage(message, alertOptions);
        setTimeout(function() {
          $('#flash-message-container').slideUp('fast', function() {
            Webfield.editModeBanner(invitation.id, 'edit');
          });
        }, 2500);
      });
    }

    function setupDatePickers() {
      $('.datetimepicker').each(function() {
        var timestamp = parseInt($(this).parent().next().val(), 10);
        var date = timestamp ? moment(timestamp) : null;

        $(this).datetimepicker({
          date: date,
          useCurrent: false
        });
      });
    }

    function updateInvitation(modifiedFields) {
      var baseFields = _.pick(invitation, ['id', 'signatures']);
      return post('/invitations/edits', {
        readers: [options.userId],
        writers: [options.userId],
        signatures: [options.userId],
        invitation: { ...baseFields, ...modifiedFields },
      }, { version: 2 }).then(function(response) {
        return response.invitation;
      });
    }

    function updateModifiedDate() {
      var dateToDisplay = invitation.mdate || invitation.tmdate;
      var d = moment.tz(dateToDisplay, moment.tz.guess());
      var modifiedDateStr = '';
      if (d.isValid()) {
        modifiedDateStr = moment.tz(dateToDisplay, moment.tz.guess()).format('LLL z');
      }
      $('.group-info-table .mdate').text(modifiedDateStr);
    }

    // Event Handlers
    $container.on('click', '.edit-group-info', function() {
      $(this).hide();
      $('.group-info-table').hide();
      $('.group-info-form').show();
    });

    $container.on('dp.change', '.datetimepicker', function(e) {
      var newTimestamp = null;
      if (e.date) {
        var selectedTimezone = $(this).siblings('.timezone').val();
        var newMoment = moment.tz(e.date.format('YYYY-MM-DD HH:mm'), selectedTimezone);
        newTimestamp = newMoment.valueOf();
      }
      $(this).parent().next().val(newTimestamp);
    });

    $container.on('change', '.timezone', function(e) {
      var $widget = $(this).siblings('.datetimepicker');
      if (!$widget.length) {
        return;
      }
      var currentMoment = $widget.data('DateTimePicker').date();
      if (!currentMoment) {
        return;
      }

      var selectedTimezone = $(this).val();
      var newMoment = moment.tz(currentMoment.format('YYYY-MM-DD HH:mm'), selectedTimezone);
      $(this).parent().next().val(newMoment.valueOf());
    });

    $container.on('submit', '.group-info-form', function() {
      var $submitButton = $(this).find('button[type="submit"]');
      if ($submitButton.hasClass('disabled')) {
        return false;
      }
      $submitButton.addClass('disabled');

      var defaults = { bulk: null };
      var formData = _.reduce($(this).serializeArray(), function(result, field) {
        if (field.name === 'multiReply' || field.name === 'hideOriginalRevisions' || field.name === 'bulk') {
          result[field.name] = field.value === '' ? null : field.value === 'True';
        } else if (field.name === 'duedate' || field.name === 'expdate' || field.name === 'cdate') {
          result[field.name] = field.value ? parseInt(field.value, 10) : null;
        } else if (field.name === 'super') {
          var superId = _.trim(field.value);
          if (superId) {
            result[field.name] = superId;
          }
        } else {
          result[field.name] = _.compact(field.value.split(',').map(_.trim));
        }
        return result;
      }, defaults);

      updateInvitation(formData)
        .then(function(response) {
          invitation = response;

          // Re-render info table
          $('section.general .datetimepicker').each(function() {
            $(this).data('DateTimePicker').destroy();
          });
          $('section.general').html(
            '<h4>General Info</h4>' +
            Handlebars.templates['partials/invitationInfoTable']({
              invitation: invitation,
              parentGroupId: parentGroupId,
              editable: true
            })
          );
          setupDatePickers();

          showAlert('Settings for ' + view.prettyId(invitation.id) + ' updated');
        })
        .always(function() {
          $submitButton.removeClass('disabled');
        });

      return false;
    });

    $container.on('click', '.group-info-form .cancel-edit-group', function() {
      // Change timezone dropdown back to local timezone
      var userTimezone = $('.group-info-form select.timezone option[data-user-default]').attr('value');
      $('.group-info-form select.timezone').val(userTimezone).change();

      $('.group-info-form').hide();
      $('.edit-group-info').show();
      $('.group-info-table').show();
    });

    $container.on('submit', '.invitation-reply-form, .invitation-forum-views-form', function() {
      var rawStr = $(this).find('textarea').val();
      var compactStr = rawStr.split('\n').map(function(line) { return line.trim(); }).join('');

      $(this).find('.alert-danger').hide();

      var parsedObj;
      try {
        parsedObj = JSON.parse(compactStr);
      } catch (error) {
        $(this).find('.alert-danger').show();
        return false;
      }

      var updateObj;
      if ($(this).hasClass('invitation-reply-form')) {
        // Have to set the fields of the content object to null, so if a user is removing
        // or renaming a field it will be deleted.
        var defaultContent = { ...invitation.edit.note.content };
        Object.keys(defaultContent).forEach(function(key) {
          defaultContent[key] = null;
        });
        updateObj = {
          edit: _.merge({
            note: {
              signatures: null, readers: null, writers: null, content: defaultContent
            }
          }, parsedObj),
        };
      } else {
        updateObj = { replyForumViews: parsedObj };
      }

      updateInvitation(updateObj)
        .then(function(response) {
          invitation = response;
          updateModifiedDate();
          showAlert('Settings for ' + view.prettyId(invitation.id) + ' updated');
        });

      return false;
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

      var $section = $btn.closest('section');
      $section.find('.alert-danger').remove();

      var showError = function(errorMsg) {
        $btn.prop('disabled', false).find('.spinner-small').remove();
        $btn.before(
          '<div class="alert alert-danger"><span>' + errorMsg + '</span></div>'
        );
      };

      get('/invitations', { id: invitation.id }).then(function(response) {
        if (!response.invitations || !response.invitations.length) {
          showError('Could not load invitation code. Please refresh the page and try again.');
          return;
        }

        var codeToEdit;
        var editorType;
        if ($section.hasClass('webfield')) {
          editorType = 'webfield';
          codeToEdit = response.invitations[0].web;
        } else if ($section.hasClass('process')) {
          editorType = 'process';
          codeToEdit = response.invitations[0].process;
        } else if ($section.hasClass('preprocess')) {
          editorType = 'preprocess';
          codeToEdit = response.invitations[0].preprocess;
        }

        var syntaxMode = _.startsWith(codeToEdit, 'def process(') ? 'ace/mode/python' : 'ace/mode/javascript';

        $.ajax({
          url: 'https://cdn.jsdelivr.net/npm/ace-builds@1.4.12/src-min/ace.js',
          dataType: 'script',
          cache: true
        }).then(function() {
          // eslint-disable-next-line no-undef
          editors[editorType] = ace.edit(editorType + '-editor');
          editors[editorType].setTheme('ace/theme/chrome');
          editors[editorType].setOption('tabSize', 2);
          editors[editorType].setOption('showPrintMargin', false);
          editors[editorType].session.setMode(syntaxMode);
          editors[editorType].session.setUseWrapMode(true);
          editors[editorType].session.setUseSoftTabs(true);
          editors[editorType].session.setValue(codeToEdit || ''); // setValue doesn't accept null

          $btn.hide().prop('disabled', false).find('.spinner-small').remove();
          $section.find('.webfield-editor-container').show();
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

      var $section = $btn.closest('section');
      var editorType;
      var fieldName;
      if ($section.hasClass('webfield')) {
        editorType = 'webfield';
        fieldName = 'web';
      } else if ($section.hasClass('process')) {
        editorType = 'process';
        fieldName = 'process';
      } else if ($section.hasClass('preprocess')) {
        editorType = 'preprocess';
        fieldName = 'preprocess';
      }

      var newCode = editors[editorType].getSession().getValue().trim();
      var updateObj = {};
      if (newCode) {
        newCode += '\n';
        updateObj[fieldName] = newCode;
      } else {
        updateObj[fieldName] = null;
      }

      editors[editorType].setValue(newCode);
      editors[editorType].gotoLine(1);

      updateInvitation(updateObj)
        .then(function(response) {
          invitation = response;
          updateModifiedDate();
          showAlert(_.upperFirst(fieldName) + ' code for ' + invitation.id + ' has been updated', { scrollToTop: false });
        })
        .always(function() {
          $btn.prop('disabled', false).find('.spinner-small').remove();
        });

      return false;
    });

    $container.on('click', 'button.cancel-btn', function() {
      $(this).closest('.webfield-editor-container').hide().prev('.load-editor-btn').show();
      // eslint-disable-next-line no-undef
      ace = undefined;
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
      offset: options.offset
    };

    if (options.invitation) {
      searchParams.invitation = options.invitation;
    }

    return get('/notes/search', searchParams)
      .then(function(result) {
        return result.notes;
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
              var contentFieldValue = contentField.value;
              if (_.isString(contentFieldValue)) {
                contentFieldValue = contentFieldValue.toLowerCase();
                if (contentFieldValue.indexOf(searchParams.term) !== -1) {
                  // indexOf works for both arrays and strings
                  foundTermMatch = true;
                  break;
                }
              }
              if (_.isArray(contentFieldValue)) {
                var found = _.some(contentFieldValue, function(value, searchParams) {
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
          if (_.isArray(noteContent?.subject_areas.value)) { // jshint ignore:line
            subjectAreas = noteContent.subject_areas.value; // jshint ignore:line
          } else if (_.isArray(noteContent?.keywords)) {
            subjectAreas = noteContent.keywords.value;
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
      return searchSubmissions(groupId, searchParams.term, {pageSize: searchParams.pageSize, invitation: searchParams.invitation})
        .then(searchParams.onResults);
    }
  };

  var renderInvitationButton = function(container, invitationId, options) {
    var defaults = {
      onNoteCreated: function() { console.warn('onNoteCreated option is required'); },
    };
    options = _.assign(defaults, options);
    getInvitation(invitationId)
      .then(function(invitation) {
        Webfield.ui.submissionButton(invitation, user, {
          container: container,
          onNoteCreated: options.onNoteCreated
        });
      });
  }

  var renderTabPanel = function(container, titles, options) {
    var loadingMessage = '<p class="empty-message">Loading...</p>';
    var tabsList = [];
    titles.forEach(function(title) {
      tabsList.push({
        heading: title,
        id: title.replace(/\s/g, '-').toLowerCase(),
        content: loadingMessage
      })
    })
    tabsList[0].active = true;
    tabsList[0].extraClasses = 'horizontal-scroll'; //do we need this?
    Webfield.ui.tabPanel(tabsList, { container: container });
  }

  var setup = function(container, venueId, options) {
    var defaults = {
      title: venueId,
      instructions: 'Instructions here',
      tabs: [],
      referrer: null
    };
    options = _.defaults(options, defaults);

    if (options.referrer) {
      OpenBanner.referrerLink(options.referrer);
    } else {
      OpenBanner.venueHomepageLink(venueId);
    }
    Webfield.ui.setup(container, venueId);
    Webfield.ui.header(options.title, options.instructions);
    if (options.tabs.length) {
      renderTabPanel('#notes', options.tabs);
    }
  }

  var submissionList = function(notes, options) {
    var defaults = {
      heading: 'Submitted Papers',
      container: '#notes',
      emptyContainer: true,
      search: {
        enabled: true,
        localSearch: true,
        invitation: null,
        subjectAreas: null,
        subjectAreaDropdown: 'advanced',
        pageSize: 1000,
        placeholder: 'Search by paper title and metadata',
        onResults: function() {},
        onReset: function() {}
      },
      displayOptions: Webfield.defaultDisplayOptions,
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
        var newValue = $self.text().trim();
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
      _registerActionButtonHandlersV2(
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
            Handlebars.templates['partials/noteListV2']({
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

  return {
    get: get,
    post: post,
    put: put,
    delete: xhrDelete,
    getAll: getAll,
    setToken: setToken,
    sendFile: sendFile,
    getErrorFromJqXhr: getErrorFromJqXhr,
    // Aliases
    setupAutoLoading: Webfield.setupAutoLoading,
    disableAutoLoading: Webfield.disableAutoLoading,
    editModeBanner: Webfield.editModeBanner,
    filterCollections: Webfield.filterCollections,

    api: {
      // Aliases
      getInvitation: getInvitation,
      getSubmissions: getSubmissions,
      getTagInvitations: Webfield.api.getTagInvitations
    },

    ui: {
      groupInfo: groupInfo,
      groupEditor: groupEditor,
      invitationInfo: invitationInfo,
      invitationEditor: invitationEditor,
      renderInvitationButton: renderInvitationButton,
      // Aliases
      setup: setup,
      header: Webfield.ui.basicHeader,
      venueHeader: Webfield.ui.venueHeader,
      linksList: Webfield.ui.linksList,
      accordion: Webfield.ui.accordion,
      submissionButton: Webfield.ui.invitationButtonAndNoteEditor,
      submissionList: submissionList,
      taskList: Webfield.ui.taskList,
      newTaskList: Webfield.ui.newTaskList,
      activityList: Webfield.ui.activityList,
      tabPanel: Webfield.ui.tabPanel,
      searchResults: Webfield.ui.searchResults,
      userModerationQueue: Webfield.ui.userModerationQueue,
      spinner: Webfield.ui.loadingSpinner,
      errorMessage: Webfield.ui.errorMessage,
      defaultEmptyMessage: Webfield.ui.defaultEmptyMessage,
      done: Webfield.ui.done
    }
  };
}());
