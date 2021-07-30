module.exports = (function() {
  // Save authentication token as a private var
  var token;

  // AJAX Functions
  var getV2 = function(url, queryObj, options) {
    var defaults = {
      handleErrors: true,
      cache: true // Note: IE won't get updated when cache is enabled
    };
    options = _.defaults(options, defaults);
    var defaultHeaders = { 'Access-Control-Allow-Origin': '*' }
    var authHeaders =  token ? { Authorization: 'Bearer ' + token } : {};
    var baseUrl = window.OR_API_V2_URL ? window.OR_API_V2_URL : '';
    var errorCallback = options.handleErrors ? Webfield.jqErrorCallback : null;

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
    }).then(Webfield.jqSuccessCallback, errorCallback);
  };

  var postV2 = function(url, queryObj, options) {
    var defaults = {
      handleErrors: true,
    };
    options = _.defaults(options, defaults);
    var defaultHeaders = { 'Access-Control-Allow-Origin': '*' }
    var authHeaders =  token ? { Authorization: 'Bearer ' + token } : {};
    var baseUrl = window.OR_API_V2_URL ? window.OR_API_V2_URL : '';
    var errorCallback = options.handleErrors ? Webfield.jqErrorCallback : null;

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
    }).then(Webfield.jqSuccessCallback, errorCallback);
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

    return getV2(url, Object.assign({}, queryObj, { offset: offset }))
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

  var setToken = function(newAccessToken) {
    token = newAccessToken;
  };

  var sendFileV2 = function(url, data, contentType) {
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

  // API Functions
  var getSubmissionInvitationV2 = function(invitationId, options) {
    var defaults = {
    };
    options = _.assign(defaults, options);

    // Don't use the Webfield get function so the fail callback can be overridden
    return getV2('/invitations', { id: invitationId }, { handleErrors: false })
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

  var getSubmissionsV2 = function(invitationId, options) {
    // Any url param accepted by /notes can be passed in via the options object
    var defaults = {
      details: 'replyCount,invitation,tags',
      pageSize: 100,
      offset: 0,
      includeCount: false
    };
    options = _.defaults(options, defaults);

    options.limit = options.pageSize;
    options = _.omit(options, 'pageSize');

    var urlParams = _.assign({invitation: invitationId}, options);
    return getV2('/notes', urlParams)
      .then(function(result) {
        if (options.includeCount) {
          return result;
        } else {
          return result.notes;
        }
      });
  };

  // UI Functions
  var submissionListV2 = function(notes, options) {
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
      var submissionListHtml = Handlebars.templates['components/submissionsV2']({
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
              Webfield.filterNotes(notes, {
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
              Webfield.filterNotes(notes, {
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

            Webfield.filterNotes(notes, {
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
              Webfield.filterNotes(notes, _.assign({
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
          var errorText = Webfield.getErrorFromJqXhr(jqXhr, textStatus);
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
              var errorText = Webfield.getErrorFromJqXhr(jqXhr, textStatus);
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
            var errorText = Webfield.getErrorFromJqXhr(jqXhr, textStatus);
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

  var activityListV2 = function(notes, options) {
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
    options = _.defaults(options, activityDefaults, Webfield.defaultDisplayOptions);

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
        var prettySig = view.prettyId(note.signatures?.[0]);
        if (prettySig === '(anonymous)' || prettySig === '(guest)') {
          prettySig = 'Anonymous';
        } else if (prettySig === 'Super User') {
          prettySig = 'An Administrator';
        }
        note.details.formattedSignature = prettySig;
      }

      note.details.isForum = note.forum === note.id;

      var invitationArr = note.invitations[0].split('/-/');
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
    $container.append(Handlebars.templates['partials/activityListV2']({
      notes: notes,
      activityOptions: options
    }));

    if (options.showActionButtons) {
      _registerActionButtonHandlersV2(
        $container, notes, Handlebars.templates['partials/noteActivityV2'], options
      );
    }

    typesetMathJax();
  };

  var _registerActionButtonHandlersV2 = function($container, notes, noteTemplateFn, options) {
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

      return getV2('/invitations', { id: existingNote.invitation }).then(function(result) {
        var invitationObj = _.get(result, 'invitations[0]', {});

        $('#note-editor-modal').remove();
        $('body').append(Handlebars.templates.genericModal({
          id: 'note-editor-modal',
          extraClasses: 'modal-lg',
          showHeader: false,
          showFooter: false
        }));
        $('#note-editor-modal').modal('show');

        view2.mkNoteEditorV2(existingNote, invitationObj, user, {
          onNoteEdited: function(result) {
            $('#note-editor-modal').modal('hide');
            existingNote.content = result.note?.content;
            existingNote.tmdate = Date.now();
            details.isUpdated = true;
            $note.html(
              noteTemplateFn(Object.assign({}, existingNote, { details: details, options: options }))
            );
            promptMessage('Note updated successfully');

            // update notes object so that subsequent update has latest value
            // result (from POST) can have more properties so can't just assign to note (from GET)
            var indexOfUpdatedNote = _.findIndex(notes, ['id', result.note?.id]);
            Object.keys(notes[indexOfUpdatedNote]).forEach(function(key) {
              if (key !== 'details') {
                notes[indexOfUpdatedNote][key] = result.note?.[key];
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

      view2.deleteOrRestoreNoteV2(existingNote, noteTitle, user, function(newNote) {
        $note.addClass('trashed').html(
          noteTemplateFn({ ...newNote, details: { ...newNote.details, isDeleted: true }, options: options })
        );
        return _.isFunction(options.onNoteTrashed) ? options.onNoteTrashed(newNote) : true;
      });
    });

    // Restore button handler
    $container.on('click', '.note-action-restore', function(e) {
      var $note = $(this).closest('.note');
      var noteId = $note.data('id');
      var noteTitle = $note.find('h4 > a').eq(0).text().replace('[Deleted]', '');
      var existingNote = _.find(notes, ['id', noteId]);
      if (!existingNote) {
        return;
      }

      // postV2('/notes/edits', existingNote).then(function(newNote) {
      //   details.isDeleted = false;
      //   $note.removeClass('trashed').html(
      //     noteTemplateFn(Object.assign({}, newNote, { details: details, options: options }))
      //   );
      //   return _.isFunction(options.onNoteRestored) ? options.onNoteRestored(newNote) : true;
      // });

      view2.deleteOrRestoreNoteV2(existingNote, noteTitle, user, function(newNote) {
        $note.removeClass('trashed').html(
          noteTemplateFn({ ...newNote, details: { ...newNote.details,isDeleted: false }, options: options })
        );
        return _.isFunction(options.onNoteTrashed) ? options.onNoteTrashed(newNote) : true;
      });
    });
  };

  // Util functions
  var getGroupsByNumber = function(venueId, roleName, options) {
    var defaults = {
      numberToken: 'Paper',
    };
    options = _.defaults(options, defaults);

    var anonRoleName = roleName.slice(0, -1) + '_';
    var numberToken = options.numberToken;
    var query = {
      regex: venueId + '/' + numberToken + '.*',
      select: 'id,members'
    }
    if (options && options.assigned) {
      query.member = user.id
    }
    return getAll('/groups', query)
    .then(function(groups) {
      var paperGroups = [];
      var anonPaperGroups = [];
      groups.forEach(function(group) {
        if (group.id.endsWith('/' + roleName)) {
          paperGroups.push(group);
        } else if (_.includes(group.id, '/' + anonRoleName)) {
          anonPaperGroups.push(group);
        }
      });
      var groupsByNumber = {};
      paperGroups.forEach(function(group) {
        var number = getNumberfromGroup(group.id, numberToken);
        var memberGroups = [];
        group.members.forEach(function(member) {
          var anonGroup = anonPaperGroups.find(function(anonGroup) {
            return anonGroup.id.startsWith(venueId + '/' + numberToken + number) && anonGroup.members[0] == member;
          })
          memberGroups.push({
            id: member,
            anonId: anonGroup && getNumberfromGroup(anonGroup.id, anonRoleName)
          })
        });
        groupsByNumber[number] = memberGroups;
      })
      return groupsByNumber;
    })
  }

  var getSubmissions = function(invitationId, options) {
    var noteNumbers = options.numbers;
    if (noteNumbers.length) {
      var noteNumbersStr = noteNumbers.join(',');

      return getAll('/notes', {
        invitation: invitationId,
        number: noteNumbersStr,
        select: 'id,number,forum,content,details,invitations',
        details: 'directReplies',
        sort: 'number:asc'
      });

    } else {
      blindedNotesP = $.Deferred().resolve([]);
    }
  }

  var getAssignedInvitations = function(venueId, roleName) {

    var invitationsP = getAll('/invitations', {
      regex: venueId + '/.*',
      invitee: true,
      duedate: true,
      replyto: true,
      type: 'notes',
      details: 'replytoNote,repliedNotes',
      version: '1' //TODO: remove when the task view supports V2
    });

    var edgeInvitationsP = getAll('/invitations', {
      regex: venueId + '/.*',
      invitee: true,
      duedate: true,
      type: 'edges',
      details: 'repliedEdges',
      version: '1' //TODO: remove when the task view supports V2
    });

    var tagInvitationsP = getAll('/invitations', {
      regex: venueId + '/.*',
      invitee: true,
      duedate: true,
      type: 'tags',
      details: 'repliedTags',
      version: '1' //TODO: remove when the task view supports V2
    });

    var filterInvitee = function(inv) {
      return _.some(inv.invitees, function(invitee) { return invitee.indexOf(roleName) !== -1; });
    };

    return $.when(
      invitationsP,
      edgeInvitationsP,
      tagInvitationsP
    ).then(function(noteInvitations, edgeInvitations, tagInvitations) {
      var invitations = noteInvitations.concat(edgeInvitations).concat(tagInvitations);
      return _.filter(invitations, filterInvitee);
    });
  };

  var getNumberfromGroup = function(groupId, name) {
    var tokens = groupId.split('/');
    var paper = _.find(tokens, function(token) {
      return _.startsWith(token, name);
    });

    if (paper) {
      return paper.replace(name, '');
    } else {
      return null;
    }
  };

  var getPaperNumbersfromGroups = function(groups) {
    return _.uniq(_.map(groups, function(group) {
      return parseInt(getNumberfromGroup(group.id, 'Paper'));
    }));
  };

  var renderTable = function(container, rows, options) {
    var defaults = {
      renders:[],
      headings: rows.length ? Object.keys(rows[0]) : [],
      extraClasses: 'ac-console-table',
      reminderOptions: {
        container: 'a.send-reminder-link',
        defaultSubject: 'Reminder',
        defaultBody: 'This is a reminder to please submit your review. \n\n Thank you,\n'
      }
    };
    options = _.defaults(options, defaults);

    var defaultRender = function(row) {
      var propertiesHtml = '';
      Object.keys(row).forEach(function(key) {
        propertiesHtml = propertiesHtml + '<tr><td><strong>' + key + '</strong></td><td>' + row[key] + '</td></tr>';
      })
      return '<div><table class="table table-condensed table-minimal"><tbody>' + propertiesHtml + '</tbody></table></div>';
    }

    var render = function(rows) {
      var rowsHtml = rows.map(function(row) {
        return Object.values(row).map(function(cell, i) {
          var fn = options.renders[i] || defaultRender;
          return fn(cell);
        });
      });

      var tableHtml = Handlebars.templates['components/table']({
        headings: options.headings,
        rows: rowsHtml,
        extraClasses: options.extraClasses
      });

      $('.table-container', container).remove();
      $(container).append(tableHtml);
    }

    var registerHelpers = function() {
      $(container).on('change', '#select-all-papers', function(e) {
        var $superCheckBox = $(this);
        var $allPaperCheckBoxes = $('input.select-note-reviewers');
        var $msgReviewerButton = $('#message-reviewers-btn');
        if ($superCheckBox[0].checked === true) {
          $allPaperCheckBoxes.prop('checked', true);
          $msgReviewerButton.attr('disabled', false);
        } else {
          $allPaperCheckBoxes.prop('checked', false);
          $msgReviewerButton.attr('disabled', true);
        }
      });

      $(container).on('click', options.reminderOptions.container, function(e) {
        var $link = $(this);
        var userId = $link.data('userId');
        var forumUrl = $link.data('forumUrl');

        var sendReviewerReminderEmails = function(e) {
          var postData = {
            groups: [userId],
            forumUrl: forumUrl,
            subject: $('#message-reviewers-modal input[name="subject"]').val().trim(),
            message: $('#message-reviewers-modal textarea[name="message"]').val().trim(),
          };

          $('#message-reviewers-modal').modal('hide');
          promptMessage('A reminder email has been sent to ' + view.prettyId(userId), { overlay: true });
          postReviewerEmails(postData);
          $link.after(' (Last sent: ' + (new Date()).toLocaleDateString() + ')');

          return false;
        };

        var modalHtml = Handlebars.templates.messageReviewersModalFewerOptions({
          singleRecipient: true,
          reviewerId: userId,
          forumUrl: forumUrl,
          defaultSubject: options.reminderOptions.defaultSubject,
          defaultBody: options.reminderOptions.defaultBody,
        });
        $('#message-reviewers-modal').remove();
        $('body').append(modalHtml);

        $('#message-reviewers-modal .btn-primary').on('click', sendReviewerReminderEmails);
        $('#message-reviewers-modal form').on('submit', sendReviewerReminderEmails);

        $('#message-reviewers-modal').modal();
        return false;
      });

      var postReviewerEmails = function(postData) {
        postData.message = postData.message.replace(
          '{{submit_review_link}}',
          postData.forumUrl
        );

        return Webfield.post('/messages', _.pick(postData, ['groups', 'subject', 'message']))
          .then(function(response) {
            // Save the timestamp in the local storage
            for (var i = 0; i < postData.groups.length; i++) {
              var userId = postData.groups[i];
              localStorage.setItem(postData.forumUrl + '|' + userId, Date.now());
            }
          });
      };

    }

    if (options.sortOptions) {
      var order = 'desc';
      var sortOptionHtml = Object.keys(options.sortOptions).map(function(option) {
        return '<option value="' + option + '">' + option.replace(/_/g, ' ') + '</option>';
      }).join('\n');

      //#region sortBarHtml
      var sortBarHtml = '<form class="form-inline search-form clearfix" role="search">' +
        // Don't show this for now
        // '<div id="div-msg-reviewers" class="btn-group" role="group">' +
        //   '<button id="message-reviewers-btn" type="button" class="btn btn-icon dropdown-toggle" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false" title="Select papers to message corresponding reviewers" disabled="disabled">' +
        //     '<span class="glyphicon glyphicon-envelope"></span> &nbsp;Message ' +
        //     '<span class="caret"></span>' +
        //   '</button>' +
        //   '<ul class="dropdown-menu" aria-labelledby="grp-msg-reviewers-btn">' +
        //     '<li><a id="msg-all-reviewers">All Reviewers of selected papers</a></li>' +
        //     '<li><a id="msg-submitted-reviewers">Reviewers of selected papers with submitted reviews</a></li>' +
        //     '<li><a id="msg-unsubmitted-reviewers">Reviewers of selected papers with unsubmitted reviews</a></li>' +
        //   '</ul>' +
        // '</div>' +
        // '<div class="btn-group"><button class="btn btn-export-data" type="button">Export</button></div>' +
        '<div class="pull-right">' +
          '<strong style="vertical-align: middle;">Search:</strong>' +
          '<input type="text" class="form-search form-control" class="form-control" placeholder="Enter search term or type + to start a query and press enter" style="width:440px; margin-right: 1.5rem; line-height: 34px;">' +
          '<strong>Sort By:</strong> ' +
          '<select id="form-sort" class="form-control" style="width: 250px; line-height: 1rem;">' + sortOptionHtml + '</select>' +
          '<button id="form-order" class="btn btn-icon" type="button"><span class="glyphicon glyphicon-sort"></span></button>' +
        '</div>' +
      '</form>';
      //#endregion

      if (rows.length) {
        $(container).empty().append(sortBarHtml);
      }

      // Need to add event handlers for these controls inside this function so they have access to row
      // data
      var sortResults = function(newOption, switchOrder) {
        if (switchOrder) {
          order = order === 'asc' ? 'desc' : 'asc';
        }
        render(_.orderBy(rows, options.sortOptions[newOption], order), container);
      }

      $(container).on('change', '#form-sort', function(e) {
        sortResults($(e.target).val(), false);
      });
      $(container).on('click', '#form-order', function(e) {
        sortResults($(this).prev().val(), true);
        return false;
      });
    }

    if (options.searchProperties) {

      var filterOperators = ['!=','>=','<=','>','<','=']; // sequence matters
      var searchResults = function(searchText, isQueryMode) {
        $(container + ' #form-sort').val('Paper_Number');

        // Currently only searching on note title if exists
        var filterFunc = function(row) {
          return (row.submission && row.submission.content.title.toLowerCase().indexOf(searchText) !== -1) || (row.submissionNumber && row.submissionNumber.number) == searchText;
        };

        if (searchText) {
          if (isQueryMode) {
            var filterResult = Webfield.filterCollections(rows, searchText.slice(1), filterOperators, options.searchProperties, 'note.id')
            filteredRows = filterResult.filteredRows;
            queryIsInvalid = filterResult.queryIsInvalid;
            if(queryIsInvalid) $(container + ' .form-search').addClass('invalid-value')
          } else {
            filteredRows = _.filter(rows, filterFunc)
          }
        } else {
          filteredRows = rows;
        }
        render(filteredRows);
      };

      $(container + ' .form-search').on('keyup', function (e) {
        var searchText = $(container + ' .form-search').val().trim();
        var searchLabel = $(container + ' .form-search').prevAll('strong:first').text();
        $(container + ' .form-search').removeClass('invalid-value');

        if (searchText.startsWith('+')) {
          // filter query mode
          if (searchLabel === 'Search:') {
            $(container + ' .form-search').prevAll('strong:first').text('Query:');
            $(container + ' .form-search').prevAll('strong:first').after($('<span/>', {
              class: 'glyphicon glyphicon-info-sign'
            }).hover(function (e) {
              $(e.target).tooltip({
                title: "<strong class='tooltip-title'>Query Mode Help</strong>\n<p>In Query mode, you can enter an expression and hit ENTER to search.<br/> The expression consists of property of a paper and a value you would like to search.</p><p>e.g. +number=5 will return the paper 5</p><p>Expressions may also be combined with AND/OR.<br>e.g. +number=5 OR number=6 OR number=7 will return paper 5,6 and 7.<br>If the value has multiple words, it should be enclosed in double quotes.<br>e.g. +title=\"some title to search\"</p><p>Braces can be used to organize expressions.<br>e.g. +number=1 OR ((number=5 AND number=7) OR number=8) will return paper 1 and 8.</p><p>Operators available:".concat(filterOperators.join(', '), "</p><p>Properties available:").concat(Object.keys(options.searchProperties).join(', '), "</p>"),
                html: true,
                placement: 'bottom'
              });
            }));
          }

          if (e.key === 'Enter') {
            searchResults(searchText, true);
          }
        } else {
          if (searchLabel !== 'Search:') {
            $(container + ' .form-search').prev().remove(); // remove info icon

            $(container + ' .form-search').prev().text('Search:');
          }

          _.debounce(function () {
            searchResults(searchText.toLowerCase(),false);
          }, 300)();
        }
      });

      $(container + ' form.search-form').on('submit', function() {
        return false;
      });
    }
    render(rows);
    registerHelpers();



  }

  var renderTasks = function(container, invitations, options) {
    var defaults = {
      emptyMessage: 'No outstanding tasks for this venue'
    };
    options = _.defaults(options, defaults);

    var tasksOptions = {
      container: container,
      emptyMessage: options.emptyMessage,
      referrer: options.referrer
    }
    $(tasksOptions.container).empty();

    Webfield.ui.newTaskList(invitations, [], tasksOptions);
    $('.tabs-container a[href="#' + container + '"]').parent().show();
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

  return {
    getV2: getV2,
    postV2: postV2,
    setToken: setToken,
    sendFileV2: sendFileV2,
    api: {
      getSubmissionInvitationV2: getSubmissionInvitationV2,
      getSubmissionsV2: getSubmissionsV2,
    },
    ui: {
      setup: setup,
      submissionListV2: submissionListV2,
      activityListV2: activityListV2,
      renderTable: renderTable,
      renderTasks: renderTasks,
      renderTabPanel: renderTabPanel,
    },
    utils: {
      getGroupsByNumber: getGroupsByNumber,
      getSubmissions: getSubmissions,
      getAssignedInvitations: getAssignedInvitations,
      getPaperNumbersfromGroups: getPaperNumbersfromGroups,
      getNumberfromGroup: getNumberfromGroup
    }
  };
})();
