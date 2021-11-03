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
    $contentInput.on('input', function() {
      var $warning = $(this).closest('.row').find('.content-warning');
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
      var re = new RegExp('^' + regexStr.replace(/\{\d+,\d+\}\$$/, '') + '$');
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
          var lenMatches = _.get(fieldDescription.value, 'value-regex', '').match(/\{(\d+),(\d+)\}\$$/);
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
      $input.addClass('autosave-enabled');
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
        $input.addClass('autosave-enabled');
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
    if (_.trim(note.content?.title?.value)) {
      return note.content.title.value;
    }
    if (_.trim(note.content?.verdict?.value)) {
      return 'Verdict: ' + note.content.verdict.value;
    }
    return generatedTitleText;
  };

  var mkPdfIcon = function(note, isEdit) {
    // PDF for title
    var $pdfLink = null;
    if (note.content?.pdf?.value) {
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
    if (note.content?.html?.value) {
      $htmlLink = $('<a>', {
        class: 'note_content_pdf html-link',
        href: note.content.html.value,
        title: 'Open Website',
        target: '_blank'
      }).append(
        '<img src="/images/html_icon_blue.svg">'
      );
    }
    return $htmlLink;
  };

  var prettyProfileLink = function (id, text, source) {
    if (!id) return text;
    if (id.indexOf('~') === 0) {
      return `<a href="/profile?id=${encodeURIComponent(id)}" class="profile-link" data-toggle="tooltip" data-placement="bottom" title="${id}">${text}</a>`
    }
    if (source === 'signature') return text
    if(id.indexOf('@') !== -1) {
      return `<a href="/profile?email=${encodeURIComponent(id)}" class="profile-link" data-toggle="tooltip" data-placement="bottom" title="${id}">${text}</a>`
    }
    if(id.indexOf('http') === 0) {
      return `<a href="${id}" class="profile-link" data-toggle="tooltip" data-placement="bottom" title="${id}">${text}</a>`
    }
    return text
  }

  var getAuthorText = function(note) {
    var notePastDue = note.ddate && note.ddate < Date.now();
    var authorText;
    if (notePastDue) {
      // Note trashed
      authorText = '[Deleted]';

    } else if (_.isArray(note.content?.authors?.value) && note.content.authors.value.length) {
      // Probably a forum-level note (because it has authors)
      if (_.isArray(note.content?.authorids?.value) && note.content.authorids.value.length) {
        authorText = note.content.authors.value?.map(function(a, i) {
          var aId = note.content.authorids.value[i];
          return prettyProfileLink(aId, a, 'authorids')
        }).join(', ');
      } else {
        authorText = note.content.authors.value?.join(', ');
      }
      var showPrivateLabel = note.content?.authorids?.readers && !_.isEqual(note.readers?.sort(), note.content.authorids.readers?.sort())
      if (showPrivateLabel){
        var tooltip = `privately revealed to ${note.content?.authorids?.readers?.map(p =>view.prettyId(p)).join(', ')}`
        privateLabel = `<span class="private-contents-icon glyphicon glyphicon-eye-open" title="${tooltip}" data-toggle="tooltip" data-placement="bottom"/>`
        authorText = `${authorText} ${privateLabel}`
      }
    } else {
      // Note with no authors, just signatures, such as a forum comment
      authorText = note.signatures.map(function(signature) {
        var signatureGroup = note.details?.signatures?.find(p => p.id === signature)
        var signatureLink = prettyProfileLink(signature,view.prettyId(signature), 'signatures');
        if (signatureGroup && !signatureGroup.readers?.includes('everyone')) {
          var tooltip = `Privately revealed to ${signatureGroup.readers?.map(p => view.prettyId(p)).join(', ')}`
          privateLabel = `<span class="private-contents-icon glyphicon glyphicon-eye-open" title="${tooltip}" data-toggle="tooltip" data-placement="bottom"/>`
          return `${signatureLink} ${privateLabel} ${signatureGroup.members.map(q=>prettyProfileLink(q,view.prettyId(q))).join(', ')}`
        }
        return signatureLink;
      }).join(', ');
    }
    return authorText;
  };

   const buildContent = (note, params, additionalOmittedFields) => {
    if (!params.withContent || (note.ddate && note.ddate < Date.now())) {
      return;
    }

    var contentKeys = Object.keys(note.content ?? {});
    const contentOrder = note.details?.presentation
      ? Object.values(note.details?.presentation ?? {}).sort((a, b) => a?.order - b?.order).map(p => p.name)
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
        privateLabel = `<span class="private-contents-icon glyphicon glyphicon-eye-open" title="${tooltip}" data-toggle="tooltip" data-placement="bottom"/>`
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
      if (note.details?.presentation?.find(p=>p.name === fieldName)?.markdown) {
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
      deleteInvitation: null,
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

    if (note.content?._disableTexRendering?.value) {
      $note.addClass('disable-tex-rendering');
    }

    var generatedTitleText = view.generateNoteTitle(note.invitations[0], note.signatures);
    var titleText = getTitleText(note, generatedTitleText);
    var useGeneratedTitle = !_.trim(note.content?.title?.value) && !_.trim(note.content?.verdict?.value);
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
    if ($('#content').hasClass('legacy-forum') || $('#content').hasClass('tasks') || $('#content').hasClass('revisions')) {
      if (canEdit && params.onTrashedOrRestored && params.deleteInvitation) {
        var buttonContent = notePastDue ? 'Restore' : '<span class="glyphicon glyphicon-trash" aria-hidden="true"></span>';
        $trashButton = $('<div>', { class: 'meta_actions' }).append(
          $('<button id="trashbutton_' + note.id + '" class="btn btn-xs trash_button">' + buttonContent + '</button>')
        );
        $trashButton.click(function() {
          deleteOrRestoreNote(note, params.deleteInvitation, titleText, params.user, params.onTrashedOrRestored);
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

    var $revisionsLink = (params.withRevisionsLink && details.revisions) ?
      $('<a>', { class: 'note_content_pdf item', href: '/revisions?id=' + note.id, text: 'Show Revisions' }) :
      null;

    // Display modal showing full BibTeX reference. Click handler is definied in public/index.js
    var $bibtexLink = (note.content?._bibtex?.value && params.withBibtexLink) ?
      $('<span class="item"><a href="#" data-target="#bibtex-modal" data-toggle="modal" data-bibtex="' + encodeURIComponent(note.content._bibtex.value) + '">Show Bibtex</a></span>') :
      null;

    var $metaEditRow = $('<div>', {class: 'meta_row'});
    var formattedDate = view.forumDate(note.cdate, note.tcdate, note.mdate, note.tmdate, note.content?.year?.value);
    var $dateItem = (!notePastDue || details.writable) ?
      $('<span>', {class: 'date item'}).text(formattedDate) :
      null;
    var $invItem = $('<span>', {class: 'item'}).text(options.isEdit ? view.prettyId(note.invitations[0]) : note.content?.venue?.value || view.prettyId(note.invitations[0]));
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

    if (canEdit && params.editInvitations?.length && !notePastDue) {
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
    return _.startsWith(note.content.pdf?.value, '/pdf') ? (path + '?id=' + note.id) : note.content?.pdf?.value;
  };

  const deleteOrRestoreNote = async (note, invitation, noteTitle, user, onTrashedOrRestored) => {
    const isDeleted = note.ddate && note.ddate < Date.now();
    var postUpdatedNote = function ($editSignatures, $editReaders) {
      const ddate = isDeleted ? null : Date.now();
      let editSignatureInputValues = view.idsFromListAdder($editSignatures, invitation.edit.signatures);
      const editReaderValues = view.getReaders($editReaders, invitation, editSignatureInputValues);
      if (!editSignatureInputValues || !editSignatureInputValues.length) {
        editSignatureInputValues = [user.profile.id];
      }
      const editToPost = constructEdit({ formData: { editSignatureInputValues,editReaderValues }, noteObj: { ...note, ddate }, invitationObj: invitation })
      Webfield2.post('/notes/edits', editToPost, null).then(function () {
        // the return of the post is edit without updatednote
        // so get the updated note again
        Webfield2.get('/notes', { id: note.id, trash: isDeleted ? false : true }).then(function (result) {
          onTrashedOrRestored({ ...result.notes[0], details: note.details });
        });
      });
    };

    const $editSignatures = await view.buildSignatures(invitation.edit.signatures, null, user, 'signature');
    const $editReaders = await buildEditReaders(invitation.edit.readers, null);

    // If there's only 1 signature available don't show the modal
    if (!$editSignatures.find('div.dropdown').length) {
      postUpdatedNote($editSignatures);
      return;
    }

    showConfirmDeleteModal(note, noteTitle, $editSignatures, $editReaders);

    $('#confirm-delete-modal .modal-footer .btn-primary').on('click', function () {
      postUpdatedNote($editSignatures);
      $('#confirm-delete-modal').modal('hide');
    });
  };

  const showConfirmDeleteModal = (note, noteTitle, $editSignaturesDropdown, $editReaders) => {
    $('#confirm-delete-modal').remove();

    $('#content').append(Handlebars.templates.genericModal({
      id: 'confirm-delete-modal',
      showHeader: true,
      title: 'Delete Note',
      body: '<p class="mb-4">Are you sure you want to delete "' +
        noteTitle + '" by ' + view.prettyId(note.signatures[0]) + '? The deleted note will ' +
        'be updated with the signature you choose below.</p>',
      showFooter: true,
      primaryButtonText: 'Delete'
    }));

    $editReaders.addClass('note_editor ml-0 mr-0 mb-2');
    $editSignaturesDropdown.addClass('note_editor ml-0 mr-0 mb-2');
    $('#confirm-delete-modal .modal-body').append($editReaders, $editSignaturesDropdown);

    $('#confirm-delete-modal').modal('show');
  };

  const mkNewNoteEditor = async (invitation, forum, replyto, user, options) => {
    var params = _.assign({
      onNoteCreated: null,
      onCompleted: null,
      onNoteCancelled: null,
      onValidate: null,
      onError: null
    }, options);

    if ($('.note_editor.panel').length) {
      promptError('You currently have another editor pane open on this page. ' +
        'Please submit your changes or click Cancel before continuing', { scrollToTop: false });
      if (params.onCompleted) {
        params.onCompleted(null);
      }
      return;
    }

    var contentOrder = order(invitation.edit?.note?.content, invitation.id);
    var $contentMap = _.reduce(contentOrder, function(ret, k) {
      ret[k] = mkComposerInput(k, invitation.edit?.note?.content?.[k], invitation.edit?.note?.content?.[k]?.presentation?.default || '', { useDefaults: true, user: user});
      return ret;
    }, {});

    function buildEditor(editReaders, editSignatures, noteReaders, noteSignatures) {
      var $submitButton = $('<button class="btn btn-sm">Submit</button>');
      var $cancelButton = $('<button class="btn btn-sm">Cancel</button>');

      $submitButton.click(function() {
        if ($submitButton.prop('disabled')) {
          return false;
        }

        $submitButton.prop({ disabled: true }).append([
          '<div class="spinner-small">',
            '<div class="rect1"></div><div class="rect2"></div>',
            '<div class="rect3"></div><div class="rect4"></div>',
          '</div>'
        ].join('\n'));
        $cancelButton.prop({ disabled: true });

        var content = view.getContent(invitation, $contentMap);
        const useEditSignature = invitation.edit.note?.signatures?.values=='${signatures}' // when note signature is edit signature, note reader should use edit signatures
        const editSignatureInputValues = view.idsFromListAdder(editSignatures, invitation.edit.signatures);
        const noteSignatureInputValues = view.idsFromListAdder(noteSignatures, invitation.edit?.note?.signatures);
        const editReaderValues = view.getReaders(editReaders, invitation, editSignatureInputValues);
        const noteReaderValues = view.getReaders(noteReaders, invitation, useEditSignature ? editSignatureInputValues : noteSignatureInputValues, false);
        const editWriterValues = view.getWriters(invitation, editSignatureInputValues, user);
        content[0].editSignatureInputValues = editSignatureInputValues;
        content[0].noteSignatureInputValues = noteSignatureInputValues;
        content[0].editReaderValues = editReaderValues;
        content[0].noteReaderValues = noteReaderValues;
        content[0].editWriterValues = editWriterValues;
        content[0].replyto = replyto;

        var errorList = content[2].concat(validate(invitation, content[0], noteReaders));
        if (params.onValidate) {
          errorList = errorList.concat(params.onValidate(invitation, content[0]));
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

        if (_.isEmpty(files)) {
          return saveNote(content[0], invitation);
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
              content[0][fieldName] = result.url;
              return view.updatePdfSection($contentMap.pdf, invitation.edit.note?.content?.pdf?.value, content[0][fieldName]);
            });
          }
          var data = new FormData();
          data.append('invitationId', invitation.id);
          data.append('name', fieldName);
          data.append('file', files[fieldName]);
          return Webfield2.sendFile('/attachment', data).then(function(result) {
            content[0][fieldName] = result.url;
            view.updateFileSection($contentMap[fieldName], fieldName, invitation.edit.note?.content?.[fieldName]?.value, content[0][fieldName]);
          });
        });

        $.when.apply($, promises).then(function() {
          saveNote(content[0], invitation);
        }, onError);
      });

      $cancelButton.click(function() {
        const confirmCancel = $noteEditor.data('hasUnsavedData') && !window.confirm('Any unsaved changes will be lost. Are you sure you want to continue?');
        if (confirmCancel) return;

        view.clearAutosaveData(autosaveStorageKeys);
        if (params.onNoteCancelled) {
          params.onNoteCancelled();
        } else {
          $noteEditor.remove();
        }
      });

      var saveNote = function(formContent, invitation) {
        const editToPost = constructEdit({ formData: formContent, invitationObj: invitation });
        Webfield2.post('/notes/edits', editToPost, { handleError: false }).then(function(result) {
          if (params.onNoteCreated) {
            params.onNoteCreated(result);
          }
          $noteEditor.remove();
          view.clearAutosaveData(autosaveStorageKeys);
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

      var $noteEditor = $('<div>', { class: 'note_editor panel' }).append(
        '<h2 class="note_content_title">New ' + view.prettyInvitationId(invitation.id) + '</h2>',
        '<div class="required_field">* denotes a required field</div>',
        '<hr class="small">',
        _.values($contentMap),
        noteReaders,
        noteSignatures,
        $('<div class="note_content_section">').append(
          '<h2 class="note_content_section">Edit History</h2>',
          '<hr class="small">',
          editReaders,
          editSignatures,
        ),
        $('<div>', { class: 'row' }).append($submitButton, $cancelButton)
      );
      $noteEditor.data('invitationId', invitation.id);

      view.autolinkFieldDescriptions($noteEditor);
      var autosaveStorageKeys = view.setupAutosaveHandlers($noteEditor, user, replyto + '|new', invitation.id);

      if (params.onCompleted) {
        params.onCompleted($noteEditor);
      }
    }

    try {
      const editReaders = await buildEditReaders(invitation.edit?.readers, null);
      const editSignatures = await view.buildSignatures(invitation.edit?.signatures, null, user, 'signatures');

      const parentId = forum === replyto ? null : replyto;
      let noteReaders = null;
      await buildNoteReaders(invitation.edit.note.readers, [], parentId, (result, error) => {
        if (error){
          if (params.onError) {
            params.onError([error]);
          } else {
            promptError(error);
          }
        }
        noteReaders = result;
      });
      const noteSignatures = await view.buildSignatures(invitation.edit?.note?.signatures, null, user, 'signatures')
      buildEditor(editReaders, editSignatures, noteReaders, noteSignatures);
    } catch (error) {
      console.error(error);
      if (params.onError) {
        params.onError([error]);
      } else {
        promptError(error);
      }
    }

  };


  function buildEditReaders(fieldDescription) {
    if (!fieldDescription) {
      // done(undefined, 'Invitation is missing readers');
      return null; // not essentially an error
    }

    var requiredText = fieldDescription.optional ? null : $('<span>', { text: '*', class: 'required_field' });

    if (_.has(fieldDescription, 'values-regex')) {
      return Webfield.get('/groups', { regex: fieldDescription['values-regex'] }, { handleErrors: false })
        .then(function (result) {
          if (_.isEmpty(result.groups)) {
            promptError('You do not have permission to create a note');
          } else {
            var everyoneList = _.filter(result.groups, function (g) {
              return g.id === 'everyone';
            });
            var restOfList = _.sortBy(_.filter(result.groups, function (g) {
              return g.id !== 'everyone';
            }), function (g) {
              return g.id;
            });

            var $readers = mkComposerInput('readers', { value: fieldDescription }, [], { groups: everyoneList.concat(restOfList) });
            $readers.find('.small_heading').prepend(requiredText);
            return $readers;
          }
        }, function (jqXhr, textStatus) {
          var errorText = Webfield.getErrorFromJqXhr(jqXhr, textStatus);
          promptError(errorText);
        });
    } else if (_.has(fieldDescription, 'values-dropdown')) {
      var values = fieldDescription['values-dropdown'];
      var extraGroupsP = $.Deferred().resolve([]);
      var regexIndex = _.findIndex(values, function (g) { return g.indexOf('.*') >= 0; });
      if (regexIndex >= 0) {
        var regex = values[regexIndex];
        extraGroupsP = Webfield.get('/groups', { regex: regex })
          .then(function (result) {
            if (result.groups && result.groups.length) {
              var groups = result.groups.map(function (g) { return g.id; });
              fieldDescription['values-dropdown'] = values.slice(0, regexIndex).concat(groups, values.slice(regexIndex + 1));
            } else {
              fieldDescription['values-dropdown'].splice(regexIndex, 1);
            }
            return result.groups;
          });
      }
      return extraGroupsP
        .then(function () {
          var $readers = mkComposerInput('readers', { value: fieldDescription }, []);
          $readers.find('.small_heading').prepend(requiredText);
          return $readers;
        });

    } else if (_.has(fieldDescription, 'value-dropdown-hierarchy')) {
      var $readers = mkComposerInput('readers', { value: fieldDescription }, []);
      $readers.find('.small_heading').prepend(requiredText);
      return $readers;
    // } else if (_.has(fieldDescription, 'values')) {
    //   return null;
    } else if (_.has(fieldDescription, 'values-checkbox')) {
      var initialValues = fieldDescription['values-checkbox'];
      var promise = $.Deferred().resolve();
      var index = _.findIndex(initialValues, function (g) { return g.indexOf('.*') >= 0; });
      if (index >= 0) {
        var regexGroup = initialValues[index];
        promise = Webfield.get('/groups', { regex: regexGroup })
          .then(function (result) {
            if (result.groups && result.groups.length) {
              var groups = result.groups.map(function (g) { return g.id; });
              fieldDescription['values-checkbox'] = initialValues.slice(0, index).concat(groups, initialValues.slice(index + 1));
            } else {
              fieldDescription['values-checkbox'].splice(index, 1);
            }
          });
      }
      return promise
        .then(function () {
          var $readers = mkComposerInput('readers', { value: fieldDescription }, fieldDescription.default, { prettyId: true });
          $readers.find('.small_heading').prepend(requiredText);
          return $readers;
        });
    } else {
      var $readers = mkComposerInput('readers', { value: fieldDescription }, []);
      $readers.find('.small_heading').prepend(requiredText);
      return $readers;
    }
  }

  const buildNoteReaders = async (fieldDescription, fieldValue, replyto, done) => {
    if (!fieldDescription) {
      // done(undefined, 'Invitation is missing readers');
      done(null); // not essentially an error
      return;
    }

    var requiredText = fieldDescription.optional ? null : $('<span>', { text: '*', class: 'required_field' });
    var setParentReaders = function(parent, fieldDescription, fieldType, done) {
      if (parent) {
       return Webfield2.get('/notes', { id: parent }).then(function (result) {
          var newFieldDescription = fieldDescription;
          if (result.notes.length > 0) {
            var parentReaders = result.notes[0].readers;
            if (!_.includes(parentReaders, 'everyone')) {
              newFieldDescription = {
                description: fieldDescription.description,
                default: fieldDescription.default
              };
              newFieldDescription[fieldType] = parentReaders;
              if (!fieldValue.length) {
                fieldValue = newFieldDescription[fieldType];
              }
            }
          }
          done(newFieldDescription);
        });
      } else {
        done(fieldDescription);
      }
    };

    if (_.has(fieldDescription, 'values-regex')) {
      return Webfield2.get('/groups', { regex: fieldDescription['values-regex'] }, { handleErrors: false })
      .then(function(result) {
        if (_.isEmpty(result.groups)) {
          done(undefined, 'You do not have permission to create a note');
        } else {
          var everyoneList = _.filter(result.groups, function(g) {
            return g.id === 'everyone';
          });
          var restOfList = _.sortBy(_.filter(result.groups, function(g) {
            return g.id !== 'everyone';
          }), function(g) {
            return g.id;
          });

          var $readers = mkComposerInput('readers', { value: fieldDescription }, fieldValue, { groups: everyoneList.concat(restOfList) });
          if (fieldDescription.optional) $readers.find('.small_heading').prepend(requiredText);
          done($readers);
        }
      }, function(jqXhr, textStatus) {
        var errorText = Webfield.getErrorFromJqXhr(jqXhr, textStatus);
        done(undefined, errorText);
      });
    } else if (_.has(fieldDescription, 'values-dropdown')) {
      var values = fieldDescription['values-dropdown'];
      var extraGroupsP = [];
      var regexIndex = _.findIndex(values, function(g) { return g.indexOf('.*') >=0; });
      if (regexIndex >= 0) {
        var regex = values[regexIndex];
        var result = await Webfield.get('/groups', { regex: regex })
        if (result.groups && result.groups.length) {
          var groups = result.groups.map(function(g) { return g.id; });
          fieldDescription['values-dropdown'] = values.slice(0, regexIndex).concat(groups, values.slice(regexIndex + 1));
        } else {
          fieldDescription['values-dropdown'].splice(regexIndex, 1);
        }
      }

      return setParentReaders(replyto, fieldDescription, 'values-dropdown', function (newFieldDescription) {
        // when replying to a note with different invitation, parent readers may not be in reply's invitation's readers
        var replyValues = _.intersection(newFieldDescription['values-dropdown'], fieldDescription['values-dropdown']);

        // Make sure AnonReviewers are in the dropdown options where '/Reviewers' is in the parent note
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
        var $readers = mkComposerInput('readers', { value: newFieldDescription }, fieldValue);
        $readers.find('.small_heading').prepend(requiredText);
        done($readers);
      });

    } else if (_.has(fieldDescription, 'value-dropdown-hierarchy')) {
      return setParentReaders(replyto, fieldDescription, 'value-dropdown-hierarchy', function(newFieldDescription) {
        var $readers = mkComposerInput('readers', { value: newFieldDescription }, fieldValue);
        $readers.find('.small_heading').prepend(requiredText);
        done($readers);
      });
    } else if (_.has(fieldDescription, 'values')) {
      return setParentReaders(replyto, fieldDescription, 'values', function(newFieldDescription) {
        var subsetReaders = fieldDescription.values.every(function (val) {
          var found = newFieldDescription.values.indexOf(val) !== -1;
          if (!found && val.includes('/Reviewer_')) {
            var hasReviewers = _.find(newFieldDescription.values, function(v) { return v.includes('/Reviewers')});
            return hasReviewers;
          }
          return found;
          })
        if (_.isEqual(newFieldDescription.values, fieldDescription.values) || subsetReaders) {
          var $readers = mkComposerInput('readers', { value: fieldDescription }, fieldValue); //for values, readers must match with invitation instead of parent invitation
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
        var result = await Webfield.get('/groups', { regex: regexGroup });
        if (result.groups && result.groups.length) {
          var groups = result.groups.map(function(g) { return g.id; });
          fieldDescription['values-checkbox'] = initialValues.slice(0, index).concat(groups, initialValues.slice(index + 1));
        } else {
          fieldDescription['values-checkbox'].splice(index, 1);
        }
      }
      return setParentReaders(replyto, fieldDescription, 'values-checkbox', function (newFieldDescription) {
        // when replying to a note with different invitation, parent readers may not be in reply's invitation's readers
        var replyValues = _.intersection(newFieldDescription['values-checkbox'], fieldDescription['values-checkbox']);

        // Make sure AnonReviewers are in the dropdown options where '/Reviewers' is in the parent note
        var hasReviewers = _.find(replyValues, function(v) { return v.endsWith('/Reviewers'); });
        var hasAnonReviewers = _.find(replyValues, function(v) { return v.includes('/AnonReviewer') || v.includes('/Reviewer_'); });
        if (hasReviewers && !hasAnonReviewers) {
          fieldDescription['values-checkbox'].forEach(function(value) {
            if (value.includes('AnonReviewer') || v.includes('/Reviewer_')) {
              replyValues.push(value);
            }
          });
        }

        newFieldDescription['values-checkbox'] = replyValues;
        if (_.difference(newFieldDescription.default, newFieldDescription['values-checkbox']).length !== 0) { //invitation default is not in list of possible values
          done(undefined, 'Default reader is not in the list of readers');
        }
        var $readers = mkComposerInput('readers', { value: fieldDescription }, fieldValue.length ? fieldValue : newFieldDescription.default, { prettyId: true});
        $readers.find('.small_heading').prepend(requiredText);
        done($readers);
      });
    } else {
      var $readers = mkComposerInput('readers', { value: fieldDescription }, fieldValue);
      $readers.find('.small_heading').prepend(requiredText);
      done($readers);
    }
  }

  const mkNoteEditor = async (note, invitation, user, options) => {
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

    const buildEditor = (editReaders, editSignatures, noteReaders, noteSignatures) => {
      const $submitButton = $('<button class="btn btn-sm">Submit</button>');
      const $cancelButton = $('<button class="btn btn-sm">Cancel</button>');

      $submitButton.click(() => {
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

        const content = view.getContent(invitation, $contentMap);
        const useEditSignature = invitation.edit.note?.signatures?.values=='${signatures}' // when note signature is edit signature, note reader should use edit signatures
        const editSignatureInputValues = view.idsFromListAdder(editSignatures, invitation.edit.signatures);
        const noteSignatureInputValues = view.idsFromListAdder(noteSignatures, invitation.edit?.note?.signatures);
        const editReaderValues = view.getReaders(editReaders, invitation, editSignatureInputValues);
        const noteReaderValues = view.getReaders(noteReaders, invitation, useEditSignature ? editSignatureInputValues : noteSignatureInputValues, false);
        const editWriterValues = view.getWriters(invitation, editSignatureInputValues, user);
        content[0].editSignatureInputValues = editSignatureInputValues;
        content[0].noteSignatureInputValues = noteSignatureInputValues;
        content[0].editReaderValues = editReaderValues;
        content[0].noteReaderValues = noteReaderValues;
        content[0].editWriterValues = editWriterValues;

        let errorList = content[2].concat(validate(invitation, content[0], noteReaders));
        if (params.onValidate) {
          errorList = errorList.concat(params.onValidate(invitation, content[0], note));
        }

        const files = content[1];

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

        if (_.isEmpty(files)) {
          return saveNote(content[0], note, invitation);
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
              content[0][fieldName] = result.url;
              return view.updatePdfSection($contentMap.pdf, invitation.edit.note?.content?.pdf?.value, content[0][fieldName]);
            });
          }
          var data = new FormData();
          data.append('invitationId', invitation.id);
          data.append('name', fieldName);
          data.append('file', files[fieldName]);
          return Webfield2.sendFile('/attachment', data).then(function(result) {
            content[0][fieldName] = result.url;
            view.updateFileSection($contentMap[fieldName], fieldName, invitation.edit.note?.content?.[fieldName]?.value, content[0][fieldName]);
          });
        });

        $.when.apply($, promises).then(function() {
          saveNote(content[0], note, invitation);
        }, onError);
      });

      $cancelButton.click(function() {
        const confirmCancel = $noteEditor.data('hasUnsavedData') && !window.confirm('Any unsaved changes will be lost. Are you sure you want to continue?');
        if (confirmCancel) return;

        if (params.onNoteCancelled) {
          params.onNoteCancelled();
        } else {
          $noteEditor.remove();
        }
        view.clearAutosaveData(autosaveStorageKeys);
      });

      var saveNote = function (formContent, existingNote, invitation) {
        const editToPost = constructEdit({ formData: formContent, noteObj: existingNote, invitationObj: invitation });
        Webfield2.post('/notes/edits', editToPost, { handleError: false }).then(function() {
          if (params.onNoteEdited) {
            Webfield2.get('/notes', { id: note.id }).then(function (result) {
              params.onNoteEdited(result);
            })
          }
          $noteEditor.remove();
          view.clearAutosaveData(autosaveStorageKeys);
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

      var $noteEditor = $('<div>', { class: 'note_editor existing panel' }).append(
        '<h2 class="note_content_title">Edit ' + view.prettyInvitationId(invitation.id) + '</h2>',
        '<div class="required_field">* denotes a required field</div>',
        '<hr class="small">',
        _.values($contentMap),
        noteReaders,
        noteSignatures,
        $('<div class="note_content_section">').append(
          '<h2>Edit History</h2>',
          '<hr class="small">',
          editReaders,
          editSignatures,
        ),
        $('<div>', { class: 'row' }).append($submitButton, $cancelButton)
      );
      $noteEditor.data('invitationId', invitation.id);

      view.autolinkFieldDescriptions($noteEditor);
      var autosaveStorageKeys = view.setupAutosaveHandlers($noteEditor, user, note.id, invitation.id);

      if (params.onCompleted) {
        params.onCompleted($noteEditor);
      }
    }

    try {
      const editReaders = await buildEditReaders(invitation.edit?.readers, null);
      const editSignatures = await view.buildSignatures(invitation.edit?.signatures, null, user, 'signatures');

      const parentId = note.forum === note.replyto ? null : note.replyto;
      let noteReaders = null;
      await buildNoteReaders(invitation.edit.note.readers, note.readers ?? [], parentId, (result, error) => {
        if (error){
          if (params.onError) {
            params.onError([error]);
          } else {
            promptError(error);
          }
        }
        noteReaders = result;
      });
      const noteSignatures = await view.buildSignatures(invitation.edit?.note?.signatures, null, user, 'signatures')
      buildEditor(editReaders, editSignatures, noteReaders, noteSignatures);
    } catch (error) {
      console.error(error);
      if (params.onError) {
        params.onError([error]);
      } else {
        promptError(error);
      }
    }
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

  const constructEdit = ({ formData, noteObj, invitationObj }) => {
    if (!invitationObj.edit) return undefined;
    const result = {}
    const note = {}
    const content = {}
    const { note: noteFields, ...otherFields } = invitationObj.edit
    // editToPost.readers/writers etc.
    Object.entries(otherFields).forEach(([field, value]) => {
      if (value.value || value.values) return
      switch (field) {
        case 'readers':
          result[field] = formData?.editReaderValues ?? noteObj?.[field]
          break;
        case 'writers':
          result[field] = formData?.editWriterValues ?? noteObj?.[field]
          break;
        case 'signatures':
          result[field] = formData?.editSignatureInputValues
          break;
        default:
          result[field] = formData?.[field] ?? noteObj?.[field] // readers/writers/signatures collected in editor default to note readers/writers/signatures
          break;
      }
    })
    const { content: contentFields, ...otherNoteFields } = noteFields
    // editToPost.note.id/ddate/reader/writers etc.
    Object.entries(otherNoteFields).forEach(([otherNoteField, value]) => {
      if (value.value || value.values) return
      switch (otherNoteField) {
        case 'readers':
          note[otherNoteField] = formData?.noteReaderValues
          break;
        case 'signatures':
          note[otherNoteField] = formData?.noteSignatureInputValues
          break;
        default:
          note[otherNoteField] = formData?.[otherNoteField] ?? noteObj?.[otherNoteField]
          break;
      }
    })
    // content fields
    Object.entries(contentFields).forEach(([contentFieldName, contentFieldValue]) => {
      if (valueObj = contentFieldValue.value) {
        if (valueObj.value || valueObj.values) {
          return
        } else {
          content[contentFieldName] = { value: formData?.[contentFieldName] ?? noteObj?.content?.[contentFieldName]?.value }
        }
      }
      if (fieldReader = contentFieldValue.readers) {
        if (fieldReader.value || fieldReader.values) {
          return
        } else {
          content[contentFieldName].readers = noteObj?.content?.[contentFieldName]?.readers
        }
      }
    })

    result.invitation = invitationObj.id
    if (Object.keys(content).length) note.content = content
    if (Object.keys(note).length) result.note = note
    return result
  }

  const validate = (invitation, formContent, readersWidget) => {
    const errorList = [];
    const invitationEditContent = invitation.edit?.note?.content;

    Object.keys(invitationEditContent).forEach(function(fieldName) {
      if (fieldName === 'pdf' && !invitationEditContent.pdf.value?.optional) {
        if (formContent.pdf && !_.endsWith(formContent.pdf, '.pdf') && !_.startsWith(formContent.pdf, '/pdf') && !_.startsWith(formContent.pdf, 'http')) {
          errorList.push('Uploaded file must have .pdf extension');
        }

        if (!formContent.pdf && invitationEditContent.pdf?.value?.['value-regex']) {
          if (invitationEditContent.pdf?.value?.['value-regex'] === 'upload') {
            errorList.push('You must provide a PDF (file upload)');
          } else if (invitationEditContent.pdf?.value?.['value-regex'].includes('upload')) {
            errorList.push('You must provide a PDF (either by URL or file upload)');
          } else {
            errorList.push('You must provide a PDF (URL)');
          }
        }
      }

      if (!invitationEditContent[fieldName].value?.optional && _.isEmpty(formContent[fieldName])) {
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
    mkNewNoteEditor: mkNewNoteEditor,
    mkNoteEditor: mkNoteEditor,
    mkNotePanel: mkNotePanel,
    // deleteOrRestoreNote: deleteOrRestoreNote,
  };

}());
