/* globals $, _: false */
/* globals view, view2, Webfield: false */
/* globals promptError, promptMessage, promptLogin, typesetMathJax, mkStateManager: false */
/* globals marked, DOMPurify, MathJax, Handlebars: false */

module.exports = function (forumId, noteId, invitationId, user) {
  if (!noteId) {
    noteId = forumId
  }

  var $content = $('#content  .forum-container')
  var $childrenAnchor = $('#note_children')
  var sm = mkStateManager()

  var getNoteRecsP = function () {
    var onError = function () {
      $childrenAnchor.find('.spinner-container').fadeOut('fast')
      promptError('An error ocurred while loading the forum, please try again later')
    }

    var notesP
    var invitationsP
    if (!forumId) {
      notesP = $.Deferred().resolve([])
      invitationsP = $.Deferred().resolve([])
    } else {
      notesP = Webfield.getAll('/notes', {
        forum: forumId,
        trash: true,
        details: 'replyCount,writable,revisions,original,overwriting,invitation,tags',
      }).then(function (notes) {
        if (!notes || !notes.length) {
          location.href = '/'
          return
        }

        notes.forEach(function (note) {
          if (!note.replyto && note.id !== note.forum) {
            note.replyto = note.forum
          }
        })

        return notes
      }, onError)

      invitationsP = Webfield.getAll('/invitations', {
        replyForum: forumId,
        details: 'repliedNotes',
      }).fail(onError)
    }

    var tagInvitationsP = function (forum) {
      if (!forum) {
        return $.Deferred().resolve([])
      }

      return Webfield.get(
        '/invitations',
        {
          replyForum: forum,
          type: 'tags',
        },
        { handleErrors: false }
      ).then(function (result) {
        return result.invitations || []
      }, onError)
    }

    var originalInvitationsP = function (original) {
      if (!original) {
        return $.Deferred().resolve([])
      }

      return Webfield.get(
        '/invitations',
        {
          replyForum: original.id,
          details: 'repliedNotes',
        },
        { handleErrors: false }
      ).then(function (result) {
        if (!result.invitations || !result.invitations.length) {
          return []
        }
        return result.invitations
      }, onError)
    }

    var noteRecsP = $.when(notesP, invitationsP).then(function (notes, invitations) {
      // a "common invitation" is one that applies to all notes in the forum.
      var commonInvitations = _.filter(invitations, function (invitation) {
        return (
          _.isEmpty(invitation.reply.replyto) &&
          _.isEmpty(invitation.reply.referent) &&
          _.isEmpty(invitation.reply.referentInvitation) &&
          _.isEmpty(invitation.reply.invitation)
        )
      })

      var noteRecPs = _.map(notes, function (note) {
        var noteInvitations = _.filter(invitations, function (invitation) {
          // Check if invitation is replying to this note
          var isInvitationRelated =
            invitation.reply.replyto === note.id ||
            invitation.reply.invitation === note.invitation
          // Check if invitation does not have multiReply OR invitation has the field multiReply
          // but it is not set to false OR invitation has the field multireply which is set to false
          // but there have not been any replies yet
          var isMultireplyApplicable =
            !_.has(invitation, 'multiReply') ||
            invitation.multiReply !== false ||
            !_.has(invitation, 'details.repliedNotes[0]')
          return isInvitationRelated && isMultireplyApplicable
        })

        var referenceInvitations = _.filter(invitations, function (invitation) {
          // Check if invitation is replying to this note
          var isInvitationRelated =
            invitation.reply.referent === note.id ||
            invitation.reply.referentInvitation === note.invitation
          // Check if invitation does not have multiReply OR invitation has the field multiReply
          // but it is not set to false OR invitation has the field multireply which is set to false
          // but there have not been any replies yet
          var isMultireplyApplicable =
            !_.has(invitation, 'multiReply') ||
            invitation.multiReply !== false ||
            !_.has(invitation, 'details.repliedNotes[0]')
          return isInvitationRelated && isMultireplyApplicable
        })

        var noteCommonInvitations = _.filter(commonInvitations, function (invitation) {
          // if selfReplyOnly restrict only to the note that responds to the same invitation
          var isReplyInvitation =
            !invitation.reply.selfReplyOnly ||
            (invitation.reply.selfReplyOnly && invitation.id === note.invitation)

          // Check invitation enabled by invitation
          if (_.has(invitation.reply, 'invitation')) {
            return invitation.reply.invitation === note.invitation || isReplyInvitation
          }

          // Check invitation enabled by forum
          return note.id === invitation.reply.forum || isReplyInvitation
        })

        var replyInvitations = _.union(noteCommonInvitations, noteInvitations)

        var noteForumId = note.id === forumId ? forumId : undefined
        return $.when(
          tagInvitationsP(noteForumId), // get tag invitations only for forum
          originalInvitationsP(note.details.original)
        ).then(function (tagInvitations, originalInvitations) {
          return {
            note: note,
            replyInvitations: replyInvitations,
            referenceInvitations: referenceInvitations,
            tagInvitations: tagInvitations,
            originalInvitations: originalInvitations,
          }
        })
      })

      return $.when.apply($, noteRecPs).then(function () {
        // eslint-disable-next-line prefer-rest-params
        return _.toArray(arguments)
      })
    })

    return noteRecsP
  }

  // Render functions
  var mkNewEditor = function (invitation, replyto, done) {
    view.mkNewNoteEditor(invitation, forumId, replyto, user, {
      onNoteCreated: function (newNote) {
        getNoteRecsP().then(function (noteRecs) {
          $content.one('forumRendered', function () {
            // Change to the previously selected tab unless this would cause the new note would be hidden,
            // in which case switch to the All tab
            if (sm.get('useNewLayout')) {
              if (location.hash !== '#all' && noteMatchesFilters(newNote, location.hash)) {
                $(window).trigger('hashchange')
              } else {
                location.hash = '#all'
              }
            }
            scrollToNote(newNote.id)
          })
          sm.update('noteRecs', noteRecs)
        })
      },
      onCompleted: function (editor) {
        done(editor)
      },
      onError: function (errors) {
        if (!errors || !errors.length) {
          promptError('An unknown error occurred. Please refresh the page and try again.')
          return
        }

        var isGuest = _.isEmpty(user) || _.startsWith(user.id, 'guest_')
        if (isGuest && errors[0] === 'You do not have permission to create a note') {
          promptLogin(user)
        } else {
          promptError(errors[0])
        }

        // Make sure the editor loading indicator is removed
        done(null)
      },
    })
  }

  var mkPanel = function (rec, $anchor) {
    var $note = view.mkNotePanel(rec.note, {
      onEditRequested: function (invitation, options) {
        var noteToRender
        if (options?.original) {
          noteToRender = rec.note.details?.original
        } else if (options?.revision) {
          noteToRender = invitation.details?.repliedNotes?.[0]
          if (noteToRender) {
            // Include both the referent and the note id so the API doesn't create a new reference
            noteToRender.updateId = noteToRender.id
          }
        }
        mkEditor(
          rec,
          noteToRender || rec.note,
          invitation,
          $anchor,
          function (editor) {
            if (editor) {
              $note.replaceWith(editor)
            }
          },
          { isReference: options?.revision }
        )
      },
      withContent: true,
      withRevisionsLink: true,
      withModificationDate: true,
      replyInvitations: rec.replyInvitations,
      referenceInvitations: rec.referenceInvitations,
      onNewNoteRequested: function (invitation) {
        var isLoading = $anchor.children('.spinner-container').length
        var $existingEditor = $anchor.children('.note_editor')
        if (
          isLoading ||
          ($existingEditor.length && $existingEditor.data('invitationId') === invitation.id)
        ) {
          return
        }

        $anchor.prepend(Handlebars.templates.spinner({ extraClasses: 'spinner-inline' }))
        mkNewEditor(invitation, rec.note && rec.note.id, function (editor) {
          $anchor
            .removeClass('hidden')
            .find('.spinner-container')
            .fadeOut('fast', function () {
              $(this).remove()
              $anchor.prepend(editor)
            })
        })
      },
      onTrashedOrRestored: function (newNote) {
        sm.update(
          'noteRecs',
          _.map(sm.get('noteRecs'), function (oldRec) {
            return oldRec.note.id === newNote.id
              ? Object.assign(oldRec, { note: newNote })
              : oldRec
          })
        )
      },
      userId: user && user.id,
      user: user,
      tagInvitations: rec.tagInvitations,
      readOnlyTags: true,
      originalInvitations: rec.originalInvitations,
      newLayout: forumId !== rec.note.id && sm.get('useNewLayout'),
    })
    $note.attr('id', 'note_' + rec.note.id)
    return $note
  }

  var mkEditor = function (forumData, note, invitation, $anchor, done, options) {
    var $editor = null

    var invitationP = invitation
      ? $.Deferred().resolve(invitation)
      : Webfield.get('/invitations', { id: note.invitation }).then(function (result) {
          if (result.invitations && result.invitations.length) {
            return result.invitations[0]
          }
        })

    return invitationP.then(function (invitation) {
      view.mkNoteEditor(note, invitation, user, {
        onNoteEdited: function (newNote) {
          getNoteRecsP().then(function (noteRecs) {
            $content.one('forumRendered', function () {
              scrollToNote(newNote.id)
            })
            sm.update('noteRecs', noteRecs)
          })
        },
        onNoteCancelled: function () {
          $editor.replaceWith(mkPanel(forumData, $anchor))
          MathJax.typesetPromise()
        },
        onCompleted: function (editor) {
          $editor = editor
          done(editor)
        },
        ...options,
      })
    })
  }

  var mkReplyNotes = function (replytoIdToChildren, sortedReplyNotes, depth, offset = 0) {
    if (!sortedReplyNotes || !sortedReplyNotes.length) {
      return
    }

    // Hide note replies once they get to a certain level of nesting
    var maxCommentDepth = 5
    var maxLength = Math.min(sortedReplyNotes.length, offset + 250)

    // Build note panel for each child note and recursively build reply tree
    var childrenList = []
    var noteCssClass = depth % 2 === 0 ? 'comment-level-even' : 'comment-level-odd'
    for (var i = offset; i < maxLength; i++) {
      var childNote = sortedReplyNotes[i].note
      var $childrenContainer = $('<div>', { class: 'children' })
      var $note = mkPanel(sortedReplyNotes[i], $childrenContainer)

      // Only render reply notes up to maxCommentDepth. Once that depth is reach display a
      // view more link
      var replyIds = replytoIdToChildren[childNote.id]
      var $replies =
        depth !== maxCommentDepth ? mkReplyNotes(replytoIdToChildren, replyIds, depth + 1) : []

      var displayMoreLink = null
      if (replyIds && replyIds.length && depth === maxCommentDepth) {
        var numReplies = countReplies(replytoIdToChildren, childNote.id)
        var numRepliesText = numReplies === 1 ? '1 More Reply' : numReplies + ' More Replies'
        displayMoreLink =
          '<div class="view-more-replies-container">' +
          '<a href="#" class="view-more-replies" data-note-replyto-id="' +
          childNote.replyto +
          '" data-note-id="' +
          childNote.id +
          '">' +
          'View ' +
          numRepliesText +
          ' &rarr;</a>' +
          '</div>'
        $childrenContainer.addClass('hidden')
      }

      childrenList.push(
        $('<div>', { class: 'note_with_children ' + noteCssClass }).append(
          '<a href="#" class="collapse-comment-tree collapse-link" title="Collapse reply thread">[&ndash;]</a>',
          '<a href="#" class="collapse-comment-tree expand-link" title="Expand reply thread">[+]</a>',
          $note,
          $childrenContainer.append($replies),
          displayMoreLink
        )
      )
    }

    if (maxLength < sortedReplyNotes.length) {
      var $viewMoreLink = $('<div class="note_with_children comment-level-odd">').append(
        $('<a href="#"><strong>View More Replies &rarr;</strong></a>').on(
          'click',
          function (e) {
            $(this).parent().hide()
            $childrenAnchor.append(
              mkReplyNotes(replytoIdToChildren, replytoIdToChildren[forumId], 1, offset + 250)
            )
            return false
          }
        )
      )
      childrenList.push($viewMoreLink)
    }

    return childrenList
  }

  var registerEventHelpers = function () {
    // Link to reply note modal
    $content.on('click', '.note_content_title .permalink-button', function () {
      var permalinkUrl = $(this).data('permalinkUrl')
      var modalHtml = Handlebars.templates['partials/forumLinkModal']({
        permalinkUrl: permalinkUrl,
      })

      $('#permalink-modal').remove()
      $(document.body).append(modalHtml)

      $('#permalink-modal input').on('click', function () {
        this.select()
      })

      $('#permalink-modal').modal('show')
      return false
    })

    // Show nested comment thread
    $content.on('click', '.view-more-replies', function () {
      var noteId = $(this).data('noteId')
      var parentNote = _.find(sm.get('noteRecs'), ['note.id', noteId])
      var scrollPos = $childrenAnchor.offset().top - 51 - 12

      $('html, body').animate({ scrollTop: scrollPos }, 400, function () {
        showNestedReplies(parentNote)
      })

      return false
    })

    // Collapse/expand comment thread
    $content.on('click', '.collapse-comment-tree', function () {
      var $parent = $(this).parent()

      if ($parent.hasClass('collapsed') || $parent.hasClass('semi-collapsed')) {
        $parent.removeClass('collapsed')
        $parent.removeClass('semi-collapsed')
      } else {
        $parent.addClass('collapsed')
        $parent.removeClass('semi-collapsed')
      }
      return false
    })

    // Show top-level comments
    $content.on('click', '.view-all-replies', function () {
      var replytoIdToChildren = sm.get('replytoIdMap')

      $content.children('.filter-row').show()
      $childrenAnchor
        .empty()
        .append(mkReplyNotes(replytoIdToChildren, replytoIdToChildren[forumId], 1))
      MathJax.typesetPromise()
      applyFilter()

      return false
    })

    // Filter dropdowns
    $content.on('click', '.checkbox-menu', applyFilter)

    $content.on('click', '.select-all-checkbox', applySelectAllFilters)

    // Filter tabs
    $(window).on('hashchange', function (e, initialUpdate) {
      $('.filter-tabs li').removeClass('active semi-active')

      var hash = location.hash
      if (!hash && !initialUpdate) return

      var options = $('.filter-tabs > li > a')
        .map(function () {
          return this.attributes.href.value
        })
        .get()
      if (!options.includes(hash)) hash = '#all'

      var tab = $('.filter-tabs')
        .find('a[href="' + hash + '"]')
        .parent()
      if (!tab.length) return

      tab.addClass('active')

      // Show tab message, if one exists
      var tabMessage = tab.children('a').eq(0).data('message')
      if (tabMessage && typeof tabMessage === 'string') {
        $('#tab-message')[0].innerHTML = DOMPurify.sanitize(marked(tabMessage))
        $('#tab-message').show()
      } else {
        $('#tab-message').hide()
      }

      var filtersMap = sm.get('forumFiltersMap')
      var newFilterObj = filtersMap?.[hash] || {}
      setFilters(
        Object.assign(
          {
            invitations: null,
            signatures: null,
            readers: null,
            'excluded-readers': null,
          },
          newFilterObj
        )
      )
      applyFilter()
    })

    if (sm.get('useNewLayout')) {
      $(window).trigger('hashchange', true)
    }

    $('[data-toggle="tooltip"]').tooltip()
  }

  var appendInvitation = function (invitation, noteId) {
    // Open invitation form on first page load
    if (noteId === forumId) {
      $childrenAnchor.prepend(Handlebars.templates.spinner({ extraClasses: 'spinner-inline' }))

      mkNewEditor(invitation, noteId, function (editor) {
        $childrenAnchor.find('.spinner-container').fadeOut('fast', function () {
          $(this).remove()
          $childrenAnchor.prepend(editor)
        })
      })
    } else {
      // Can only show invitation form AFTER scrolling to note otherwise not might be
      // deeply nested and not visible
      scrollToNote(noteId).then(function () {
        var $children = $('#note_' + noteId)
          .next('.children')
          .removeClass('hidden')
          .prepend(Handlebars.templates.spinner({ extraClasses: 'spinner-inline' }))

        mkNewEditor(invitation, noteId, function (editor) {
          $children.find('.spinner-container').fadeOut('fast', function () {
            $(this).remove()
            $children.prepend(editor)
          })
        })
      })
    }
  }

  var scrollToNote = function (noteId) {
    var scrollToElem = '#note_' + noteId
    var animationDone = $.Deferred()

    var doAnimation = function () {
      var navBarHeight = 51 + 12 // height in px of nav bar, plus extra padding
      var scrollPos = $(scrollToElem).offset().top - navBarHeight
      $('html, body').animate({ scrollTop: scrollPos }, 400, function () {
        animationDone.resolve(true)
      })
    }

    if ($(scrollToElem).length) {
      doAnimation()
    } else {
      // Note may be deeply nested, so check if the note exists then render just its parent and siblings
      var noteRecs = sm.get('noteRecs')
      var noteRec = _.find(noteRecs, ['note.id', noteId])
      if (noteRec) {
        var parentNote = _.find(noteRecs, ['note.id', noteRec.note.replyto])
        showNestedReplies(parentNote)

        if ($(scrollToElem).length) {
          doAnimation()
        }
      } else {
        animationDone.resolve(null)
      }
    }

    return animationDone
  }

  var countReplies = function (parentIdToChildren, noteId) {
    var count = 0
    var childrenNotes = parentIdToChildren[noteId]

    if (childrenNotes && childrenNotes.length) {
      count += childrenNotes.length
      for (var i = 0; i < childrenNotes.length; i++) {
        count += countReplies(parentIdToChildren, childrenNotes[i].note.id)
      }
    }

    return count
  }

  var showNestedReplies = function (parentNote) {
    if (!parentNote) return

    $content.children('.filter-row').hide()
    $childrenAnchor
      .empty()
      .append(
        '<div class="view-all-replies-container">' +
          '<span>Showing only replies to "' +
          parentNote.note.content.title +
          '"</span>' +
          '<button class="btn btn-default btn-xs view-all-replies">Show all replies</a>' +
          '</div>',
        mkReplyNotes(sm.get('replytoIdMap'), [parentNote], 1)
      )

    MathJax.typesetPromise()
  }

  // State handler functions
  var onTokenChange = function () {
    getNoteRecsP().then(function (recs) {
      // Determine if the url includes and noteId or invitationId param and scroll there,
      // but only after the forumRendered event is triggered
      $content.one('forumRendered', function () {
        var noteOrForumRec = _.find(recs, ['note.id', noteId])
        if (noteOrForumRec) {
          if (forumId !== noteId && !invitationId) {
            scrollToNote(noteId)
          }
          if (invitationId) {
            var replyInv = _.find(noteOrForumRec.replyInvitations, ['id', invitationId])
            if (replyInv) {
              appendInvitation(replyInv, noteId)
            } else {
              var origInv = _.find(noteOrForumRec.originalInvitations, ['id', invitationId])
              if (origInv) {
                $('#note_' + forumId + ' .meta_actions .edit_button').trigger('click')
              }
            }
          }
        }

        registerEventHelpers()
      })

      sm.update('noteRecs', recs)
    })

    sm.addHandler('forum', {
      noteRecs: onNoteRecsChanged,
    })
  }

  var onNoteRecsChanged = function (noteRecs) {
    var rootRec = _.find(noteRecs, function (rec) {
      return rec.note.id === rec.note.forum
    })
    if (!rootRec) {
      return
    }

    // Set search bar params
    var conf = rootRec.note.content.venueid
      ? rootRec.note.content.venueid
      : rootRec.note.invitation.split('/-/')[0]
    $('#search_group').val(conf)
    $('#search_input').val('')
    $('#search_input').attr('placeholder', 'Search ' + view.prettyId(conf))
    $('#search_content').val('all')

    // Make map of parent id -> child notes and sort in reverse chronological order
    var replytoIdToChildren = _.groupBy(
      _.sortBy(noteRecs, function (rec) {
        return -1 * rec.note.tcdate
      }),
      'note.replyto'
    )
    sm.update('replytoIdMap', replytoIdToChildren)

    // Render forum page
    var $root = mkPanel(rootRec, $childrenAnchor).removeClass('panel')

    var replyForumViews = _.get(rootRec.note, 'details.invitation.replyForumViews', null)
    sm.update('useNewLayout', !_.isEmpty(replyForumViews))
    var $forumViewsTabs = getForumViewTabs(replyForumViews, rootRec.note)

    buildFiltersMaps(noteRecs)
    var replyCount = _.get(rootRec.note, 'details.replyCount', 0)
    var $forumFiltersRow = null
    if (replyCount) {
      var replyCountText = replyCount === 1 ? '1 Reply' : replyCount + ' Replies'
      var $replyCount = $(
        '<div class="pull-right" id="reply_count">' + replyCountText + '</div>'
      )
      var $forumFilters = getForumFilters().addClass('pull-left')
      $forumFiltersRow = $('<div class="filter-row">').append($forumFilters, $replyCount)
    }

    $content
      .removeClass('pre-rendered')
      .empty()
      .append(
        $root,
        $forumViewsTabs || '<hr class="small">',
        $forumFiltersRow,
        $forumViewsTabs && '<div id="tab-message" class="alert alert-warning"></div>',
        $childrenAnchor
          .empty()
          .append(mkReplyNotes(replytoIdToChildren, replytoIdToChildren[forumId], 1))
      )

    typesetMathJax()
    $content.trigger('forumRendered')
  }

  var createMultiSelector = function (filters, id, defaultUnchecked) {
    var htmlFilters = filters.map(function (filter) {
      return {
        valueFilter: filter,
        textFilter: view.prettyId(filter, true),
      }
    })
    var buttonText = 'all'
    if (id === 'signatures') {
      buttonText = 'everybody'
    } else if (id === 'readers') {
      buttonText = 'all readers'
    } else if (id === 'excluded-readers') {
      buttonText = 'nobody'
    }
    var multiselector = Handlebars.templates['partials/multiselectorDropdown']({
      buttonText: buttonText,
      id: id,
      htmlFilters: htmlFilters,
      defaultUnchecked: defaultUnchecked,
    })
    return multiselector
  }

  // A Filter can be: Meta_Review, Official_Comment, Reviewer1, etc.
  // This function maps a Filter to its corresponding array of Notes.
  var createFiltersToNotes = function (notes, getFilters, extraFilters) {
    var filtersToNotes = {}
    for (var i = 0; i < notes.length; i += 1) {
      var note = notes[i]
      var filters = getFilters(note)
      for (var j = 0; j < filters.length; j += 1) {
        if (filtersToNotes[filters[j]]) {
          filtersToNotes[filters[j]].push(note)
        } else {
          filtersToNotes[filters[j]] = [note]
        }
      }
    }

    // Extra filters come from forum views and don't map to any notes
    if (extraFilters?.length > 0) {
      for (var k = 0; k < extraFilters.length; k += 1) {
        var newFilter = extraFilters[k]
        if (!filtersToNotes[newFilter]) {
          filtersToNotes[newFilter] = []
        }
      }
    }
    return filtersToNotes
  }

  // Returns Notes that are parents (replyto) of the intersection Notes.
  // This is done so that the Note is expanded as well as its parents, otherwise, it would not be visible.
  var getTopLevelNotes = function (intersection, noteIdToNote) {
    var topLevelNotes = []
    intersection.forEach(function (note) {
      addParents(note, topLevelNotes, noteIdToNote)
    })
    return _.uniq(topLevelNotes)
  }

  var addParents = function (note, noteList, noteIdToNote) {
    // noteIdToNote does not include the id of the forum note. Therefore, note would be undefined.
    var parentNote = noteIdToNote[note.replyto]
    if (!parentNote) {
      noteList.push(note.id)
      return
    }

    addParents(parentNote, noteList, noteIdToNote)
  }

  // Gets all the Notes in the Forum except the Submission
  var getForumReplies = function (noteRecs) {
    return _.map(noteRecs, 'note').filter(function (note) {
      return note.id !== note.forum
    })
  }

  // Accepts notesToCollapse and notesToExpand which are arrays of Notes.
  var filterNotes = function (notesToExpand, notesToCollapse, parentIdsToShow) {
    var shouldCollapse = function (collapse) {
      return function (note) {
        var $comment = $('#note_' + note.id).parent()

        // If collapsing note with open editor, close editor
        var openEditor = $comment.find('.children .note_editor.panel')
        if (collapse && openEditor.length) {
          openEditor.remove()
        }

        // If want to collapse and it's collapsed, do nothing. If want to expand
        // and it's expanded, do nothing. Otherwise collapse or expand.
        if ($comment.hasClass('collapsed') || $comment.hasClass('semi-collapsed')) {
          $comment.removeClass('collapsed')
          if (collapse) {
            $comment.addClass('semi-collapsed')
          } else {
            $comment.removeClass('semi-collapsed')
          }
        } else if (collapse) {
          $comment.addClass('semi-collapsed')
        }
      }
    }
    notesToCollapse.forEach(shouldCollapse(true))
    notesToExpand.forEach(shouldCollapse(false))

    $('#note_children > .note_with_children > .note').each(function () {
      var id = this.id.replace('note_', '')
      if (parentIdsToShow.includes(id)) {
        $(this).parent().show()
      } else {
        $(this).parent().hide()
      }
    })
    $('#reply-empty-message').remove()
    if ($('#note_children > .note_with_children:visible').length === 0) {
      $('#note_children').after(
        '<div id="reply-empty-message"><p class="empty-message">No replies to show</p></div>'
      )
    }
  }

  var noteMatchesFilters = function (note, hash) {
    var filtersMap = sm.get('forumFiltersMap')
    var filtersObj = filtersMap?.[hash]
    if (!filtersObj) return false

    return Object.entries(filtersObj).every(([field, values]) => {
      if (field === 'excluded-readers') {
        return values.every((value) => !note.readers.includes(value))
      } else {
        return values.every((value) => note[field].includes(value))
      }
    })
  }

  // Takes an object that maps Invitatiions/Signatures to Notes and an array that contains
  // all the filters (key values) to map the Invitations/Signatures to their corresponding Note.
  // This function returns a union of Notes resulting from all the filters mapping to their corresponding Notes.
  var getUnion = function (filterToNotes, filters) {
    return filters.reduce(function (notes, filter) {
      return _.unionBy(notes, filterToNotes[filter], 'id')
    }, [])
  }

  // Gets all the checkboxes and places them in an array depending on whether they are checked or unchecked
  var classifyCheckboxes = function (checkboxes) {
    var checkedFilters = []
    var uncheckedFilters = []
    checkboxes.each(function () {
      if (this.checked) {
        checkedFilters.push(this.value)
      } else {
        uncheckedFilters.push(this.value)
      }
    })
    return {
      checked: checkedFilters,
      unchecked: uncheckedFilters,
    }
  }

  // Decides what to write in the dropdown button depending on the selections made
  // This could be different, I haven't come up with a better way of displaying it
  var getButtonText = function (checkboxes, type) {
    var checked = checkboxes.checked.map(function (value) {
      return view.prettyId(value, true)
    })
    var maxWordsToDisplay = 2 // Max amount of words to display on the button
    if (type === 'invitations' && checked.length === 0) return 'nothing'
    if (
      (type === 'signatures' || type === 'readers' || type === 'excluded-readers') &&
      checked.length === 0
    ) {
      return 'nobody'
    }
    if (type === 'invitations' && checkboxes.unchecked.length === 0) return 'all'
    if (type === 'signatures' && checkboxes.unchecked.length === 0) return 'everybody'
    if (
      (type === 'readers' || type === 'excluded-readers') &&
      checkboxes.unchecked.length === 0
    ) {
      return 'all readers'
    }
    if (checked.length === 1) return checked[0]
    if (checked.length === 2) return checked[0] + ' and ' + checked[1]
    var buttonText = ''
    var wordsToDisplay =
      checked.length > maxWordsToDisplay ? maxWordsToDisplay : checked.length - 1
    for (var i = 0; i < wordsToDisplay; i++) {
      buttonText += checked[i] + ', '
    }
    if (checked.length > maxWordsToDisplay) {
      return buttonText + '...'
    } else {
      return buttonText + 'and ' + checked[checked.length - 1]
    }
  }

  // Action taken every time a value in the filters is chosen
  var applyFilter = function (event) {
    if (event) event.stopPropagation()

    var invitationCheckboxes = classifyCheckboxes($('.invitations-multiselector-checkbox'))
    $('#invitations').text(getButtonText(invitationCheckboxes, 'invitations'))
    var signatureCheckboxes = classifyCheckboxes($('.signatures-multiselector-checkbox'))
    $('#signatures').text(getButtonText(signatureCheckboxes, 'signatures'))
    var readersCheckboxes = classifyCheckboxes($('.readers-multiselector-checkbox'))
    $('#readers').text(getButtonText(readersCheckboxes, 'readers'))
    var excludedReadersCheckboxes = classifyCheckboxes(
      $('.excluded-readers-multiselector-checkbox')
    )
    $('#excluded-readers').text(getButtonText(excludedReadersCheckboxes, 'excluded-readers'))

    $('#invitations')
      .next()
      .find('input.select-all-checkbox')
      .prop('checked', invitationCheckboxes.unchecked.length === 0)
    $('#signatures')
      .next()
      .find('input.select-all-checkbox')
      .prop('checked', signatureCheckboxes.unchecked.length === 0)
    $('#readers')
      .next()
      .find('input.select-all-checkbox')
      .prop('checked', readersCheckboxes.unchecked.length === 0)
    $('#excluded-readers')
      .next()
      .find('input.select-all-checkbox')
      .prop('checked', excludedReadersCheckboxes.unchecked.length === 0)

    var forumReplies = getForumReplies(sm.get('noteRecs'))
    var invitationUnion = getUnion(sm.get('invitationToNotes'), invitationCheckboxes.checked)
    var signatureUnion = getUnion(sm.get('signatureToNotes'), signatureCheckboxes.checked)
    var readerUnion = getUnion(sm.get('readerToNotes'), readersCheckboxes.checked)
    var excludedReaderUnion = forumReplies.filter(function (note) {
      return _.intersection(note.readers, excludedReadersCheckboxes.checked).length === 0
    })

    var notesToExpand = _.intersectionBy(
      signatureUnion,
      invitationUnion,
      readerUnion,
      excludedReaderUnion,
      'id'
    )
    var notesToCollapse = _.difference(forumReplies, notesToExpand)
    var parentIdsToShow = getTopLevelNotes(notesToExpand, sm.get('noteIdToNote'))
    filterNotes(notesToExpand, notesToCollapse, parentIdsToShow)

    // If filters are changed, deselect current tab and make it so clicking it resets the filters
    if (event && sm.get('useNewLayout')) {
      $('.filter-tabs li.active')
        .removeClass('active')
        .addClass('semi-active')
        .one('click', function () {
          $(this).removeClass('semi-active').addClass('active')

          var filtersMap = sm.get('forumFiltersMap')
          var newFilterObj = filtersMap?.[location.hash] || {}
          setFilters(
            Object.assign(
              {
                invitations: null,
                signatures: null,
                readers: null,
                'excluded-readers': null,
              },
              newFilterObj
            )
          )
          applyFilter()
        })
    }
  }

  var applySelectAllFilters = function (event) {
    // Select/Unselect all the checkboxes
    var checkboxes = $(this).closest('li').siblings().find('input')
    checkboxes.prop('checked', $(this).prop('checked'))
    // Apply filter
    applyFilter(event)
  }

  var setFilters = function (filtersObj) {
    Object.keys(filtersObj).forEach(function (filterName) {
      var $dropdown = $('#' + filterName).next()
      if (!$dropdown.length) return

      if (filtersObj[filterName]) {
        $dropdown.find('li input[type="checkbox"]').each(function () {
          var val = $(this).attr('value')
          $(this).prop('checked', filtersObj[filterName].includes(val))
        })
      } else {
        // No filters selected, check all boxes
        $dropdown
          .find('li input[type="checkbox"]')
          .prop('checked', filterName !== 'excluded-readers')
      }
    })
  }

  // Uses an array of compare functions to determine what comes first: a or b.
  var sortCriteria = function (a, b, compareFuncs) {
    var criteria
    for (var i = 0; i < compareFuncs.length; i++) {
      // Tries to find criteria to sort a and b
      criteria = compareFuncs[i](a, b)
      // Return criteria if found, otherwise, continue searching
      if (criteria) return criteria
    }
    // Keep same order as before by returning 0. In this case it would be alphabetical order
    return 0
  }

  // Always places any string AFTER the string that contains substr
  var allAfter = function (substr) {
    return function (a, b) {
      if (a.indexOf(substr) !== -1 && b.indexOf(substr) !== -1) return 0
      if (a.indexOf(substr) !== -1) return -1
      if (b.indexOf(substr) !== -1) return 1
    }
  }

  // Always places any string BEFORE the string that contains substr
  var allBefore = function (substr) {
    return function (a, b) {
      if (a.indexOf(substr) !== -1 && b.indexOf(substr) !== -1) return 0
      if (a.indexOf(substr) !== -1) return 1
      if (b.indexOf(substr) !== -1) return -1
    }
  }

  var sortFilters = function (filters, compareFuncs) {
    // Sort in alphabetical order first
    filters.sort()
    // Sort by groups/invitations
    return filters.sort(function (a, b) {
      var lowerA = a.toLowerCase()
      var lowerB = b.toLowerCase()
      // use helper function with a set of rules.
      // e.g. compareFuncs = [allAfter('author'), allAfter('reviewer'), allAfter('chair'), allBefore('anonymous')];
      // The array compareFuncs indicates what strings that contain the passed substring
      // (author, reviewer, etc.) should come first. Smaller index in the array takes precedence
      // (e.g. allAfter('author') has precedence over allAfter('reviewer')).
      // Any string containing the substring author will come first than any other string in the array to be sorted
      // Any string that does not contain any of the substrings will be placed after all the
      // allAfter and before all the allBefore (e.g. Carlos Mondragon will come after Chairs but before Anonymous)
      return sortCriteria(lowerA, lowerB, compareFuncs)
    })
  }

  // Assumes there is always going to be just one invitation per note.
  var getInvitationFilters = function (note) {
    return [note.invitation]
  }
  var getSignatureFilters = function (note) {
    return note.signatures
  }
  var getReadersFilters = function (note) {
    return note.readers
  }

  var buildFiltersMaps = function (noteRecs) {
    // Make sure to also include any ids used by the view tabs in the dropdown
    var forumFiltersMap = sm.get('forumFiltersMap')
    var additionalFilters = {}
    if (forumFiltersMap) {
      additionalFilters = Object.values(forumFiltersMap).reduce(function (map, filters) {
        return _.merge(map, filters)
      }, {})
      additionalFilters.readers = _.union(
        additionalFilters.readers,
        additionalFilters['excluded-readers']
      )
    }

    var forumReplies = getForumReplies(noteRecs)
    sm.update('noteIdToNote', _.keyBy(forumReplies, 'id'))
    sm.update(
      'signatureToNotes',
      createFiltersToNotes(forumReplies, getSignatureFilters, additionalFilters.signatures)
    )
    sm.update(
      'invitationToNotes',
      createFiltersToNotes(forumReplies, getInvitationFilters, additionalFilters.invitations)
    )
    sm.update(
      'readerToNotes',
      createFiltersToNotes(forumReplies, getReadersFilters, additionalFilters.readers)
    )
  }

  // These creates the multiselectors and returns a jQuery object that contains them
  var getForumFilters = function () {
    var invitationFilters = _.keys(sm.get('invitationToNotes'))
    sortFilters(invitationFilters, [
      allAfter('decision'),
      allAfter('review'),
      allAfter('comment'),
    ])
    var invitationMultiSelector = createMultiSelector(invitationFilters, 'invitations')

    var signatureFilters = _.keys(sm.get('signatureToNotes'))
    sortFilters(signatureFilters, [
      allAfter('author'),
      allAfter('reviewer'),
      allAfter('chair'),
      allBefore('anonymous'),
    ])
    var signatureMultiSelector = createMultiSelector(signatureFilters, 'signatures')

    var readersFilters = _.keys(sm.get('readerToNotes'))
    sortFilters(readersFilters, [
      allAfter('author'),
      allAfter('reviewer'),
      allAfter('chair'),
      allBefore('anonymous'),
    ])
    var readersMultiSelector = createMultiSelector(readersFilters, 'readers')

    var excludedReadersMultiSelector = createMultiSelector(
      readersFilters,
      'excluded-readers',
      true
    )

    return $('<div class="filter-container">').append(
      $('<div>').append('<span>Reply Type:</span>', invitationMultiSelector),
      $('<div>').append('<span>Author:</span>', signatureMultiSelector),
      $('<div>').append('<span>Visible To:</span>', readersMultiSelector),
      $('<div>').append('<span>Hidden From:</span>', excludedReadersMultiSelector)
    )
  }

  // Build the filter tabs from forum views array
  var getForumViewTabs = function (replyForumViews, forumNote) {
    if (_.isEmpty(replyForumViews)) {
      sm.update('forumFiltersMap', {})
      return null
    }

    var filterMap = replyForumViews.reduce(function (map, view) {
      map['#' + view.id] = parseFilterQuery(replaceFilterWildcards(view.filter, forumNote))
      return map
    }, {})
    sm.update('forumFiltersMap', filterMap)

    return $('<div class="mobile-full-width">').append(
      $('<ul class="nav nav-tabs filter-tabs">').append(
        replyForumViews.map(function (view) {
          return $('<li role="presentation">').append(
            $('<a href="#' + view.id + '">')
              .text(view.label)
              .data('message', view.message)
          )
        })
      )
    )
  }

  // Convert filter query string into object representing all the active filters
  // Copied from lib/forum-utils.js
  var parseFilterQuery = function (filterQuery, searchQuery) {
    var filterObj = (filterQuery || '').split(' ').reduce(function (map, token) {
      var [field, val] = token.split(':')
      if (val) {
        var mapKey = field.startsWith('-') ? 'excluded-' + field.slice(1) : field
        map[mapKey] = val.split(',').filter(Boolean)
      }
      return map
    }, {})

    if (searchQuery) {
      filterObj.keywords = [searchQuery.toLowerCase()]
    }

    return filterObj
  }

  // Convert filter query string into object representing all the active filters
  // Copied from lib/forum-utils.js
  var replaceFilterWildcards = function (filterQuery, replyNote) {
    return filterQuery.replace(/\${note\.([\w.]+)}/g, (match, field) =>
      _.get(replyNote, field, '')
    )
  }

  onTokenChange()
}
