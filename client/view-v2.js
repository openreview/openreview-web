/**
 * Changes:
 * - Replace all /static/images/ --> /images/
 * - Replace all $('body') --> $('#content')
 * - Replace all { overlay: true } --> { scrollToTop: false }
 */
 module.exports = (function() {
  const valueInput = (contentInput, fieldName, fieldDescription) => {
    const $smallHeading = $('<div>', { text: view.prettyField(fieldName), class: 'small_heading' });
    if (!fieldDescription.value.optional) {
      $smallHeading.prepend('<span class="required_field">*</span>');
    }

    let $description;
    if (fieldDescription.presentation?.scroll) {
      $description = $('<textarea class="form-control scroll-box" readonly>').text(fieldDescription.description);
    } else {
      $description = $('<div class="hint disable-tex-rendering">').text(fieldDescription.description);
    }

    const $row = $('<div>', { class: 'row' }).append(
      $smallHeading, $description, contentInput
    );

    return $row;
  };

  const markdownInput = ($contentInput, fieldName, fieldDescription) => {
    const $smallHeading = $('<div>', { text: view.prettyField(fieldName), class: 'small_heading' });
    if (!fieldDescription.value.optional) {
      $smallHeading.prepend('<span class="required_field">*</span>');
    }

    let $description;
    if (fieldDescription.presentation?.scroll) {
      $description = $('<textarea class="form-control scroll-box" readonly>').text(fieldDescription.description);
    } else {
      $description = $('<div class="hint disable-tex-rendering">').text(fieldDescription.description);
    }

    // Display a warning when "\\" is detected in a MathJax block ($...$ or $$ ... $$)
    // All double backslashes need to be escaped or Markdown will convert it to "\"
    $contentInput.on('input', () => {
      const $warning = $(this).closest('.row').find('.content-warning');
      if ($(this).val().match(/\$[\s\S]*\\\\[\s\S]*\$/)) {
        if ($warning.length === 0) {
          $(this).closest('.row').find('.char-counter').append(
            '<div class="pull-right content-warning danger">' +
              '<strong>IMPORTANT: All uses of "\\\\" in LaTeX formulas should be replaced with "\\\\\\\\"</strong>' +
              '<br><span>Learn more about adding LaTeX formulas to Markdown content here: ' +
              '<a href="/faq#question-tex-differences" target="_blank">FAQ</a></span>' +
            '</div>'
          );
        }
      } else {
        $warning.remove();
      }
    });

    const uniqueId = Math.floor(Math.random() * 1000);
    const $markDownWithPreviewTabs = $(
      '<ul class="nav nav-tabs markdown-preview-tabs" role="tablist">' +
        '<li class="active" role="presentation">' +
          '<a href="#markdown-panel-' + uniqueId + '" data-toggle="tab" role="tab">Write</a>' +
        '</li>' +
        '<li role="presentation">' +
          '<a id="markdown-preview-tab-' + uniqueId + '" href="#markdown-preview-panel-' + uniqueId + '" data-toggle="tab" role="tab">Preview</a>' +
        '</li>' +
      '</ul>' +
      '<div class="tab-content">' +
        '<div class="markdown-panel tab-pane fade in active" id="markdown-panel-' + uniqueId + '" role="tabpanel"></div>' +
        '<div class="markdown-preview-panel tab-pane fade " id="markdown-preview-panel-' + uniqueId + '" role="tabpanel"></div>' +
      '</div>'
    );
    $markDownWithPreviewTabs.find('#markdown-panel-' + uniqueId).append($contentInput);

    const $row = $('<div>', { class: 'row' }).append(
      $smallHeading, $description, $markDownWithPreviewTabs
    );

    $('#markdown-preview-tab-' + uniqueId, $row).on('shown.bs.tab', (e) => {
      const id = $(e.relatedTarget).attr('href');
      const newTabId = $(e.target).attr('href');
      const markdownContent = $(id).children().eq(0).val();
      if (markdownContent) {
        $(newTabId)[0].innerHTML = '<div class="note_content_value markdown-rendered">' +
          DOMPurify.sanitize(marked(markdownContent)) + '</div>';
        setTimeout(() => {
          MathJax.typesetPromise();
        }, 100);
      } else {
        $(newTabId).text('Nothing to preview');
      }
    });

    return $row;
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

  const mkComposerContentInput = (fieldName, fieldDescription, valueInNote, params) => {
    let contentInputResult = null;

    const mkCharCouterWidget = ($input, minChars, maxChars) => {
      const $widget = $('<div>', { class: 'char-counter hint' }).append(
        '<div class="pull-left" style="display:none;">Additional characters required: <span class="min-count">' + minChars + '</span></div>',
        '<div class="pull-left" style="display:none;">Characters remaining: <span class="max-count">' + maxChars + '</span></div>'
      );
      const $minCount = $widget.find('.min-count');
      const $maxCount = $widget.find('.max-count');
      const $divs = $widget.children();

      $input.on('input', _.throttle(() => {
        // Remove extra white spaces at the beginning, at the end and in between words.
        const charsUsed = $input.val().trim().length;
        const charsRequired = minChars - charsUsed;
        const charsRemaining = maxChars - charsUsed;
        $minCount.text(charsRequired);
        $maxCount.text(charsRemaining);

        $widget.removeClass('warning danger');
        if (charsRemaining < 1) {
          $widget.addClass('danger');
        } else if (charsRemaining < 150) {
          $widget.addClass('warning');
        }

        if (charsRequired > 0) {
          $divs.eq(0).show();
          $divs.eq(1).hide();
        } else {
          $divs.eq(0).hide();
          if (maxChars) {
            $divs.eq(1).show();
          } else {
            $divs.eq(1).hide();
          }
        }
      }, 100));

      return $widget;
    };

    const fieldDefault = (params?.useDefaults) ?
      _.get(fieldDescription.presentation, 'default', '') :
      '';
    fieldValue = valueInNote || fieldDefault;  // These will always be mutually exclusive

    var $input;
    if (_.has(fieldDescription.value, 'value')) {
      contentInputResult = valueInput($('<input>', {
        type: 'text',
        class: 'form-control note_content_value',
        name: fieldName,
        value: fieldDescription.value.value,
        readonly: true
      }), fieldName, fieldDescription);

    } else if (_.has(fieldDescription.value, 'values')) {
      contentInputResult = view.mkDropdownAdder(
        fieldName, fieldDescription.description, fieldDescription.value.values,
        fieldValue, { hoverText: true, refreshData: false, required: !fieldDescription.value.optional }
      );

    } else if (_.has(fieldDescription.value, 'value-regex')) {
      var $inputGroup;
      // Create a new regex that doesn't include min and max length
      var regexStr = fieldDescription.value['value-regex'];
      var re = new RegExp('^' + regexStr.replace(/\{\d+,\d+\}$/, '') + '$');
      var newlineMatch = '\n'.match(re);
      if (newlineMatch && newlineMatch.length) {
        $input = $('<textarea>', {
          class: 'note_content_value form-control',
          name: fieldName,
          text: fieldValue
        });

        if (fieldDescription.presentation?.markdown) {
          $inputGroup = markdownInput($input, fieldName, fieldDescription);
        } else {
          $inputGroup = valueInput($input, fieldName, fieldDescription);
        }

        if (!_.get(fieldDescription.presentation, 'hideCharCounter', false)) {
          var lenMatches = _.get(fieldDescription.value, 'value-regex', '').match(/\{(\d+),(\d+)\}$/);
          if (lenMatches) {
            var minLen = parseInt(lenMatches[1], 10);
            var maxLen = parseInt(lenMatches[2], 10);
            minLen = (isNaN(minLen) || minLen < 0) ? 0 : minLen;
            maxLen = (isNaN(maxLen) || maxLen < minLen) ? 0 : maxLen;
            if (minLen || maxLen) {
              $inputGroup.append(mkCharCouterWidget($input, minLen, maxLen));
              if (fieldValue) {
                $input.trigger('keyup');
              }
            }
          }
        }
      } else {
        $input = $('<input>', {
          type: 'text',
          class: 'form-control note_content_value',
          name: fieldName,
          value: fieldValue
        });
        $inputGroup = valueInput($input, fieldName, fieldDescription); //input will probably be omitted field when rendered
      }
      contentInputResult = $inputGroup;

    } else if (_.has(fieldDescription.value, 'values-regex')) {
      if (params && params.groups) {
        var groupIds = _.map(params.groups, function (g) {
          return g.id;
        });
        contentInputResult = view.mkDropdownAdder(
          fieldName, fieldDescription.description, groupIds,
          fieldValue, { hoverText: false, refreshData: true, required: !fieldDescription.value.optional }
        );
      } else {
        $input = $('<input>', {
          type: 'text',
          class: 'form-control note_content_value',
          name: fieldName,
          value: fieldValue
        });
        contentInputResult = valueInput($input, fieldName, fieldDescription);
      }

    } else if (_.has(fieldDescription.value, 'value-dropdown')) {
      contentInputResult = view.mkDropdownList(
        fieldName, fieldDescription.description, fieldValue,
        fieldDescription.value['value-dropdown'], !fieldDescription.value.optional
      );

    } else if (_.has(fieldDescription.value, 'values-dropdown')) {
      contentInputResult = view.mkDropdownAdder(
        fieldName, fieldDescription.description, fieldDescription.value['values-dropdown'],
        fieldValue, { hoverText: false, refreshData: true, required: !fieldDescription.value.optional, alwaysHaveValues: fieldDescription.presentation?.default }
      );

    } else if (_.has(fieldDescription.value, 'value-radio')) {
      $input = $('<div>', { class: 'note_content_value value-radio-container' }).append(
        _.map(fieldDescription.value['value-radio'], function (v) {
          return $('<div>', { class: 'radio' }).append(
            $('<label>').append(
              $('<input>', {
                type: 'radio',
                name: fieldName,
                id: _.kebabCase(fieldName) + '-' + _.kebabCase(v),
                value: v,
                checked: fieldValue === v,
              }),
              v
            )
          );
        })
      );
      contentInputResult = valueInput($input, fieldName, fieldDescription);

    } else if (_.has(fieldDescription.value, 'value-checkbox') || _.has(fieldDescription.value, 'values-checkbox')) {
      var options = _.has(fieldDescription.value, 'value-checkbox') ?
        [fieldDescription.value['value-checkbox']] :
        fieldDescription.value['values-checkbox'];
      var checkedValues = _.isArray(fieldValue) ? fieldValue : [fieldValue];
      var requiredValues = fieldDescription.presentation?.default;

      var checkboxes = _.map(options, function (option) {
        var checked = _.includes(checkedValues, option) ? 'checked' : '';
        var disabled = _.includes(requiredValues, option) ? 'disabled' : '';
        return '<label class="checkbox-inline">' +
          '<input type="checkbox" name="' + fieldName + '" value="' + option + '" ' + checked + ' ' + disabled + '> ' + (params.prettyId ? view.prettyId(option) : option) +
          '</label>';
      });
      contentInputResult = valueInput('<div class="note_content_value no-wrap">' + checkboxes.join('\n') + '</div>', fieldName, fieldDescription);

    } else if (_.has(fieldDescription.value, 'value-copied') || _.has(fieldDescription.value, 'values-copied')) {
      contentInputResult = valueInput($('<input>', {
        type: 'hidden',
        class: 'note_content_value',
        name: fieldName,
        value: fieldDescription.value['value-copied'] || fieldDescription.value['values-copied']
      }), fieldName, fieldDescription).css('display', 'none');

    } else if (_.has(fieldDescription.value, 'value-dict')) {
      contentInputResult = valueInput($('<textarea>', {
        class: 'note_content_value form-control',
        name: fieldName,
        text: fieldValue && JSON.stringify(fieldValue, undefined, 4)
      }), fieldName, fieldDescription);

    } else if (_.has(fieldDescription.value, 'value-file')) {
      contentInputResult = mkAttachmentSection(fieldName, fieldDescription, fieldValue);
    }

    return contentInputResult;
  };

  const mkComposerInput = (fieldName, fieldDescription, fieldValue, params) => {
    let contentInputResult;

    if (fieldName === 'pdf' && fieldDescription.value['value-regex']) {
      contentInputResult = mkPdfSection(fieldDescription, fieldValue);

    } else if (fieldName === 'authorids' && (
      (_.has(fieldDescription.value, 'values-regex') && view.isTildeIdAllowed(fieldDescription.value['values-regex'])) ||
      _.has(fieldDescription.value, 'values')
    )) {
      let authors;
      let authorids;
      if (params?.note) {
        authors = params.note.content.authors?.value;
        authorids = params.note.content.authorids?.value;
      } else if (params && params.user) {
        const userProfile = params.user.profile
        authors = [userProfile.first + ' ' + userProfile.middle + ' ' + userProfile.last];
        authorids = [userProfile.preferredId];
      }
      const invitationRegex = fieldDescription.value?.['values-regex'];
      // Enable allowUserDefined if the values-regex has '~.*|'
      // Don't enable adding or removing authors if invitation uses 'values' instead of values-regex
      contentInputResult = valueInput(
        view.mkSearchProfile(authors, authorids, {
          allowUserDefined: invitationRegex && invitationRegex.includes('|'),
          allowAddRemove: !!invitationRegex
        }),
        'authors',
        fieldDescription
      );

    } else {
      contentInputResult = mkComposerContentInput(fieldName, fieldDescription, fieldValue, params);
    }

    if (fieldDescription.presentation?.hidden === true) {
      return contentInputResult.hide();
    }
    return contentInputResult;
  };

  // Private helper function used by mkPdfSection and mkAttachmentSection
  const mkFileRow = ($widgets, fieldName, fieldDescription, fieldValue) => {
    const smallHeading = $('<div>', {text: view.prettyField(fieldName), class: 'small_heading'});
    if (!fieldDescription.value.optional) {
      const requiredText = $('<span>', {text: '*', class: 'required_field'});
      smallHeading.prepend(requiredText);
    }

    const $noteContentVal = $('<input>', {class: 'note_content_value', name: fieldName, value: fieldValue, style: 'display: none;'})

    const $fieldValue = fieldValue
      ? $('<span class="item hint existing-filename">(' + fieldValue + ')</span>')
      : null;

    return $('<div>', {class: 'row'}).append(
      smallHeading,
      $('<div>', {text: fieldDescription.description, class: 'hint'}),
      $noteContentVal,
      $widgets,
      $fieldValue
    );
  };

  const mkPdfSection = (fieldDescription, fieldValue) => {
    const order = fieldDescription.order;
    const regexStr = fieldDescription.value['value-regex'];
    const invitationFileTransfer = view.fileTransferByInvitation(regexStr);

    if (invitationFileTransfer === 'upload') {
      return mkFileRow(view.mkFileInput('pdf', 'file', order, regexStr), 'pdf', fieldDescription, fieldValue);

    } else if (invitationFileTransfer === 'url') {
      return mkFileRow(view.mkFileInput('pdf', 'text', order, regexStr), 'pdf', fieldDescription, fieldValue);

    } else if (invitationFileTransfer === 'either') {
      const $span = $('<div>', {class: 'item', style: 'width: 80%'});
      const timestamp = Date.now();
      const $radioItem = $('<div>', {class: 'item'}).append(
        $('<div>').append(
          $('<input>', {class: 'upload', type: 'radio', name: 'pdf_' + timestamp}).click(function() {
            $span.html(view.mkFileInput('pdf', 'file', order, regexStr));
          }),
          $('<span>', {class: 'item', text: 'Upload PDF file'})
        ),
        $('<div>').append(
          $('<input>', {class: 'url', type: 'radio', name: 'pdf_' + timestamp}).click(function() {
            $span.html(view.mkFileInput('pdf', 'text', order, regexStr));
          }),
          $('<span>', {class: 'item', text: 'Enter URL'})
        )
      );
      return mkFileRow([$radioItem, $span], 'pdf', fieldDescription, fieldValue);
    }
  };

  const mkAttachmentSection = (fieldName, fieldDescription, fieldValue) => {
    const order = fieldDescription.order;
    const regexStr = fieldDescription.value?.['value-file']?.regex;
    const mimeType = fieldDescription.value?.['value-file']?.mimetype;
    const size = fieldDescription.value?.['value-file']?.size;

    let invitationFileTransfer = 'url';
    if (regexStr && (mimeType || size)) {
      invitationFileTransfer = 'either';
    } else if (!regexStr) {
      invitationFileTransfer = 'upload';
    }

    if (invitationFileTransfer === 'upload') {
      return mkFileRow(view.mkFileInput(fieldName, 'file', order, regexStr), fieldName, fieldDescription, fieldValue);

    } else if (invitationFileTransfer === 'url') {
      return mkFileRow(view.mkFileInput(fieldName, 'text', order, regexStr), fieldName, fieldDescription, fieldValue);

    } else if (invitationFileTransfer === 'either') {
      const $span = $('<div>', {class: 'item', style: 'width: 80%'});
      const timestamp = Date.now();
      const $radioItem = $('<div>', {class: 'item'}).append(
        $('<div>').append(
          $('<input>', { class: 'upload', type: 'radio', name: fieldName + '_' + timestamp }).click(() => {
            $span.html(view.mkFileInput(fieldName, 'file', order, regexStr));
          }),
          $('<span>', {class: 'item', text: 'Upload file'})
        ),
        $('<div>').append(
          $('<input>', { class: 'url', type: 'radio', name: fieldName + '_' + timestamp }).click(() => {
            $span.html(view.mkFileInput(fieldName, 'text', order, regexStr));
          }),
          $('<span>', {class: 'item', text: 'Enter URL'})
        )
      );
      return mkFileRow([$radioItem, $span], fieldName, fieldDescription, fieldValue);
    }
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

   const buildContent = (note, params, additionalOmittedFields) => {
    if (!params.withContent || (note.ddate && note.ddate < Date.now())) {
      return;
    }

    const contentKeys = Object.keys(note.content);
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

      // Build download links
      if (valueString.indexOf('/attachment/') === 0) {
        $contents.push($('<div>', {class: 'note_contents'}).append(
          $('<span>', {class: 'note_content_field'}).text(view.prettyField(fieldName) + ': '),
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
        $elem
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
    if (forumId !== note.id && $('#content').hasClass('forum')) {
      var commentUrl = location.origin + '/forum?id=' + forumId + '&noteId=' + note.id;
      $linkButton = $('<button class="btn btn-xs btn-default permalink-button" title="Link to this comment" data-permalink-url="' + commentUrl + '">' +
        '<span class="glyphicon glyphicon-link" aria-hidden="true"></span></button>');
    }

    // Trash button
    var $trashButton = null;
    var $actionButtons = null;
    if ($('#content').hasClass('forum') || $('#content').hasClass('tasks') || $('#content').hasClass('revisions')) {
      var canEdit = details.writable;
      if (canEdit && params.onTrashedOrRestored && params.deleteOnlyInvitation) {
        var buttonContent = notePastDue ? 'Restore' : '<span class="glyphicon glyphicon-trash" aria-hidden="true"></span>';
        $trashButton = $('<button id="trashbutton_' + note.id + '" class="btn btn-xs trash_button">' + buttonContent + '</button>');
        $trashButton.click(function() {
          deleteOrRestoreNote(note, titleText, params.user, params.onTrashedOrRestored, params.isEdit);
        });
      }

      if ($trashButton) {
        $actionButtons = $('<div>', {class: 'meta_actions'}).append($trashButton);
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
      $actionButtons
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

    var trueAuthorText = (note.tauthor && note.tauthor.indexOf('~') === 0) ?
      '<a href="/profile?id='+ encodeURIComponent(note.tauthor) +'" class="profile-link">'+ view.prettyId(note.tauthor) +'</a>' :
      view.prettyId(note.tauthor);
    if (!note.content.authors?.value && trueAuthorText && trueAuthorText !== authorText) {
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
    // var $modifiableOriginalButton = null;

    var $editInvitations = _.map(params.editInvitations, function(invitation) {
      return $('<button class="btn btn-xs edit_button referenceinvitation">').text(view.prettyInvitationId(invitation.id)).click(function() {
        params.onEditRequested(invitation);
      });
    });
    if ($editInvitations) {
      $metaActionsRow = $('<div>', {class: 'meta_row meta_actions'}).append(
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

  const buildReaders = (fieldDescription, fieldValue, replyto, done) => {
    var requiredText = $('<span>', { text: '*', class: 'required_field' });
    var setParentReaders = function(parent, fieldDescription, fieldType, done) {
      if (parent) {
        Webfield2.get('/notes', { id: parent }).then(function(result) {
          var newFieldDescription = { value: fieldDescription };
          if (result.notes.length) {
            var parentReaders = result.notes[0].readers;
            if (!_.includes(parentReaders, 'everyone')) {
              newFieldDescription = {
                value:{},
                description: fieldDescription.description,
                presentation: { default: fieldDescription.default }
              };
              newFieldDescription.value[fieldType] = parentReaders;
              if (!fieldValue.length) {
                fieldValue = newFieldDescription[fieldType];
              }
            }
          }
          done(newFieldDescription);
        });
      } else {
        done({ value: fieldDescription });
      }
    };

    if (_.has(fieldDescription, 'values-regex')) {
      Webfield.get('/groups', { regex: fieldDescription['values-regex'] }, { handleError: false }).then(function(result) {
        if (_.isEmpty(result.groups)) {
          done(undefined, 'no_results');
        } else {
          var everyoneList = _.filter(result.groups, function(g) {
            return g.id === 'everyone';
          });
          var restOfList = _.sortBy(_.filter(result.groups, function(g) {
            return g.id !== 'everyone';
          }), function(g) {
            return g.id;
          });

          var $readers = mkComposerInput('readers', fieldDescription, fieldValue, { groups: everyoneList.concat(restOfList)});
          $readers.find('.small_heading').prepend(requiredText);
          done($readers);
        }
      }, function(error) {
        done(undefined, error);
      });
    } else if (_.has(fieldDescription, 'values-dropdown')) {
      var values = fieldDescription['values-dropdown'];
      var extraGroupsP = $.Deferred().resolve([]);
      var regexIndex = _.findIndex(values, function(g) { return g.indexOf('.*') >=0; });
      if (regexIndex >= 0) {
        var regex = values[regexIndex];
        extraGroupsP = Webfield.get('/groups', { regex: regex })
        .then(function(result) {
          if (result.groups && result.groups.length) {
            var groups = result.groups.map(function(g) { return g.id; });
            fieldDescription['values-dropdown'] = values.slice(0, regexIndex).concat(groups, values.slice(regexIndex + 1));
          } else {
            fieldDescription['values-dropdown'].splice(regexIndex, 1);
          }
          return result.groups;
        });
      }
      extraGroupsP
        .then(function(groups) {
          setParentReaders(replyto, fieldDescription, 'values-dropdown', function (newFieldDescription) {
            //when replying to a note with different invitation, parent readers may not be in reply's invitation's readers
            var replyValues = _.intersection(newFieldDescription['values-dropdown'], fieldDescription['values-dropdown']);

            //Make sure AnonReviewers are in the dropdown options where '/Reviewers' is in the parent note
            var hasReviewers = _.find(replyValues, function(v) { return v.endsWith('/Reviewers'); });
            var hasAnonReviewers = _.find(replyValues, function(v) { return v.includes('/AnonReviewer') || v.includes('/Reviewer_');  });
            if (hasReviewers && !hasAnonReviewers) {
              fieldDescription['values-dropdown'].forEach(function(value) {
                if (value.includes('AnonReviewer') || value.includes('Reviewer_')) {
                  replyValues.push(value);
                }
              });
            }

            newFieldDescription['values-dropdown'] = replyValues;
            if (_.difference(newFieldDescription.default, newFieldDescription['values-dropdown']).length !== 0) { //invitation default is not in list of possible values
              done(undefined, 'Default reader is not in the list of readers');
            }
            var $readers = mkComposerInput('readers', newFieldDescription, fieldValue);
            $readers.find('.small_heading').prepend(requiredText);
            done($readers);
          });
        });

    } else if (_.has(fieldDescription, 'values')) {
      setParentReaders(replyto, fieldDescription, 'values', function(newFieldDescription) {
        if (_.isEqual(newFieldDescription.value.values, fieldDescription.values)
          || fieldDescription.values.every(function (val) { return newFieldDescription.value.values.indexOf(val) !== -1; })) {
          var $readers = mkComposerInput('readers', newFieldDescription, fieldValue); //for values, readers must match with invitation instead of parent invitation
          $readers.find('.small_heading').prepend(requiredText);
          done($readers);
        } else {
          done(undefined, 'Can not create note, readers must match parent note');
        }
      });
    } else if (_.has(fieldDescription, 'values-checkbox')) {
      var initialValues = fieldDescription['values-checkbox'];
      var promise = $.Deferred().resolve();
      var index = _.findIndex(initialValues, function(g) { return g.indexOf('.*') >=0; });
      if (index >= 0) {
        var regexGroup = initialValues[index];
        promise = Webfield.get('/groups', { regex: regexGroup })
        .then(function(result) {
          if (result.groups && result.groups.length) {
            var groups = result.groups.map(function(g) { return g.id; });
            fieldDescription['values-checkbox'] = initialValues.slice(0, index).concat(groups, initialValues.slice(index + 1));
          } else {
            fieldDescription['values-checkbox'].splice(index, 1);
          }
        });
      }
      promise
        .then(function() {
          setParentReaders(replyto, fieldDescription, 'values-checkbox', function (newFieldDescription) {
            //when replying to a note with different invitation, parent readers may not be in reply's invitation's readers
            var replyValues = _.intersection(newFieldDescription.value['values-checkbox'], fieldDescription['values-checkbox']);

            //Make sure AnonReviewers are in the dropdown options where '/Reviewers' is in the parent note
            var hasReviewers = _.find(replyValues, function(v) { return v.endsWith('/Reviewers'); });
            var hasAnonReviewers = _.find(replyValues, function(v) { return v.includes('/AnonReviewer') || v.includes('/Reviewer_'); });
            if (hasReviewers && !hasAnonReviewers) {
              fieldDescription['values-checkbox'].forEach(function(value) {
                if (value.includes('AnonReviewer') || v.includes('/Reviewer_')) {
                  replyValues.push(value);
                }
              });
            }

            newFieldDescription.value['values-checkbox'] = replyValues;
            if (_.difference(newFieldDescription.presentation?.default, newFieldDescription.value['values-checkbox']).length !== 0) { //invitation default is not in list of possible values
              done(undefined, 'Default reader is not in the list of readers');
            }
            var $readers = mkComposerInput('readers', newFieldDescription, fieldValue.length ? fieldValue : newFieldDescription.presentation?.default, { prettyId: true});
            $readers.find('.small_heading').prepend(requiredText);
            done($readers);
          });
        });
    } else {
      var $readers = mkComposerInput('readers', { value: fieldDescription }, fieldValue);
      $readers.find('.small_heading').prepend(requiredText);
      done($readers);
    }
  }

  const mkNoteEditor = (note, invitation, user, options) => {
    const params = {
      onNoteCreated: null,
      onCompleted: null,
      onNoteCancelled: null,
      onValidate: null,
      onError: null,
      isEdit: false,
      ...options ?? {}
    }
    if ($('.note_editor.panel').length) {
      promptError('You currently have another editor pane open on this page. ' +
        'Please submit your changes or click Cancel before continuing', { scrollToTop: false });
      if (params.onCompleted) {
        params.onCompleted(null);
      }
      return false;
    }

    // the order here should be from invitation, not note.details
    // presentation info may be different
    const contentOrder = order(invitation.edit?.note?.content, invitation.id)

    const $contentMap = _.reduce(contentOrder, (map, fieldName) => {
      const fieldContent = _.get(note, ['content', fieldName, 'value'], '');
      map[fieldName] = mkComposerInput(fieldName, invitation.edit.note.content[fieldName], fieldContent, { note: note, useDefaults: true });
      return map;
    }, {});

    function buildEditor(readers, signatures) {
      var $submitButton = $('<button class="btn btn-sm">Submit</button>');
      var $cancelButton = $('<button class="btn btn-sm">Cancel</button>');

      $submitButton.click(function() {
        if ($submitButton.prop('disabled')) {
          return false;
        }

        $submitButton.prop('disabled', true).append([
          '<div class="spinner-small">',
            '<div class="rect1"></div><div class="rect2"></div>',
            '<div class="rect3"></div><div class="rect4"></div>',
          '</div>'
        ].join('\n'));
        $cancelButton.prop('disabled', true);

        var content = view.getContent(invitation, $contentMap);
        console.log(content)

        // var signatureInputValues = view.idsFromListAdder(signatures, invitation.edit.signatures);
        // var readerValues = view.getReaders(readers, invitation, signatureInputValues);
        // var nonreaderValues = null;
        // if (_.has(invitation, 'edit.nonreaders.values')) {
        //   nonreaderValues = invitation.edit.nonreaders.values;
        // }
        // var writerValues = view.getWriters(invitation, signatureInputValues, user);

        var errorList = content[2].concat(validate(invitation, content[0], readers));
        if (params.onValidate) {
          errorList = errorList.concat(params.onValidate(invitation, content[0], note));
        }

        var files = content[1];

        if (!_.isEmpty(errorList)) {
          if (params.onError) {
            params.onError(errorList);
          } else {
            promptError(errorList[0]);
          }
          $submitButton.prop({ disabled: false }).find('.spinner-small').remove();
          $cancelButton.prop({ disabled: false });
          return;
        }

        var editNote={
          note: {
            content: content[0]
          }
        }
        if (_.isEmpty(files)) {
          return saveNote(editNote);
          return;
        }

        var onError = function(e) {
          var errorMsg;
          if (e.responseJSON && e.responseJSON.message) {
            errorMsg = e.responseJSON.message;
          } else if (e.readyState === 0) {
            errorMsg = 'There is an error with the network and the file could not be uploaded'
          } else {
            errorMsg = 'There was an error uploading the file';
          }

          if (params.onError) {
            params.onError([errorMsg]);
          } else if (e.responseJSON && e.responseJSON.errors) {
            promptError(e.responseJSON.errors[0]);
          } else {
            promptError(errorMsg);
          }
          $submitButton.prop({ disabled: false }).find('.spinner-small').remove();
          $cancelButton.prop({ disabled: false });
        };

        var fieldNames = _.keys(files);
        var promises = fieldNames.map(function(fieldName) {
          if (fieldName === 'pdf' && invitation.edit.note?.content?.pdf?.value?.['value-regex']) {
            return Webfield2.sendFile('/pdf', files[fieldName], 'application/pdf').then(function(result) {
              editNote.note.content[fieldName].value = result.url;
              return view.updatePdfSection($contentMap.pdf, invitation.edit.note?.content?.pdf?.value, editNote.note.content.pdf.value);
            });
          }
          var data = new FormData();
          data.append('invitationId', invitation.id);
          data.append('name', fieldName);
          data.append('file', files[fieldName]);
          return Webfield2.sendFile('/attachment', data).then(function(result) {
            editNote.note.content[fieldName].value = result.url;
            view.updateFileSection($contentMap[fieldName], fieldName, invitation.edit.note?.content?.[fieldName]?.value, editNote.note.content[fieldName].value);
          });
        });

        $.when.apply($, promises).then(function() {
          saveNote(editNote);
        }, onError);
      });

      $cancelButton.click(function() {
        if (params.onNoteCancelled) {
          params.onNoteCancelled();
        } else {
          $noteEditor.remove();
        }
      });

      var saveNote = function(note) {
        const editToPost = constructEdit({ noteObj: note, invitationObj: invitation });
        return note
        Webfield2.post('/notes/edits', editToPost, { handleError: false }).then(function() {
          if (params.onNoteEdited) {
            Webfield2.get('/notes', { id: note.id }).then(function (result) {
              params.onNoteEdited(result);
            })
          }
          $noteEditor.remove();
        }, function(error) {
          if (params.onError) {
            params.onError([error]);
          } else {
            promptError(error);
          }
          $submitButton.prop({ disabled: false }).find('.spinner-small').remove();
          $cancelButton.prop({ disabled: false });
        });
      };

      // For reference invitations show that a new reference is being created
      var editorAction = invitation.edit.note.id === note.id ? 'New' : 'Edit';
      var $noteEditor = $('<div>', { class: 'note_editor existing panel' }).append(
        '<h2 class="note_content_title">' + editorAction + ' ' + view.prettyInvitationId(invitation.id) + '</h2>',
        '<div class="required_field">* denotes a required field</div>',
        '<hr class="small">',
        _.values($contentMap),
        readers,
        signatures,
        $('<div>', { class: 'row' }).append($submitButton, $cancelButton)
      );
      $noteEditor.data('invitationId', invitation.id);

      view.autolinkFieldDescriptions($noteEditor);

      if (params.onCompleted) {
        params.onCompleted($noteEditor);
      }
    }

    const parentId = note.forum === note.replyto ? null : note.replyto;
    const handleError = (error) => {
      if (params.onError) {
        params.onError([error]);
      } else {
        promptError(error);
      }
    };
    buildReaders(invitation.edit.readers, note.readers, parentId, function(readers, error) {
      if (error) {
        return handleError(error);
      }
      view.buildSignatures(invitation.edit?.signatures, note.signatures, user).then(function(signatures) {
        buildEditor(readers, signatures);
      }).fail(function(error) {
        error = error === 'no_results' ?
          'You do not have permission to create a note' :
          error;
        handleError(error);
      });
    });
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

  const orderCache =  {};
  const order = (invitationEditNoteContent, invitationId) => {
    if (invitationId && orderCache[invitationId]) {
      return orderCache[invitationId];
    }

    var orderedFields = _.map(
      _.sortBy(
        _.map(invitationEditNoteContent, function(fieldProps, fieldName) {
          return {
            field: fieldName,
            order: fieldProps.order
          };
        }),
        ['order']
      ),
      'field'
    );
    if (invitationId) {
      orderCache[invitationId] = orderedFields;
    }
    return orderedFields;
  };

  const constructEdit = ({ noteObj, editObj, invitationObj }) => {
  }

  const validate = (invitation, content, readersWidget) => {
    const errorList = [];
    const invitationEditContent = invitation.edit?.note?.content;

    Object.keys(invitationEditContent).forEach(function(fieldName) {
      if (fieldName === 'pdf' && !invitationEditContent.pdf.value?.optional) {
        if (content.pdf?.value && !_.endsWith(content.pdf.value, '.pdf') && !_.startsWith(content.pdf.value, '/pdf') && !_.startsWith(content.pdf.value, 'http')) {
          errorList.push('Uploaded file must have .pdf extension');
        }

        if (!content.pdf && invitationEditContent.pdf?.value?.['value-regex']) {
          if (invitationEditContent.pdf?.value?.['value-regex'] === 'upload') {
            errorList.push('You must provide a PDF (file upload)');
          } else if (invitationEditContent.pdf?.value?.['value-regex'].includes('upload')) {
            errorList.push('You must provide a PDF (either by URL or file upload)');
          } else {
            errorList.push('You must provide a PDF (URL)');
          }
        }
      }

      if (!invitationEditContent[fieldName].value?.optional && _.isEmpty(content[fieldName])) {
        errorList.push('Field missing: ' + view.prettyField(fieldName));
      }

      // authors search has pending results to be added
      if (fieldName === 'authorids' && $('div.search-results>div.author-row').length) {
        errorList.push('You have additional authors to be added to authors list');
      }
    });

    if (invitation.edit?.note?.readers?.hasOwnProperty('values-dropdown')) {
      var inputValues = view.idsFromListAdder(readersWidget, invitation.edit.note.readers);
      if (!inputValues.length) {
        errorList.push('Readers can not be empty. You must select at least one reader');
      }
    }

    if (invitation.edit?.note?.readers?.hasOwnProperty('values-checkbox')) {
      var inputValues = [];
      readersWidget.find('.note_content_value input[type="checkbox"]').each(function(i) {
        if ($(this).prop('checked')) {
          inputValues.push($(this).val());
        }
      });
      if (!inputValues.length) {
        errorList.push('Readers can not be empty. You must select at least one reader');
      }
    }

    return errorList;
  };

  return {
    // mkNewNoteEditor: mkNewNoteEditor,
    mkNoteEditor: mkNoteEditor,
    mkNotePanel: mkNotePanel,
    // deleteOrRestoreNote: deleteOrRestoreNote,
    setupMarked: setupMarked
  };

}());
