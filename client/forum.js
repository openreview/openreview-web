/**
 * Changes:
 * - delete replaceWithForum and pushForum
 * - change `var runForum =` to `module.exports =`
 * - replace `controller.addHandler('forum', { ... })` with `onTokenChange()`
 * - delete first 2 lines of onTokenChange (setting the user var)
 * - replace referrer argument with user
 * - delete all references to OpenBanner and setting document.title
 * - replace all controller api function with Webfield api functions
 * - remove preRendered var
 * - add `$root.removeClass('panel');` to line 574
 * - replace `#content` with `#content > .forum-container`
 */
module.exports = function(forumId, noteId, invitationId, user) {
  if (!noteId) {
    noteId = forumId;
  }

  var $content = $('#content > .forum-container');
  var $childrenAnchor = $('#note_children');
  var sm = mkStateManager();

  // Data fetching functions
  var getProfilesP = function(notes) {

    var authorEmails = _.without(_.uniq(_.map(notes, function(n) { return n.tauthor; })), undefined);
    if (!authorEmails.length) {
      return $.Deferred().resolve(notes);
    }

    var getPreferredUserName = function(profile) {
      var preferredName = _.find(profile.content.names, ['preferred', true]);
      if (preferredName) {
        return preferredName.username;
      }
      return profile.id;
    };

    return Webfield.post('/profiles/search', { emails: authorEmails })
      .then(function(result) {
        var profiles = {};
        _.forEach(result.profiles, function(p) {
          profiles[p.email] = p;
        });

        _.forEach(notes, function(n) {
          var profile = profiles[n.tauthor];
          if (profile) {
            n.tauthor = getPreferredUserName(profile);
          }
        });
        return notes;
      });

  };

  var getNoteRecsP = function() {
    var onError = function() {
      $childrenAnchor.find('.spinner-container').fadeOut('fast');
      promptError('An error ocurred while loading the forum, please try again later');
    };

    var notesP;
    var invitationsP;
    if (!forumId) {
      notesP = $.Deferred().resolve([]);
      invitationsP = $.Deferred().resolve([]);

    } else {
      notesP = Webfield.get('/notes', {
        forum: forumId,
        trash: true,
        details: 'replyCount,writable,revisions,original,overwriting,invitation,tags'
      }, { handleErrors: false })
        .then(function(result) {
          if (!result.notes || !result.notes.length) {
            controller.removeHandler('forum');
            location.href = '/';
            return;
          }

          var notes = result.notes;
          notes.forEach(function(note) {
            if (!note.replyto && note.id !== note.forum) {
              note.replyto = note.forum;
            }
          });

          return getProfilesP(notes);
        }, onError);

      invitationsP = Webfield.get('/invitations', {
        replyForum: forumId, details: 'repliedNotes'
      }, { handleErrors: false })
        .then(function(result) {
          return result.invitations || [];
        }, onError);
    }

    var tagInvitationsP = function(forum) {
      if (!forum) {
        return $.Deferred().resolve([]);
      }

      return Webfield.get('/invitations', {
        replyForum: forum, tags: true
      }, { handleErrors: false })
        .then(function(result) {
          return result.invitations || [];
        }, onError);
    };

    var originalInvitationsP = function(original) {
      if (!original) {
        return $.Deferred().resolve([]);
      }

      return Webfield.get('/invitations', {
        replyForum: original.id, details: 'repliedNotes'
      }, { handleErrors: false })
        .then(function(result) {
          if (!result.invitations || !result.invitations.length) {
            return [];
          }
          return result.invitations;
        }, onError);
    };

    var noteRecsP = $.when(notesP, invitationsP).then(function(notes, invitations) {

      // a "common invitation" is one that applies to all notes in the forum.
      var commonInvitations = _.filter(invitations, function(invitation) {
        return _.isEmpty(invitation.reply.replyto) &&
          _.isEmpty(invitation.reply.referent) &&
          _.isEmpty(invitation.reply.referentInvitation) &&
          _.isEmpty(invitation.reply.invitation);
      });

      var noteRecPs = _.map(notes, function(note) {
        var noteInvitations = _.filter(invitations, function(invitation) {
          // Check if invitation is replying to this note
          var isInvitationRelated = (invitation.reply.replyto === note.id) || (invitation.reply.invitation === note.invitation);
          // Check if invitation does not have multiReply OR invitation has the field multiReply but it is not set to false OR invitation has the field multireply which is set to false but there have not been any replies yet
          var isMultireplyApplicable = (!_.has(invitation, 'multiReply') || (invitation.multiReply !== false) || !_.has(invitation, 'details.repliedNotes[0]'));
          return isInvitationRelated && isMultireplyApplicable;
        });

        var referenceInvitations = _.filter(invitations, function(invitation) {
          // Check if invitation is replying to this note
          var isInvitationRelated = (invitation.reply.referent === note.id) || (invitation.reply.referentInvitation === note.invitation);
          // Check if invitation does not have multiReply OR invitation has the field multiReply but it is not set to false OR invitation has the field multireply which is set to false but there have not been any replies yet
          var isMultireplyApplicable = (!_.has(invitation, 'multiReply') || (invitation.multiReply !== false) || !_.has(invitation, 'details.repliedNotes[0]'));
          return isInvitationRelated && isMultireplyApplicable;
        });

        var noteCommonInvitations = _.filter(commonInvitations, function(invitation) {
          // if selfReplyOnly restrict only to the note that responds to the same invitation
          var isReplyInvitation = !invitation.reply.selfReplyOnly ||
            (invitation.reply.selfReplyOnly && invitation.id === note.invitation);

          // Check invitation enabled by invitation
          if (_.has(invitation.reply, 'invitation')) {
            return (invitation.reply.invitation === note.invitation) || isReplyInvitation;
          }

          // Check invitation enabled by forum
          return (note.id === invitation.reply.forum) || isReplyInvitation;
        });

        var replyInvitations = _.union(noteCommonInvitations, noteInvitations);

        var noteForumId = note.id === forumId ? forumId : undefined;
        return $.when(
          tagInvitationsP(noteForumId),  // get tag invitations only for forum
          originalInvitationsP(note.details.original)
        )
        .then(function(tagInvitations, originalInvitations) {
          return {
            note: note,
            replyInvitations: replyInvitations,
            referenceInvitations: referenceInvitations,
            tagInvitations: tagInvitations,
            originalInvitations: originalInvitations
          };
        });
      });

      return $.when.apply($, noteRecPs).then(function() {
        return _.toArray(arguments);
      });

    });

    return noteRecsP;
  };

  // Render functions
  var mkNewEditor = function(invitation, replyto, done) {
    view.mkNewNoteEditor(invitation, forumId, replyto, user, {
      onNoteCreated: function(newNote) {
        getNoteRecsP().then(function(noteRecs) {
          $content.one('forumRendered', function() {
            scrollToNote(newNote.id);
          });
          sm.update('noteRecs', noteRecs);
        });
      },
      onCompleted: function(editor) {
        done(editor);
      },
      onError: function(errors) {
        if (!errors || !errors.length) {
          promptError('An unknown error occurred. Please refresh the page and try again.');
          return;
        }

        var isGuest = _.isEmpty(user) || _.startsWith(user.id, 'guest_');
        if (isGuest && errors[0] === 'You do not have permission to create a note') {
          promptLogin(user);
        } else {
          promptError(errors[0]);
        }

        // Make sure the editor loading indicator is removed
        done(null);
      }
    });
  };

  var mkPanel = function(rec, $anchor) {
    var $note = view.mkNotePanel(rec.note, {
      onEditRequested: function(invitation, options) {
        var noteToRender;
        if (options?.original) {
          noteToRender = rec.note.details?.original;
        } else if (options?.revision) {
          noteToRender = invitation.details?.repliedNotes?.[0]
          if (noteToRender) {
            // Include both the referent and the note id so the API doesn't create a new reference
            noteToRender.updateId = noteToRender.id
          }
        }
        mkEditor(rec, noteToRender || rec.note, invitation, $anchor, function(editor) {
          if (editor) {
            $note.replaceWith(editor);
          }
        });
      },
      withContent: true,
      withRevisionsLink: true,
      withModificationDate: true,
      replyInvitations: rec.replyInvitations,
      referenceInvitations: rec.referenceInvitations,
      onNewNoteRequested: function(invitation) {
        var isLoading = $anchor.children('.spinner-container').length;
        var $existingEditor = $anchor.children('.note_editor');
        if (isLoading || ($existingEditor.length && $existingEditor.data('invitationId') === invitation.id)) {
          return;
        }

        $anchor.prepend(Handlebars.templates.spinner({extraClasses: 'spinner-inline'}));
        mkNewEditor(invitation, rec.note && rec.note.id, function(editor) {
          $anchor.removeClass('hidden').find('.spinner-container').fadeOut('fast', function() {
            $(this).remove();
            $anchor.prepend(editor);
          });
        });
      },
      onTrashedOrRestored: function(newNote) {
        sm.update('noteRecs', _.map(sm.get('noteRecs'), function(oldRec) {
          return oldRec.note.id === newNote.id ?
            Object.assign(oldRec, { note: newNote }) :
            oldRec;
        }));
      },
      userId: user && user.id,
      user: user,
      tagInvitations: rec.tagInvitations,
      readOnlyTags: true,
      originalInvitations: rec.originalInvitations
    });
    $note.attr('id', 'note_' + rec.note.id);
    return $note;
  };

  var mkEditor = function(forumData, note, invitation, $anchor, done) {
    var $editor = null;

    var invitationP = invitation ?
      $.Deferred().resolve(invitation) :
      Webfield.get('/invitations', { id: note.invitation }).then(function(result) {
        if (result.invitations && result.invitations.length) {
          return result.invitations[0];
        }
      });

    return invitationP.then(function(invitation) {

      view.mkNoteEditor(note, invitation, user, {
        onNoteEdited: function(newNote) {
          getNoteRecsP().then(function(noteRecs) {
            $content.one('forumRendered', function() {
              scrollToNote(newNote.id);
            });
            sm.update('noteRecs', noteRecs);
          });
        },
        onNoteCancelled: function() {
          $editor.replaceWith(mkPanel(forumData, $anchor));
          MathJax.typesetPromise();
        },
        onCompleted: function(editor) {
          $editor = editor;
          done(editor);
        }
      });
    });
  };

  var mkReplyNotes = function(replytoIdToChildren, sortedReplyNotes, depth) {
    if (!sortedReplyNotes || !sortedReplyNotes.length) {
      return;
    }

    // Hide note replies once they get to a certain level of nesting
    var maxCommentDepth = 5;

    // Build note panel for each child note and recursively build reply tree
    var childrenList = [];
    var noteCssClass = depth % 2 === 0 ? 'comment-level-even' : 'comment-level-odd';
    for (var i = 0; i <  sortedReplyNotes.length; i++) {
      var childNote = sortedReplyNotes[i].note;
      var $childrenContainer = $('<div>', {class: 'children'});
      var $note = mkPanel(sortedReplyNotes[i], $childrenContainer);

      // Only render reply notes up to maxCommentDepth. Once that depth is reach display a
      // view more link
      var replyIds = replytoIdToChildren[childNote.id];
      var $replies = depth !== maxCommentDepth ?
        mkReplyNotes(replytoIdToChildren, replyIds, depth + 1) :
        [];

      var displayMoreLink = null;
      if (replyIds && replyIds.length && depth === maxCommentDepth) {
        var numReplies = countReplies(replytoIdToChildren, childNote.id);
        var numRepliesText = numReplies === 1 ? '1 More Reply' : numReplies + ' More Replies';
        displayMoreLink = '<div class="view-more-replies-container">' +
          '<a href="#" class="view-more-replies" data-note-replyto-id="' + childNote.replyto + '" data-note-id="' + childNote.id + '">' +
          'View ' + numRepliesText + ' &rarr;</a>' +
          '</div>';
        $childrenContainer.addClass('hidden');
      }

      childrenList.push($('<div>', {class: 'note_with_children ' + noteCssClass}).append(
        '<a href="#" class="collapse-comment-tree" title="Collapse reply thread">[&ndash;]</a>',
        $note,
        $childrenContainer.append($replies),
        displayMoreLink
      ));
    }

    return childrenList;
  };

  var registerEventHelpers = function() {
    // Link to reply note modal
    $content.on('click', '.note_content_title .permalink-button', function() {
      var permalinkUrl = $(this).data('permalinkUrl');
      var modalHtml = Handlebars.templates['partials/forumLinkModal']({
        permalinkUrl: permalinkUrl
      });

      $('#permalink-modal').remove();
      $(document.body).append(modalHtml);

      $('#permalink-modal input').on('click', function() {
        this.select();
      });

      $('#permalink-modal').modal('show');
      return false;
    });

    // Show nested comment thread
    $content.on('click', '.view-more-replies', function() {
      var replytoIdToChildren = sm.get('replytoIdMap');
      var noteId = $(this).data('noteId');
      var noteReplytoId = $(this).data('noteReplytoId');
      var noteTitle = $(this).closest('.note_with_children').find('.note_content_title a').eq(0).text();
      var scrollPos = $childrenAnchor.offset().top - 51 - 12;

      $('html, body').animate({scrollTop: scrollPos}, 400, function() {
        $childrenAnchor.fadeOut('fast', function() {
          $childrenAnchor.empty().append(
            '<div class="view-all-replies-container">' +
              '<span>Showing only replies to "' + noteTitle + '"</span>' +
              '<button class="btn btn-default btn-xs view-all-replies">Show all replies</a>' +
            '</div>',
            mkReplyNotes(replytoIdToChildren, _.filter(replytoIdToChildren[noteReplytoId], ['note.id', noteId]), 1)
          );
          MathJax.typesetPromise();
          applyFilter();
          $childrenAnchor.fadeIn('fast');
        });
      });

      return false;
    });

    // Collapse/expand comment thread
    $content.on('click', '.collapse-comment-tree', function() {
      var $container = $(this).parent();
      $container.toggleClass('collapsed');

      $(this).html($container.hasClass('collapsed') ? '[+]' : '[&ndash;]');
      return false;
    });

    // Show top-level comments
    $content.on('click', '.view-all-replies', function() {
      var replytoIdToChildren = sm.get('replytoIdMap');

      $childrenAnchor.fadeOut('fast', function() {
        $childrenAnchor.empty().append(
          mkReplyNotes(replytoIdToChildren, replytoIdToChildren[forumId], 1)
        );
        MathJax.typesetPromise();
        applyFilter();
        $childrenAnchor.fadeIn('fast');
      });

      return false;
    });

    // Filter dropdowns
    $content.on('click', '.checkbox-menu', applyFilter);

    $content.on('click', '.select-all-checkbox', applySelectAllFilters);

    // Filter tabs
    $(window).on('hashchange', function(e, initialUpdate) {
      $('.filter-tabs li').removeClass('active');

      var hash = location.hash || '#all'
      var tab = $('.filter-tabs').find('a[href="' + hash + '"]').parent();
      if (!tab.length) return;

      tab.addClass('active');
      var filter = tab.data('filter');
      var parentNote = _.find(sm.get('noteRecs'), ['note.id', forumId]).note;
      var newFilterObj = parseFilterQuery(replaceFilterWildcards(filter, parentNote));
      setFilters(Object.assign({
        invitations: null, signatures: null, readers: null, excludedReaders: null,
      }, newFilterObj));
      applyFilter();
    });

    $(window).trigger('hashchange', true)

    $('[data-toggle="tooltip"]').tooltip();
  };

  var appendInvitation = function(invitation, noteId) {
    // Open invitation form on first page load
    if (noteId === forumId) {
      $childrenAnchor.prepend(Handlebars.templates.spinner({extraClasses: 'spinner-inline'}));

      mkNewEditor(invitation, noteId, function(editor) {
        $childrenAnchor.find('.spinner-container').fadeOut('fast', function() {
          $(this).remove();
          $childrenAnchor.prepend(editor);
        });
      });

    } else {
      // Can only show invitation form AFTER scrolling to note otherwise not might be
      // deeply nested and not visible
      scrollToNote(noteId).then(function() {
        var $children = $('#note_' + noteId).next('.children')
          .removeClass('hidden')
          .prepend(Handlebars.templates.spinner({extraClasses: 'spinner-inline'}));

        mkNewEditor(invitation, noteId, function(editor) {
          $children.find('.spinner-container').fadeOut('fast', function() {
            $(this).remove();
            $children.prepend(editor);
          });
        });
      });
    }
  };

  var scrollToNote = function(noteId) {
    var scrollToElem = '#note_' + noteId;
    var animationDone = $.Deferred();

    var doAnimation = function() {
      var navBarHeight = 51 + 12; // height in px of nav bar, plus extra padding
      var scrollPos = $(scrollToElem).offset().top - navBarHeight;
      $('html, body').animate({scrollTop: scrollPos}, 400, function() {
        animationDone.resolve(true);
      });
    };

    if ($(scrollToElem).length) {
      doAnimation();

    } else {
      // Note may be deeply nested, so render just its parent and siblings
      var noteRecs = sm.get('noteRecs');
      var noteRec = _.find(noteRecs, ['note.id', noteId]);
      if (noteRec) {
        var replytoIdToChildren = sm.get('replytoIdMap');
        var parentNote = _.find(noteRecs, ['note.id', noteRec.note.replyto]);
        if (parentNote) {
          $childrenAnchor.empty().append(
            '<div class="view-all-replies-container">' +
              '<span>Showing only replies to "' + parentNote.note.content.title + '"</span>' +
              '<button class="btn btn-default btn-xs view-all-replies">Show all replies</a>' +
            '</div>',
            mkReplyNotes(replytoIdToChildren, [parentNote], 1)
          );
          MathJax.typesetPromise();
          if ($(scrollToElem).length) {
            doAnimation();
          }
        }
      } else {
        animationDone.resolve(null);
      }
    }

    return animationDone;
  };

  var countReplies = function(parentIdToChildren, noteId) {
    var count = 0;
    var childrenNotes = parentIdToChildren[noteId];

    if (childrenNotes && childrenNotes.length) {
      count += childrenNotes.length;
      for (var i = 0; i < childrenNotes.length; i++) {
        count += countReplies(parentIdToChildren, childrenNotes[i].note.id);
      }
    }

    return count;
  };


  // State handler functions
  var onTokenChange = function() {
    getNoteRecsP().then(function(recs) {
      // Determine if the url includes and noteId or invitationId param and scroll there,
      // but only after the forumRendered event is triggered
      $content.one('forumRendered', function() {
        var noteOrForumRec = _.find(recs, ['note.id', noteId]);
        if (noteOrForumRec) {
          if (forumId !== noteId && !invitationId) {
            scrollToNote(noteId);
          }
          if (invitationId) {
            var replyInv = _.find(noteOrForumRec.replyInvitations, ['id', invitationId]);
            if (replyInv) {
              appendInvitation(replyInv, noteId);
            } else {
              var origInv = _.find(noteOrForumRec.originalInvitations, ['id', invitationId]);
              if (origInv) {
                $('#note_' + forumId + ' .meta_actions .edit_button').trigger('click')
              }
            }
          }
        }

        registerEventHelpers();
      });

      sm.update('noteRecs', recs);
    });

    sm.addHandler('forum', {
      noteRecs: onNoteRecsChanged
    });
  };

  var onNoteRecsChanged = function(noteRecs) {
    var rootRec = _.find(noteRecs, function(rec) {
      return rec.note.id === rec.note.forum;
    });
    if (!rootRec) {
      return;
    }

    // Set search bar params
    var conf = rootRec.note.content.venueid ?
      rootRec.note.content.venueid :
      rootRec.note.invitation.split('/-/')[0];
    $('#search_group').val(conf);
    $('#search_input').val('');
    $('#search_input').attr('placeholder','Search ' + view.prettyId(conf));
    $('#search_content').val('all');

    // Make map of parent id -> child notes and sort in reverse chronological order
    var replytoIdToChildren = _.groupBy(_.sortBy(noteRecs, function(rec) {
      return -1 * rec.note.tcdate;
    }), 'note.replyto');
    sm.update('replytoIdMap', replytoIdToChildren);

    // Render forum page
    var $root = mkPanel(rootRec, $childrenAnchor).removeClass('panel');

    $forumViewsTabs = null;
    var replyForumViews = _.get(rootRec.note, 'details.invitation.replyForumViews', null);
    if (replyForumViews) {
      $forumViewsTabs = getForumViewTabs(replyForumViews);
    }

    var replyCount = _.get(rootRec.note, 'details.replyCount', 0)
    var $forumFiltersRow = null;
    if (replyCount) {
      var replyCountText = replyCount === 1 ? '1 Reply' : replyCount + ' Replies';
      var $replyCount = $('<div class="pull-right" id="reply_count">' + replyCountText + '</div>');
      var $forumFilters = getForumFilters().addClass('pull-left');
      $forumFiltersRow = $('<div class="filter-row">').append($forumFilters, $replyCount);
    }

    $content.removeClass('pre-rendered').empty().append(
      $root,
      $forumViewsTabs || '<hr class="small">',
      $forumFiltersRow,
      $childrenAnchor.empty().append(
        mkReplyNotes(replytoIdToChildren, replytoIdToChildren[forumId], 1)
      )
    );

    typesetMathJax();
    $content.trigger('forumRendered');
  };

  var createMultiSelector = function(filters, id) {
    var htmlFilters = filters.map(function(filter) {
      return {
        valueFilter: filter,
        textFilter: view.prettyId(filter)
      };
    });
    var buttonText = 'all';
    if (id === 'signatures') {
      buttonText = 'everybody';
    } else if (id === 'readers') {
      buttonText = 'all readers';
    }
    var multiselector = Handlebars.templates['partials/multiselectorDropdown']({
      buttonText: buttonText,
      id: id,
      htmlFilters: htmlFilters
    });
    return multiselector;
  };

  // Gets invitation groups in a note. There is always going to be just one Invitation per note.
  var getInvitationFilters = function(note) {
    return [view.prettyId(note.invitation, true).replace(/ /g, '_')];
  };

  // Gets signature groups in a note as an array.
  var getSignatureFilters = function(note) {
    return note.signatures.map(function(signature) {
      return view.prettyId(signature, true).replace(/ /g, '_');
    });
  };

  // Gets readers groups in a note as an array.
  var getReadersFilters = function(note) {
    return note.readers.map(function(reader) {
      return view.prettyId(reader, true).replace(/ /g, '_');
    });
  };

  // A Filter can be: Meta_Review, Official_Comment, Reviewer1, etc.
  // This function maps a Filter to its corresponding array of Notes.
  var createFiltersToNotes = function(notes, getFilters) {
    var filtersToNotes = {};
    for (var i = 0; i < notes.length; i += 1) {
      var note = notes[i];
      var filters = getFilters(note);
      for (var j = 0; j < filters.length; j++) {
        if (filtersToNotes[filters[j]]) {
          filtersToNotes[filters[j]].push(note);
        } else {
          filtersToNotes[filters[j]] = [note];
        }
      }
    }
    return filtersToNotes;
  };

  // Returns Notes that are parents (replyto) of the intersection Notes. This is done so that the Note is expanded as well as its parents, otherwise, it would not be visible.
  var getNotesToExpand = function(intersection, noteIdToNote) {
    var notesToExpand = [];
    intersection.forEach(function(note) {
      notesToExpand.push(note);
      addParents(note.replyto, notesToExpand, noteIdToNote);
    });
    return _.uniq(notesToExpand);
  };

  var addParents = function(noteId, notesToExpand, noteIdToNote) {
    // Convert note id to Note
    var note = noteIdToNote[noteId];
    // Do not include the Submission Note in any Group. noteIdToNote does not include the id of the submission. Therefore, note would be undefined.
    if (note) {
      notesToExpand.push(note);
      // Recur to add all parent parents
      addParents(note.replyto, notesToExpand, noteIdToNote);
    }
  };

  // Gets all the Notes in the Forum except the Submission
  var getForumReplies = function(noteRecs) {
    return _.map(noteRecs, 'note').filter(function(note) {
      return note.id !== note.forum;
    });
  };

  // Accepts notesToCollapse and notesToExpand which are arrays of Notes.
  var filterNotes = function(notesToExpand, notesToCollapse) {
    var shouldCollapse = function(collapse) {
      return function(note) {
        var comment = $('#note_' + note.id).parent();
        // If want to collapse and it's collapsed, do nothing. If want to expand and it's expanded, do nothing. Otherwise click to collapse or expand.
        if (comment.hasClass('collapsed') !== collapse) {
          $('#note_' + note.id).prev().click();
        }
      };
    };

    notesToCollapse.forEach(shouldCollapse(true));
    notesToExpand.forEach(shouldCollapse(false));
  };

  // Takes in a 'dictionary' that maps Invitatiions/Signatures to Notes and an array that contains all the filters (key values) to map the Invitations/Signatures to their corresponding Note.
  // This function returns a union of Notes resulting from all the filters mapping to their corresponding Notes.
  var getUnion = function(filterToNotes, filters) {
    return filters.reduce(function(notes, filter) {
      return _.unionBy(notes, filterToNotes[filter], 'id');
    }, []);
  };

  // Gets all the checkboxes and places them in an array depending on whether they are checked or unchecked
  var classifyCheckboxes = function(checkboxes) {
    var checkedFilters = [];
    var uncheckedFilters = [];
    checkboxes.each(function() {
      if (this.checked) {
        checkedFilters.push(this.value);
      } else {
        uncheckedFilters.push(this.value);
      }
    });
    return {
      checked: checkedFilters,
      unchecked: uncheckedFilters
    };
  };

  // Decides what to write in the dropdown button depending on the selections made
  // This could be different, I haven't come up with a better way of displaying it
  var getButtonText = function(checkboxes, type) {
    var checked = checkboxes.checked.map(function(checkbox) {
      return checkbox.split('_').join(' ');
    });
    var maxWordsToDisplay = 3; // Max amount of words to display on the button
    if (type === 'invitations' && checked.length === 0) return 'nothing';
    if ((type === 'signatures' || type === 'readers') && checked.length === 0) return 'nobody';
    if (type === 'invitations' && checkboxes.unchecked.length === 0) return 'all';
    if (type === 'signatures' && checkboxes.unchecked.length === 0) return 'everybody';
    if (type === 'readers' && checkboxes.unchecked.length === 0) return 'all readers';
    if (checked.length === 1) return checked[0];
    if (checked.length === 2) return checked[0] + ' and ' + checked[1];
    var buttonText = '';
    var wordsToDisplay = checked.length > maxWordsToDisplay ? maxWordsToDisplay : checked.length - 1;
    for (var i = 0; i < wordsToDisplay; i++) {
      buttonText += checked[i] + ', ';
    }
    if (checked.length > maxWordsToDisplay) {
      return buttonText + '...';
    } else {
      return buttonText + 'and ' + checked[checked.length - 1];
    }
  };

  // Action taken every time a value in the filters is chosen
  var applyFilter = function(event) {
    if (event) event.stopPropagation();
    var invitationCheckboxes = classifyCheckboxes($('.invitations-multiselector-checkbox'));
    $('#invitations').text(getButtonText(invitationCheckboxes, 'invitations'));
    var signatureCheckboxes = classifyCheckboxes($('.signatures-multiselector-checkbox'));
    $('#signatures').text(getButtonText(signatureCheckboxes, 'signatures'));
    var readersCheckboxes = classifyCheckboxes($('.readers-multiselector-checkbox'));
    $('#readers').text(getButtonText(readersCheckboxes, 'readers'));
    $('#invitations').next().find('input.select-all-checkbox').prop('checked', invitationCheckboxes.unchecked.length === 0);
    $('#signatures').next().find('input.select-all-checkbox').prop('checked', signatureCheckboxes.unchecked.length === 0);
    $('#readers').next().find('input.select-all-checkbox').prop('checked', readersCheckboxes.unchecked.length === 0);
    var invitationUnion = getUnion(sm.get('invitationToNotes'), invitationCheckboxes.checked);
    var signatureUnion = getUnion(sm.get('signatureToNotes'), signatureCheckboxes.checked);
    var readerUnion = getUnion(sm.get('readerToNotes'), readersCheckboxes.checked);
    var intersection = _.intersectionBy(signatureUnion, invitationUnion, readerUnion, 'id');
    var notesToExpand = getNotesToExpand(intersection, sm.get('noteIdToNote'));
    var notesToCollapse = _.difference(sm.get('forumReplies'), notesToExpand);
    filterNotes(notesToExpand, notesToCollapse);
  };

  var applySelectAllFilters = function(event) {
    // Select/Unselect all the checkboxes
    var checkboxes = $(this).closest('li').siblings().find('input');
    checkboxes.prop('checked', $(this).prop('checked'));
    // Apply filter
    applyFilter(event);
  };

  var setFilters = function(filtersObj) {
    Object.keys(filtersObj).forEach(function(filterName) {
      $dropdown = $('#' + filterName).next();
      if (!$dropdown.length) return;

      if (filtersObj[filterName]) {
        $dropdown.find('li input[type="checkbox"]').each(function() {
          var val = $(this).attr('value');
          $(this).prop('checked', filtersObj[filterName].includes(val));
        });
      } else {
        // No filters selected, check all boxes
        $dropdown.find('li input[type="checkbox"]').prop('checked', true);
      }
    });
  };

  // Uses an array of compare functions to determine what comes first: a or b.
  var sortCriteria = function(a, b, compareFuncs) {
    var criteria;
    for (var i = 0; i < compareFuncs.length; i++) {
      // Tries to find criteria to sort a and b
      criteria = compareFuncs[i](a, b);
      // Return criteria if found, otherwise, continue searching
      if (criteria) return criteria;
    }
    // Keep same order as before by returning 0. In this case it would be alphabetical order
    return 0;
  };

  // Always places any string AFTER the string that contains substr
  var allAfter = function(substr) {
    return function(a, b) {
      if (a.indexOf(substr) !== -1 && b.indexOf(substr) !== -1) return 0;
      if (a.indexOf(substr) !== -1) return -1;
      if (b.indexOf(substr) !== -1) return 1;
    };
  };

  // Always places any string BEFORE the string that contains substr
  var allBefore = function(substr) {
    return function(a, b) {
      if (a.indexOf(substr) !== -1 && b.indexOf(substr) !== -1) return 0;
      if (a.indexOf(substr) !== -1) return 1;
      if (b.indexOf(substr) !== -1) return -1;
    };
  };

  var sortFilters = function(filters, compareFuncs) {
    // Sort in alphabetical order first
    filters.sort();
    // Sort by groups/invitations
    return filters.sort(function(a, b) {
      var lowerA = a.toLowerCase();
      var lowerB = b.toLowerCase();
      // use helper function with a set of rules.
      // e.g. compareFuncs = [allAfter('author'), allAfter('reviewer'), allAfter('chair'), allBefore('anonymous')];
      // The array compareFuncs indicates what strings that contain the passed substring
      // (author, reviewer, etc.) should come first. Smaller index in the array takes precedence
      // (e.g. allAfter('author') has precedence over allAfter('reviewer')).
      // Any string containing the substring author will come first than any other string in the array to be sorted
      // Any string that does not contain any of the substrings will be placed after all the
      // allAfter and before all the allBefore (e.g. Carlos Mondragon will come after Chairs but before Anonymous)
      return sortCriteria(lowerA, lowerB, compareFuncs);
    });
  };

  // These creates the multiselectors and returns a jQuery object that contains them
  var getForumFilters = function() {
    var forumReplies = getForumReplies(sm.get('noteRecs'));
    sm.update('forumReplies', forumReplies);
    sm.update('noteIdToNote', _.keyBy(forumReplies, 'id'));
    sm.update('signatureToNotes', createFiltersToNotes(forumReplies, getSignatureFilters));
    sm.update('invitationToNotes', createFiltersToNotes(forumReplies, getInvitationFilters));
    sm.update('readerToNotes', createFiltersToNotes(forumReplies, getReadersFilters));

    var invitationFilters = _.keys(sm.get('invitationToNotes'));
    sortFilters(invitationFilters, [allAfter('decision'), allAfter('review'), allAfter('comment')]);
    var invitationMultiSelector = createMultiSelector(invitationFilters, 'invitations');

    var signatureFilters = _.keys(sm.get('signatureToNotes'));
    sortFilters(signatureFilters, [allAfter('author'), allAfter('reviewer'), allAfter('chair'), allBefore('anonymous')]);
    var signatureMultiSelector = createMultiSelector(signatureFilters, 'signatures');

    var readersFilters = _.keys(sm.get('readerToNotes'));
    sortFilters(readersFilters, [allAfter('author'), allAfter('reviewer'), allAfter('chair'), allBefore('anonymous')]);
    var readersMultiSelector = createMultiSelector(readersFilters, 'readers');

    return $('<div class="filter-container">').append(
      '<span>Reply Type:</span>',
      invitationMultiSelector,
      '<span>Author:</span>',
      signatureMultiSelector,
      '<span>Readers:</span>',
      readersMultiSelector
    );
  };

  // Build the filter tabs from forum views array
  var getForumViewTabs = function(replyForumViews) {
    if (_.isEmpty(replyForumViews)) return null;

    return $('<ul class="nav nav-tabs filter-tabs">').append(
      replyForumViews.map(function(view) {
        return $(
          '<li role="presentation"><a href="#' + view.id + '">' + view.label + '</a></li>'
        ).data('filter', view.filter);
      })
    );
  };

  // Convert filter query string into object representing all the active filters
  // Copied from lib/forum-utils.js
  var parseFilterQuery = function(filterQuery, searchQuery) {
    var filterObj = (filterQuery || '').split(' ').reduce(function(map, token) {
      var [field, val] = token.split(':');
      if (val) {
        var mapKey = field.startsWith('-')
          ? 'excluded' + field.slice(1, 2).toUpperCase() + field.slice(2)
          : field;
        // eslint-disable-next-line no-param-reassign
        map[mapKey] = val.split(',').map(function(id) {
          return view.prettyId(id, true).replace(/ /g, '_');
        });
      }
      return map;
    }, {});

    if (searchQuery) {
      filterObj.keywords = [searchQuery.toLowerCase()];
    }

    return filterObj;
  }

  // Convert filter query string into object representing all the active filters
  // Copied from lib/forum-utils.js
  var replaceFilterWildcards = function(filterQuery, replyNote) {
    return filterQuery.replace(/\${note\.([\w.]+)}/g, (match, field) => _.get(replyNote, field, ''));
  }

  onTokenChange();
};
