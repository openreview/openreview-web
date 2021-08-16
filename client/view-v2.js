/**
 * Changes:
 * - Replace all /static/images/ --> /images/
 * - Replace all $('body') --> $('#content')
 * - Replace all { overlay: true } --> { scrollToTop: false }
 */
 module.exports = (function() {
  var valueInput = function(contentInput, fieldName, fieldDescription) {
  };

  var markdownInput = function($contentInput, fieldName, fieldDescription) {
  };

  /* Schema of Field Description in Invitation
  fieldDescritption = {
    value: {
      value/value-regex etc.,
      optional,
      nullable,
    },
    presentation: {
      markdown,
      default, // type: array,string
      hidden,
      scroll,
      hideCharCounter,

    },
    order,
    description,
    disableAutosave, // remove
  }
  */

  var mkComposerContentInput = function(fieldName, fieldDescription, fieldValue, params) {
  };

  var mkComposerInput = function(fieldName, fieldDescription, fieldValue, params) {
  };

  // Private helper function used by mkPdfSection and mkAttachmentSection
  var mkFileRow = function($widgets, fieldName, fieldDescription, fieldValue) {
  };

  var mkPdfSection = function(fieldDescription, fieldValue) {
  };

  var mkAttachmentSection = function(fieldName, fieldDescription, fieldValue) {
  };

  var getTitleText = function(note, generatedTitleText) {
    if (_.trim(note.content.title?.value)) {
      return note.content.title.value;
    }
    if (_.trim(note.content.verdict?.value)) {
      return 'Verdict: ' + note.content.verdict.value;
    }
    return generatedTitleText;
  };

  var mkPdfIcon = function(note, isEdit) {
    // PDF for title
    var $pdfLink = null;
    if (note.content.pdf?.value) {
      var downloadURL = pdfUrl(note, isEdit);
      $pdfLink = $('<a>', {
        class: 'note_content_pdf',
        href: downloadURL,
        title: 'Download PDF',
        target: '_blank'
      }).append(
        '<img src="/images/pdf_icon_blue.svg">'
      );
    }
    return $pdfLink;
  };

  var mkHtmlIcon = function(note) {
    var $htmlLink = null;
    if (note.content.html?.value) {
      $htmlLink = $('<a>', {
        class: 'note_content_pdf html-link',
        href: note.content.html?.value,
        title: 'Open Website',
        target: '_blank'
      }).append(
        '<img src="/images/html_icon_blue.svg">'
      );
    }
    return $htmlLink;
  };

  var getAuthorText = function(note) {
    var notePastDue = note.ddate && note.ddate < Date.now();
    var authorText;
    if (notePastDue) {
      // Note trashed
      authorText = '[Deleted]';

    } else if (_.isArray(note.content.authors?.value) && note.content.authors.value.length) {
      // Probably a forum-level note (because it has authors)
      if (_.isArray(note.content.authorids?.value) && note.content.authorids.value.length) {
        authorText = note.content.authors?.value?.map(function(a, i) {
          var aId = note.content.authorids.value[i];
          if (!aId) {
            return a;
          }

          if (aId.indexOf('~') === 0) {
            return '<a href="/profile?id='+ encodeURIComponent(aId) +
              '" class="profile-link" data-toggle="tooltip" data-placement="bottom" title="'+ aId +'">'+ a +'</a>';
          } else if (aId.indexOf('@') !== -1) {
            return '<a href="/profile?email='+ encodeURIComponent(aId) +
              '" class="profile-link" data-toggle="tooltip" data-placement="bottom" title="'+ aId +'">'+ a +'</a>';
          } else if (aId.indexOf('http') === 0) {
            return '<a href="'+ aId +
              '" class="profile-link" data-toggle="tooltip" data-placement="bottom" title="'+ aId +'">'+ a +'</a>';
          } else {
            return a;
          }
        }).join(', ');
      } else {
        authorText = note.content.authors?.value?.join(', ');
      }

    } else {
      // Note with no authors, just signatures, such as a forum comment
      authorText = note.signatures.map(function(signature) {
        if (signature.indexOf('~') === 0) {
          return '<a href="/profile?id='+ encodeURIComponent(signature) +'" class="profile-link">'+ view.prettyId(signature) +'</a>';
        } else {
          return view.prettyId(signature);
        }
      }).join(', ');
    }
    return authorText;
  };

  var buildContent = function(note, params, additionalOmittedFields) {
    if (!params.withContent || (note.ddate && note.ddate < Date.now())) {
      return;
    }

    var contentKeys = Object.keys(note.content);
    const contentOrder = note.details.presentation
      ? Object.values(note.details.presentation ?? {}).sort((a, b) => a?.order - b?.order).map(p => p.name)
      : contentKeys

    var omittedContentFields = [
      'title', 'authors', 'authorids', 'pdf',
      'verdict', 'paperhash', 'html', 'year', 'venue', 'venueid'
    ].concat(additionalOmittedFields || []);

    var $contents = [];
    contentOrder.forEach(function(fieldName) {
      if (omittedContentFields.includes(fieldName) || fieldName.startsWith('_')) {
        return;
      }

      var valueString = view.prettyContentValue(note.content[fieldName]?.value);
      if (!valueString) {
        return;
      }

      let privateLabel = null
      if (note.content[fieldName]?.readers && !_.isEqual(note.readers?.sort(), note.content[fieldName].readers.sort())) {
        var tooltip = `privately revealed to ${note.content[fieldName].readers.map(p =>view.prettyId(p)).join(', ')}`
        privateLabel = `<span class="private-contents-icon glyphicon glyphicon-lock" title="${tooltip}" data-toggle="tooltip" data-placement="top"/>`
      }

      // Build download links
      if (valueString.indexOf('/attachment/') === 0) {
        $contents.push($('<div>', {class: 'note_contents'}).append(
          $('<span>', {class: 'note_content_field'}).text(view.prettyField(fieldName) + ': '),
          privateLabel,
          $('<span>', {class: 'note_content_value'}).html(
            view.mkDownloadLink(note.id, fieldName, valueString, { isReference: params.isEdit })
          )
        ));
        return;
      }

      var $elem = $('<span>', {class: 'note_content_value'});
      if (note.details.presentation?.find(p=>p.name === fieldName)?.markdown) {
        $elem[0].innerHTML = DOMPurify.sanitize(marked(valueString));
        $elem.addClass('markdown-rendered');
      } else {
        // First set content as text to escape HTML, then autolink escaped HTML
        $elem.text(valueString);
        $elem.html(view.autolinkHtml($elem.html()));

      }

      $contents.push($('<div>', {class: 'note_contents'}).append(
        $('<span>', {class: 'note_content_field'}).text(view.prettyField(fieldName) + ': '),
        privateLabel,
        $elem,
      ));
    });

    return $contents;
  };

  var mkNotePanel = function(note, options) {
    var params = _.assign({
      invitation: null,
      onEditRequested: null,
      deleteOnlyInvitation: null,
      editInvitations:[],
      replyInvitations: [],
      tagInvitations: [],
      onNewNoteRequested: null,
      titleLink: 'NONE', // NONE | HREF | JS
      withContent: false,
      withReplyCount: false,
      withRevisionsLink: false,
      withParentNote: false,
      onTrashedOrRestored: null,
      isEdit: false,
      user: {},
      withModificationDate: false,
      withDateTime: false,
      withBibtexLink: true,
      readOnlyTags: false,
      isEdit: false,
    }, options);
    var $note = $('<div>', {id: 'note_' + note.id, class: 'note panel'});
    var forumId = note.forum;
    var details = note.details || {};
    var canEdit = details.writable;

    var notePastDue = note.ddate && note.ddate < Date.now();
    if (notePastDue) {
      $note.addClass('trashed');
    }

    if (note.content._disableTexRendering?.value) {
      $note.addClass('disable-tex-rendering');
    }

    var generatedTitleText = view.generateNoteTitle(note.invitations[0], note.signatures);
    var titleText = getTitleText(note, generatedTitleText);
    var useGeneratedTitle = !_.trim(note.content.title?.value) && !_.trim(note.content.verdict?.value);
    var $titleHTML = view.mkTitleComponent(note, params.titleLink, titleText);

    var $pdfLink = mkPdfIcon(note, params.isEdit);
    var $htmlLink = mkHtmlIcon(note);

    // Link to comment button
    var $linkButton = null;
    if (forumId !== note.id && $('#content').hasClass('legacy-forum')) {
      var commentUrl = location.origin + '/forum?id=' + forumId + '&noteId=' + note.id;
      $linkButton = $('<button class="btn btn-xs btn-default permalink-button" title="Link to this comment" data-permalink-url="' + commentUrl + '">' +
        '<span class="glyphicon glyphicon-link" aria-hidden="true"></span></button>');
    }

    // Trash button
    var $trashButton = null;
    if ($('#content').hasClass('forum') || $('#content').hasClass('tasks') || $('#content').hasClass('revisions')) {
      if (canEdit && params.onTrashedOrRestored && params.deleteOnlyInvitation) {
        var buttonContent = notePastDue ? 'Restore' : '<span class="glyphicon glyphicon-trash" aria-hidden="true"></span>';
        $trashButton = $('<div>', { class: 'meta_actions' }).append(
          $('<button id="trashbutton_' + note.id + '" class="btn btn-xs trash_button">' + buttonContent + '</button>')
        );
        $trashButton.click(function() {
          deleteOrRestoreNote(note, titleText, params.user, params.onTrashedOrRestored, params.isEdit);
        });

        $titleHTML.addClass('pull-left');
      }
    }

    // Collapsed display for forum
    var $titleCollapsed = $('<div>', { class: 'title_collapsed' }).append(
      $titleHTML.clone().removeClass('pull-left')
    );
    if (useGeneratedTitle) {
      $titleCollapsed.find('.note_content_title').html('<span>' + generatedTitleText + '</span>');
    } else {
      $titleCollapsed.find('.note_content_title').prepend('<span>' + generatedTitleText + '</span> &bull; ');
    }

    var $titleAndPdf = $('<div>', {class: 'title_pdf_row clearfix'}).append(
      // Need the spaces for now to match the spacing of the template code
      $titleHTML.append(' ', $pdfLink, ' ', $htmlLink, $linkButton),
      $trashButton
    );

    var $parentNote = null;
    if (params.withParentNote && note.forumContent && note.forum !== note.id) {
      $parentNote = $('<div class="meta_row parent-title">').append(
        '<span class="item glyphicon glyphicon-share-alt"></span>',
        '<span class="item title">' + note.forumContent.title + '</span>'
      );
    }

    var authorText = getAuthorText(note);

    var $contentSignatures = $('<span>', {class: 'signatures'}).html(authorText);
    var $contentAuthors = $('<div>', {class: 'meta_row'}).append($contentSignatures);

    var trueAuthorText = note.details.signatures?.map(p => p.startsWith('~')
      ? '<a href="/profile?id=' + encodeURIComponent(p) + '" class="profile-link">' + view.prettyId(p) + '</a>'
      : view.prettyId(p)
    ).join(', ')
    if (trueAuthorText) {
      $contentAuthors.append(
        '<span class="author no-margin">' + trueAuthorText + '</span>',
        '<span class="private-author-label">(privately revealed to you)</span>'
      );
    }
    if (note.readers.length == 1 && note.readers[0].indexOf('~') === 0 && note.readers[0] == note.signatures[0]) {
      $contentAuthors.append(
        '<span class="private-author-label">(visible only to you)</span>'
      );
    }

    var $revisionsLink = (params.withRevisionsLink && details.revisions) ?
      $('<a>', { class: 'note_content_pdf item', href: '/revisions?id=' + note.id, text: 'Show Revisions' }) :
      null;

    // Display modal showing full BibTeX reference. Click handler is definied in public/index.js
    var $bibtexLink = (note.content._bibtex?.value && params.withBibtexLink) ?
      $('<span class="item"><a href="#" data-target="#bibtex-modal" data-toggle="modal" data-bibtex="' + encodeURIComponent(note.content._bibtex.value) + '">Show Bibtex</a></span>') :
      null;

    var $metaEditRow = $('<div>', {class: 'meta_row'});
    var formattedDate = view.forumDate(note.cdate, note.tcdate, note.mdate, note.tmdate, note.content.year?.value);
    var $dateItem = (!notePastDue || details.writable) ?
      $('<span>', {class: 'date item'}).text(formattedDate) :
      null;
    var $invItem = $('<span>', {class: 'item'}).text(options.isEdit ? view.prettyId(note.invitations[0]) : note.content.venue?.value || view.prettyId(note.invitations[0]));
    var $readersItem = _.has(note, 'readers') ?
      $('<span>', {class: 'item'}).html('Readers: ' + view.prettyReadersList(note.readers)) :
      null;
    var $replyCountLabel = (params.withReplyCount && details.replyCount) ?
      $('<span>', {class: 'item'}).text(details.replyCount === 1 ? '1 Reply' : details.replyCount + ' Replies') :
      null;
    $metaEditRow.append(
      $dateItem,
      $invItem,
      $readersItem,
      $replyCountLabel,
      $bibtexLink,
      $revisionsLink
    );

    var $metaActionsRow = null;
    if (canEdit && params.editInvitations?.length) {
      var $editInvitations = _.map(params.editInvitations, function (invitation) {
        return $('<button class="btn btn-xs edit_button referenceinvitation">').text(view.prettyInvitationId(invitation.id)).click(function () {
          params.onEditRequested(invitation);
        });
      });
      $metaActionsRow = $('<div>', {class: 'meta_row meta_actions'}).append(
        '<span class="item hint">Edit</span>',
        $editInvitations
      );
      $metaEditRow.addClass('pull-left');
    }

    $note.append(
      $titleAndPdf,
      $titleCollapsed,
      $parentNote,
      $contentAuthors,
      $('<div class="clearfix">').append($metaEditRow, $metaActionsRow),
      buildContent(note, params)
    );

    var buildTag = function(tags, tagInvitation) {
      var buildRelations = function(relation) {
        var description = tagInvitation.edit?.note?.[relation];

        if (_.has(description, 'values')) {
          return description.values;
        }

        if (_.has(description, 'values-regex')) {
          if (_.startsWith(description['value-regex'], '~.*')) {
            return [params.user.profile.id];
          }
        }

        // Default value: logged in user
        return [params.user.profile.id];
      };

      return view.mkTagInput('tag', tagInvitation.edit?.note?.content?.tag?.value, tags, {
        forum: note.id,
        placeholder: (tagInvitation.edit?.note?.content?.tag?.description) || (tagInvitation && view.prettyId(tagInvitation.id)),
        label: tagInvitation && view.prettyInvitationId(tagInvitation.id),
        readOnly: params.readOnlyTags,
        onChange: function(id, value, deleted, done) {
          var body = {
            id: id,
            tag: value,
            signatures: buildRelations('signatures'),
            readers: buildRelations('readers'),
            forum: note.id,
            invitation: tagInvitation.id,
            ddate: deleted ? Date.now() : null
          };
          // body = getCopiedValues(body, tagInvitation.reply);

          Webfield.post('/tags', body, function(result) {
            done(result);
            if (params.onTagChanged) {
              params.onTagChanged(result);
            }
          });
        }
      });
    };

    // Group tags by invitation id and signatures
    var processedInvitations = [];
    var invitationsWithoutTags = [];
    var tagsWithInvitations = [];
    var tagsWithoutInvitations = [];

    // Process tags
    var groupByInvitation = _.groupBy(details.tags, 'invitation');
    _.forEach(groupByInvitation, function(tags) {
      var invitationId = tags[0].invitation;
      var tagInvitation = _.find(params.tagInvitations, ['id', invitationId]);

      // Group tags by signature
      var groupBySignature = _.groupBy(tags, 'signatures');
      _.forEach(groupBySignature, function(signatureTags) {
        if (tagInvitation && _.includes(signatureTags[0].signatures, params.user.profile.id)) {
          tagsWithInvitations.push(buildTag(signatureTags, tagInvitation));
          processedInvitations.push(tagInvitation);
        } else {
          // read-only tag, invitation is not available
          tagsWithoutInvitations.push(buildTag(signatureTags, undefined));
        }
      });
    });

    // Process tag invitations that do not have tags
    var pendingTagInvitations = _.difference(params.tagInvitations, processedInvitations);
    _.forEach(pendingTagInvitations, function(tagInvitation) {
      if (tagInvitation.edit?.note?.invitation || tagInvitation?.edit?.note?.forum === note.id) {
        invitationsWithoutTags.push(buildTag([], tagInvitation));
      }
    });

    // Append tags to note
    var tagWidgets = invitationsWithoutTags.concat(tagsWithInvitations, tagsWithoutInvitations);
    var maxTagsToShow = 3;
    if (tagWidgets.length <= maxTagsToShow) {
      $note.append(tagWidgets);
    } else {
      $note.append(tagWidgets.slice(0, maxTagsToShow));
      $note.append(
        $('<div>', {id: note.id + '-tags', class: 'collapse note-tags-overflow'}).append(
          tagWidgets.slice(maxTagsToShow)
        ),
        '<div><a href="#' + note.id + '-tags" class="note-tags-toggle" role="button" ' +
          'data-toggle="collapse" aria-expanded="false">Show ' + (tagWidgets.length - maxTagsToShow) +
          ' more...</a></div>'
      );
    }

    // Append invitation buttons
    var $replyRow = $('<div>', {class: 'reply_row clearfix'});
    if (!_.isEmpty(params.replyInvitations) && !notePastDue) {
      $replyRow.append(
        '<span class="item hint">Add</span>',
        _.map(params.replyInvitations, function(invitation) {
          return $('<button class="btn btn-xs">').text(view.prettyInvitationId(invitation.id)).click(function() {
            params.onNewNoteRequested(invitation);
          });
        })
      );
    }
    $note.append($replyRow);

    return $note;

  };

  var pdfUrl = function(note, isEdit) {
    var path = isEdit ? '/notes/edits/pdf' : '/pdf';
    return _.startsWith(note.content.pdf?.value, '/pdf') ? (path + '?id=' + note.id) : note.content.pdf?.value;
  };

  var deleteOrRestoreNote = function(note, noteTitle, user, onTrashedOrRestored, isEdit) {
  };

  var loadSignaturesDropdown = function(invitationId, noteSignatures, user) {
  };

  var mkNewNoteEditor = function(invitation, forum, replyto, user, options) {
  };

  function buildReaders(fieldDescription, fieldValue, replyto, done) {
  }

  var mkNoteEditor = function(note, invitation, user, options) {

  };

  var setupMarked = function() {
    var renderer = new marked.Renderer();

    renderer.image = function(href, title, text) {
      return $('<div />').text('<img src="' + href + '" alt="' + text + '" title="' + title + '">').html();
    };
    renderer.checkbox = function(checked) {
      if (checked) return '[x]';
      return '[ ]';
    };
    renderer.html = function(html) {
      return $('<div />').text(html).html();
    };

    // For details on options see https://marked.js.org/#/USING_ADVANCED.md#options
    marked.setOptions({
      baseUrl: null,
      breaks: false,
      gfm: true,
      headerIds: false,
      langPrefix: 'language-',
      mangle: true,
      renderer: renderer,
    });
  };

  var orderCache =  {};
  var order = function(invitationEditNotecontent, invitationId) {
  };

  const constructEdit = ({ noteObj, editObj, invitationObj }) => {
  }

  var validate = function(invitation, content, readersWidget) {
  };

  return {
    // mkNewNoteEditor: mkNewNoteEditor,
    // mkNoteEditor: mkNoteEditor,
    mkNotePanel: mkNotePanel,
    // deleteOrRestoreNote: deleteOrRestoreNote,
    setupMarked: setupMarked
  };

}());
