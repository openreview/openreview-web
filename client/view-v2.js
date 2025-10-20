/* globals $, _: false */
/* globals view, Webfield, Webfield2: false */
/* globals promptError, typesetMathJax: false */
/* globals marked, nanoid, DOMPurify, MathJax, Handlebars: false */

// eslint-disable-next-line wrap-iife
module.exports = (function () {
  const valueInput = (contentInput, fieldName, fieldDescription) => {
    const $smallHeading = $('<div>', {
      text: view.prettyField(fieldName),
      class: 'small_heading',
    })
    if (!fieldDescription.value.param?.optional) {
      $smallHeading.prepend('<span class="required_field">*</span>')
    }

    let $description
    if (fieldDescription.value.param?.scroll) {
      $description = $('<textarea class="form-control scroll-box" readonly>').text(
        fieldDescription.description
      )
    } else {
      $description = $('<div class="hint disable-tex-rendering">').text(
        fieldDescription.description
      )
    }

    const $row = $('<div>', { class: 'row' }).append($smallHeading, $description, contentInput)

    return $row
  }

  const markdownInput = ($contentInput, fieldName, fieldDescription) => {
    const $smallHeading = $('<div>', {
      text: view.prettyField(fieldName),
      class: 'small_heading',
    })
    if (!fieldDescription.value.param?.optional) {
      $smallHeading.prepend('<span class="required_field">*</span>')
    }

    let $description
    if (fieldDescription.value.param?.scroll) {
      $description = $('<textarea class="form-control scroll-box" readonly>').text(
        fieldDescription.description
      )
    } else {
      $description = $('<div class="hint disable-tex-rendering">').text(
        fieldDescription.description
      )
    }

    // Display a warning when "\\" is detected in a MathJax block ($...$ or $$ ... $$)
    // All double backslashes need to be escaped or Markdown will convert it to "\"
    $contentInput.on('input', function () {
      var $warning = $(this).closest('.row').find('.content-warning')
      if (
        $(this)
          .val()
          .match(/\$[\s\S]*\\\\[\s\S]*\$/)
      ) {
        if ($warning.length === 0) {
          $(this)
            .closest('.row')
            .find('.char-counter')
            .append(
              '<div class="pull-right content-warning danger">' +
                '<strong>IMPORTANT: All uses of "\\\\" in LaTeX formulas should be replaced with "\\\\\\\\"</strong>' +
                '<br><span>Learn more about adding LaTeX formulas to Markdown content here: ' +
                '<a href="https://docs.openreview.net/reference/openreview-tex/openreview-tex-support" target="_blank">FAQ</a></span>' +
                '</div>'
            )
        }
      } else {
        $warning.remove()
      }
    })

    const uniqueId = Math.floor(Math.random() * 1000)
    const $markDownWithPreviewTabs = $(
      '<ul class="nav nav-tabs markdown-preview-tabs" role="tablist">' +
        '<li class="active" role="presentation">' +
        '<a href="#markdown-panel-' +
        uniqueId +
        '" data-toggle="tab" role="tab">Write</a>' +
        '</li>' +
        '<li role="presentation">' +
        '<a id="markdown-preview-tab-' +
        uniqueId +
        '" href="#markdown-preview-panel-' +
        uniqueId +
        '" data-toggle="tab" role="tab">Preview</a>' +
        '</li>' +
        '</ul>' +
        '<div class="tab-content">' +
        '<div class="markdown-panel tab-pane fade in active" id="markdown-panel-' +
        uniqueId +
        '" role="tabpanel"></div>' +
        '<div class="markdown-preview-panel tab-pane fade " id="markdown-preview-panel-' +
        uniqueId +
        '" role="tabpanel"></div>' +
        '</div>'
    )
    $markDownWithPreviewTabs.find('#markdown-panel-' + uniqueId).append($contentInput)

    const $row = $('<div>', { class: 'row' }).append(
      $smallHeading,
      $description,
      $markDownWithPreviewTabs
    )

    $('#markdown-preview-tab-' + uniqueId, $row).on('shown.bs.tab', (e) => {
      const id = $(e.relatedTarget).attr('href')
      const newTabId = $(e.target).attr('href')
      const markdownContent = $(id).children().eq(0).val()
      if (markdownContent) {
        $(newTabId)[0].innerHTML =
          '<div class="note_content_value markdown-rendered">' +
          DOMPurify.sanitize(marked(markdownContent)) +
          '</div>'
        setTimeout(() => {
          MathJax.typesetPromise()
        }, 100)
      } else {
        $(newTabId).text('Nothing to preview')
      }
    })

    return $row
  }

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
    },
    order,
    description,
    disableAutosave, // remove
  }
  */

  const mkComposerContentInput = (fieldName, fieldDescription, valueInNote, params) => {
    let contentInputResult = null

    const mkCharCouterWidget = ($input, minChars, maxChars) => {
      const $widget = $('<div>', { class: 'char-counter hint' }).append(
        '<div class="pull-left" style="display:none;">Additional characters required: <span class="min-count">' +
          minChars +
          '</span></div>',
        '<div class="pull-left" style="display:none;">Characters remaining: <span class="max-count">' +
          maxChars +
          '</span></div>'
      )
      const $minCount = $widget.find('.min-count')
      const $maxCount = $widget.find('.max-count')
      const $divs = $widget.children()

      $input.on(
        'input',
        _.throttle(() => {
          // Remove extra white spaces at the beginning, at the end and in between words.
          const charsUsed = $input.val().trim().length
          const charsRequired = minChars - charsUsed
          const charsRemaining = maxChars - charsUsed
          $minCount.text(charsRequired)
          $maxCount.text(charsRemaining)

          $widget.removeClass('warning danger')
          if (charsRemaining < 1) {
            $widget.addClass('danger')
          } else if (charsRemaining < 150) {
            $widget.addClass('warning')
          }

          if (charsRequired > 0) {
            $divs.eq(0).show()
            $divs.eq(1).hide()
          } else {
            $divs.eq(0).hide()
            if (maxChars) {
              $divs.eq(1).show()
            } else {
              $divs.eq(1).hide()
            }
          }
        }, 100)
      )

      return $widget
    }

    const fieldDefault = params?.useDefaults
      ? _.get(fieldDescription.value?.param, 'default', '')
      : ''
    var fieldValue = valueInNote || fieldDefault // These will always be mutually exclusive
    var $input

    if (
      fieldDescription.value &&
      (!_.has(fieldDescription.value, 'param') || _.has(fieldDescription.value.param, 'const'))
    ) {
      var value = fieldDescription.value
      if (_.has(fieldDescription.value, 'param')) {
        value = fieldDescription.value.param.const
      }
      if (Array.isArray(value)) {
        // treat as values
        contentInputResult = view.mkDropdownAdder(
          fieldName,
          fieldDescription.description,
          value,
          fieldValue,
          {
            hoverText: true,
            refreshData: false,
            required: !fieldDescription.value.param?.optional,
          }
        )
      } else {
        // treat as value
        contentInputResult = valueInput(
          $('<input>', {
            type: 'text',
            class: 'form-control note_content_value',
            name: fieldName,
            value: value,
            readonly: true,
          }),
          fieldName,
          fieldDescription
        )
      }
    } else if (_.has(fieldDescription.value?.param, 'enum')) {
      if (fieldDescription.value.param.input === 'radio') {
        // value-radio
        $input = $('<div>', { class: 'note_content_value value-radio-container' }).append(
          _.map(fieldDescription.value.param.enum, function (v) {
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
            )
          })
        )
        contentInputResult = valueInput($input, fieldName, fieldDescription)
      } else if (fieldDescription.value.param.input === 'checkbox') {
        var options = fieldDescription.value.param.enum
        var checkedValues = _.isArray(fieldValue) ? fieldValue : [fieldValue]
        var requiredValues = fieldDescription.value.param.default

        var checkboxes = _.map(options, function (option) {
          var checked = _.includes(checkedValues, option) ? 'checked' : ''
          var disabled = _.includes(requiredValues, option) ? 'disabled' : ''
          return (
            '<label class="checkbox-inline">' +
            '<input type="checkbox" name="' +
            fieldName +
            '" value="' +
            option +
            '" ' +
            checked +
            ' ' +
            disabled +
            '> ' +
            (params.prettyId ? view.prettyId(option) : option) +
            '</label>'
          )
        })
        contentInputResult = valueInput(
          '<div class="note_content_value no-wrap">' + checkboxes.join('\n') + '</div>',
          fieldName,
          fieldDescription
        )
      } else if (
        fieldDescription.value.param.input === 'select' ||
        !_.has(fieldDescription.value.param, 'input')
      ) {
        if (
          !_.has(fieldDescription.value.param, 'type') ||
          fieldDescription.value.param.type.endsWith('[]')
        ) {
          // values-dropdown
          contentInputResult = view.mkDropdownAdder(
            fieldName,
            fieldDescription.description,
            fieldDescription.value.param.enum,
            fieldValue,
            {
              hoverText: false,
              refreshData: true,
              required: !fieldDescription.value.param.optional,
              alwaysHaveValues: fieldDescription.value.param.default,
            }
          )
        } else {
          // value-dropdown
          contentInputResult = view.mkDropdownList(
            fieldName,
            fieldDescription.description,
            fieldValue,
            fieldDescription.value.param.enum,
            !fieldDescription.value.param.optional
          )
        }
      }
    } else if (fieldDescription.value?.param.type === 'json') {
      contentInputResult = valueInput(
        $('<textarea>', {
          class: 'note_content_value form-control',
          name: fieldName,
          text: fieldValue && JSON.stringify(fieldValue, undefined, 4),
        }),
        fieldName,
        fieldDescription
      )
    } else if (fieldDescription.value?.param.type === 'file') {
      contentInputResult = mkAttachmentSection(fieldName, fieldDescription, fieldValue)
    } else if (
      _.has(fieldDescription.value?.param, 'regex') ||
      fieldDescription.value?.param.type === 'string'
    ) {
      if (
        !_.has(fieldDescription.value.param, 'type') ||
        fieldDescription.value.param.type.endsWith('[]')
      ) {
        // then treat as values-regex
        if (params && params.groups) {
          var groupIds = _.map(params.groups, function (g) {
            return g.id
          })
          contentInputResult = view.mkDropdownAdder(
            fieldName,
            fieldDescription.description,
            groupIds,
            fieldValue,
            {
              hoverText: false,
              refreshData: true,
              required: !fieldDescription.value.param.optional,
            }
          )
        } else {
          $input = $('<input>', {
            type: 'text',
            class: 'form-control note_content_value',
            name: fieldName,
            value: fieldValue,
          })
          $input.addClass('autosave-enabled')
          contentInputResult = valueInput($input, fieldName, fieldDescription)
        }
      } else {
        // then treat as value-regex
        var $inputGroup
        if (
          _.has(fieldDescription.value.param, 'input') &&
          fieldDescription.value.param.input === 'textarea'
        ) {
          $input = $('<textarea>', {
            class: 'note_content_value form-control',
            name: fieldName,
            text: fieldValue,
          })

          if (fieldDescription.value.param.markdown) {
            $inputGroup = markdownInput($input, fieldName, fieldDescription)
          } else {
            $inputGroup = valueInput($input, fieldName, fieldDescription)
          }

          var lenMatches = _.has(fieldDescription.value.param, 'maxLength')
          if (lenMatches) {
            var minLen = fieldDescription.value.param.minLength
            var maxLen = fieldDescription.value.param.maxLength
            minLen = isNaN(minLen) || minLen < 0 ? 0 : minLen
            maxLen = isNaN(maxLen) || maxLen < minLen ? 0 : maxLen
            if (minLen || maxLen) {
              $inputGroup.append(mkCharCouterWidget($input, minLen, maxLen))
              if (fieldValue) {
                $input.trigger('keyup')
              }
            }
          }
        } else {
          $input = $('<input>', {
            type: 'text',
            class: 'form-control note_content_value',
            name: fieldName,
            value: fieldValue,
          })
          // input will probably be omitted field when rendered
          $inputGroup = valueInput($input, fieldName, fieldDescription)
        }
        $input.addClass('autosave-enabled')
        contentInputResult = $inputGroup
      }
    }

    return contentInputResult
  }

  const mkComposerInput = (fieldName, fieldDescription, fieldValue, params) => {
    if (fieldDescription.readers && !fieldDescription.value) return null
    let contentInputResult

    if (fieldName === 'authorids' && params.profileWidget) {
      let authors
      let authorids
      if (params?.note) {
        authors = params.note.content.authors?.value
        authorids = params.note.content.authorids?.value
      } else if (params?.user) {
        const userProfile = params.user.profile
        authors = [userProfile.fullname]
        authorids = [userProfile.preferredId]
      }
      const invitationRegex = fieldDescription.value.param?.regex
      // Enable allowUserDefined if the values-regex has '~.*|'
      // Don't enable adding or removing authors if invitation uses 'values' instead of values-regex
      contentInputResult = valueInput(
        view.mkSearchProfile(authors, authorids, {
          allowUserDefined: invitationRegex && invitationRegex.includes('|'),
          allowAddRemove: !!invitationRegex,
        }),
        'authors',
        fieldDescription
      )
    } else {
      contentInputResult = mkComposerContentInput(
        fieldName,
        fieldDescription,
        fieldValue,
        params
      )
    }

    var isFieldHidden = fieldDescription.value?.param?.hidden === true
    var isProfileWidget = fieldName === 'authors' && params.profileWidget
    if (contentInputResult && (isFieldHidden || isProfileWidget)) {
      return contentInputResult.hide()
    }
    return contentInputResult
  }

  // Private helper function used by mkPdfSection and mkAttachmentSection
  const mkFileRow = ($widgets, fieldName, fieldDescription, fieldValue) => {
    const smallHeading = $('<div>', {
      text: view.prettyField(fieldName),
      class: 'small_heading',
    })
    if (!fieldDescription.value.param.optional) {
      const requiredText = $('<span>', { text: '*', class: 'required_field' })
      smallHeading.prepend(requiredText)
    }

    const $noteContentVal = $('<input>', {
      class: 'note_content_value',
      name: fieldName,
      value: fieldValue,
      style: 'display: none;',
    })

    const $fieldValue = fieldValue
      ? $('<span class="item hint existing-filename">(' + fieldValue + ')</span>')
      : null

    return $('<div>', { class: 'row' }).append(
      smallHeading,
      $('<div>', { text: fieldDescription.description, class: 'hint' }),
      $noteContentVal,
      $widgets,
      $fieldValue
    )
  }

  const mkAttachmentSection = (fieldName, fieldDescription, fieldValue) => {
    const order = fieldDescription.order
    const regexStr = null

    return mkFileRow(
      view.mkFileInput(fieldName, 'file', order, regexStr),
      fieldName,
      fieldDescription,
      fieldValue
    )
  }

  var updateFileSection = function ($fileSection, fieldName, fieldDescription, fieldValue) {
    $fileSection.empty()
    $fileSection.append(
      mkAttachmentSection(fieldName, fieldDescription, fieldValue).children()
    )
  }

  var getTitleText = function (note, generatedTitleText) {
    if (_.trim(note.content?.title?.value)) {
      return note.content.title.value
    }
    if (_.trim(note.content?.verdict?.value)) {
      return 'Verdict: ' + note.content.verdict.value
    }
    return generatedTitleText
  }

  var mkPdfIcon = function (note, isEdit) {
    // PDF for title
    var $pdfLink = null
    if (note.content?.pdf?.value) {
      var downloadURL = pdfUrl(note, isEdit)
      $pdfLink = $('<a>', {
        class: 'note_content_pdf',
        href: downloadURL,
        title: 'Download PDF',
        target: '_blank',
      }).append('<img src="/images/pdf_icon_blue.svg">')
    }
    return $pdfLink
  }

  var mkHtmlIcon = function (note) {
    var $htmlLink = null
    if (note.content?.html?.value) {
      $htmlLink = $('<a>', {
        class: 'note_content_pdf html-link',
        href: note.content.html.value,
        title: 'Open Website',
        target: '_blank',
      }).append('<img src="/images/html_icon_blue.svg">')
    }
    return $htmlLink
  }

  var prettyProfileLink = function (id, text, source) {
    if (!id) return text
    if (id.indexOf('~') === 0) {
      return `<a href="/profile?id=${encodeURIComponent(
        id
      )}" class="profile-link" data-toggle="tooltip" data-placement="bottom" title="${id}">${text}</a>`
    }
    if (source === 'signature') return text
    if (id.indexOf('@') !== -1) {
      return `<a href="/profile?email=${encodeURIComponent(
        id
      )}" class="profile-link" data-toggle="tooltip" data-placement="bottom" title="${id}">${text}</a>`
    }
    if (id.indexOf('http') === 0) {
      return `<a href="${id}" class="profile-link" data-toggle="tooltip" data-placement="bottom" title="${id}">${text}</a>`
    }
    return text
  }

  var getAuthorText = function (note) {
    var notePastDue = note.ddate && note.ddate < Date.now()
    var authorText
    if (notePastDue) {
      // Note trashed
      authorText = '[Deleted]'
    } else if (_.isArray(note.content?.authors?.value) && note.content.authors.value.length) {
      // Probably a forum-level note (because it has authors)
      if (_.isArray(note.content?.authorids?.value) && note.content.authorids.value.length) {
        authorText = note.content.authors.value
          ?.map(function (a, i) {
            var aId = note.content.authorids.value[i]
            return prettyProfileLink(aId, a, 'authorids')
          })
          .join(', ')
      } else {
        authorText = note.content.authors.value?.join(', ')
      }
      var showPrivateLabel =
        note.content?.authorids?.readers &&
        !_.isEqual(note.readers?.sort(), note.content.authorids.readers?.sort())
      if (showPrivateLabel) {
        var tooltip = `privately revealed to ${note.content?.authorids?.readers
          ?.map((p) => view.prettyId(p))
          .join(', ')}`
        var privateLabel = `<span class="private-contents-icon glyphicon glyphicon-eye-open" title="${tooltip}" data-toggle="tooltip" data-placement="bottom"/>`
        authorText = `${authorText} ${privateLabel}`
      }
    } else {
      // Note with no authors, just signatures, such as a forum comment
      authorText = note.signatures
        .map(function (signature) {
          var signatureGroup = note.details?.signatures?.find((p) => p.id === signature)
          var signatureLink = prettyProfileLink(
            signature,
            view.prettyId(signature),
            'signatures'
          )
          if (signatureGroup) {
            var tooltip = `Privately revealed to ${signatureGroup.readers
              ?.map((p) => view.prettyId(p))
              .join(', ')}`
            var privateLabel = `<span class="private-contents-icon glyphicon glyphicon-eye-open" title="${tooltip}" data-toggle="tooltip" data-placement="bottom"/>`
            var readerEveryoneLabel =
              '<span class="private-contents-icon glyphicon glyphicon-globe" title="Publicly revealed to everyone" data-toggle="tooltip" data-placement="bottom"/>'
            if (signatureGroup.readers?.includes('everyone')) {
              return `${signatureLink} ${readerEveryoneLabel} ${signatureGroup.members
                .map((q) => prettyProfileLink(q, view.prettyId(q)))
                .join(', ')}`
            }
            return `${signatureLink} ${privateLabel} ${signatureGroup.members
              .map((q) => prettyProfileLink(q, view.prettyId(q)))
              .join(', ')}`
          }
          return signatureLink
        })
        .join(', ')
    }
    return authorText
  }

  const buildContent = (note, params, additionalOmittedFields) => {
    if (!params.withContent || (note.ddate && note.ddate < Date.now())) {
      return
    }

    var contentKeys = Object.keys(note.content ?? {})
    const contentOrder = note.details?.presentation?.length
      ? [...new Set([...note.details.presentation.map((p) => p.name), ...contentKeys])]
      : contentKeys

    var omittedContentFields = [
      'title',
      'authors',
      'authorids',
      'pdf',
      'verdict',
      'paperhash',
      'html',
      'year',
      'venue',
      'venueid',
    ].concat(additionalOmittedFields || [])

    var $contents = []
    contentOrder.forEach(function (fieldName) {
      if (omittedContentFields.includes(fieldName) || fieldName.startsWith('_')) {
        return
      }

      var valueString = view.prettyContentValue(note.content[fieldName]?.value)
      if (!valueString) {
        return
      }

      let privateLabel = null
      if (
        note.content[fieldName]?.readers &&
        !note.content[fieldName].readers.includes('everyone') &&
        !_.isEqual(note.readers?.sort(), note.content[fieldName].readers.sort())
      ) {
        var tooltip = `privately revealed to ${note.content[fieldName].readers
          .map((p) => view.prettyId(p))
          .join(', ')}`
        privateLabel = `<span class="private-contents-icon glyphicon glyphicon-eye-open" title="${tooltip}" data-toggle="tooltip" data-placement="bottom"/>`
      }

      // Build download links
      if (valueString.indexOf('/attachment/') === 0) {
        $contents.push(
          $('<div>', { class: 'note_contents' }).append(
            $('<span>', { class: 'note_content_field' }).text(
              view.prettyField(fieldName) + ': '
            ),
            privateLabel,
            $('<span>', { class: 'note_content_value' }).html(
              view.mkDownloadLink(note.id, fieldName, valueString, {
                isReference: params.isEdit,
              })
            )
          )
        )
        return
      }

      var $elem = $('<span>', { class: 'note_content_value' })
      var presentationDetails = note.details?.presentation?.find((p) => p.name === fieldName)
      if (presentationDetails?.markdown) {
        $elem[0].innerHTML = DOMPurify.sanitize(marked(valueString))
        $elem.addClass('markdown-rendered')
      } else if (presentationDetails?.markdownInline) {
        $elem[0].innerHTML = DOMPurify.sanitize(marked.parseInline(valueString))
        $elem.addClass('markdown-rendered')
      } else {
        // First set content as text to escape HTML, then autolink escaped HTML
        $elem.text(valueString)
        $elem.html(view.autolinkHtml($elem.html()))
      }
      var formattedFieldName = presentationDetails?.fieldName ?? view.prettyField(fieldName)

      $contents.push(
        $('<div>', { class: 'note_contents' }).append(
          $('<span>', { class: 'note_content_field' }).text(formattedFieldName + ': '),
          privateLabel,
          $elem
        )
      )
    })

    return $contents
  }

  var mkNotePanel = function (note, options) {
    var params = _.assign(
      {
        invitation: null,
        onEditRequested: null,
        deleteInvitation: null,
        editInvitations: [],
        replyInvitations: [],
        tagInvitations: [],
        onNewNoteRequested: null,
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
      },
      options
    )
    var $note = $('<div>', { id: 'note_' + note.id, class: 'note panel' })
    var forumId = note.forum
    var details = note.details || {}
    var canEdit = details.writable

    var notePastDue = note.ddate && note.ddate < Date.now()
    if (notePastDue) {
      $note.addClass('trashed')
    }

    if (note.content?._disableTexRendering?.value) {
      $note.addClass('disable-tex-rendering')
    }

    var generatedTitleText = view.generateNoteTitle(note.invitations[0], note.signatures)
    var titleText = getTitleText(note, generatedTitleText)
    var useGeneratedTitle =
      !_.trim(note.content?.title?.value) && !_.trim(note.content?.verdict?.value)
    var $titleHTML = view.mkTitleComponent(note, titleText)

    var $pdfLink = mkPdfIcon(note, params.isEdit)
    var $htmlLink = mkHtmlIcon(note)

    // Link to comment button
    var $linkButton = null
    if (forumId !== note.id && $('#content').hasClass('legacy-forum')) {
      var commentUrl = location.origin + '/forum?id=' + forumId + '&noteId=' + note.id
      $linkButton = $(
        '<button class="btn btn-xs btn-default permalink-button" title="Link to this comment" data-permalink-url="' +
          commentUrl +
          '">' +
          '<span class="glyphicon glyphicon-link" aria-hidden="true"></span></button>'
      )
    }

    // Trash button
    var $trashButton = null
    if (
      $('#content').hasClass('legacy-forum') ||
      $('#content').hasClass('tasks') ||
      $('#content').hasClass('revisions')
    ) {
      if (canEdit && params.onTrashedOrRestored && params.deleteInvitation) {
        var buttonContent = notePastDue
          ? 'Restore'
          : '<span class="glyphicon glyphicon-trash" aria-hidden="true"></span>'
        $trashButton = $('<div>', { class: 'meta_actions' }).append(
          $(
            '<button id="trashbutton_' +
              note.id +
              '" class="btn btn-xs trash_button">' +
              buttonContent +
              '</button>'
          )
        )
        $trashButton.click(function () {
          deleteOrRestoreNote(
            note,
            params.deleteInvitation,
            titleText,
            params.user,
            params.onTrashedOrRestored
          )
        })
        $titleHTML.addClass('pull-left')
      }
    }

    // Collapsed display for forum
    var $titleCollapsed = $('<div>', { class: 'title_collapsed' }).append(
      $titleHTML.clone().removeClass('pull-left')
    )
    if (useGeneratedTitle) {
      $titleCollapsed
        .find('.note_content_title')
        .html('<span>' + generatedTitleText + '</span>')
    } else {
      $titleCollapsed
        .find('.note_content_title')
        .prepend('<span>' + generatedTitleText + '</span> &bull; ')
    }

    var $titleAndPdf = $('<div>', { class: 'title_pdf_row clearfix' }).append(
      // Need the spaces for now to match the spacing of the template code
      $titleHTML.append(' ', $pdfLink, ' ', $htmlLink, $linkButton),
      $trashButton
    )

    var $parentNote = null
    if (params.withParentNote && note.forumContent && note.forum !== note.id) {
      $parentNote = $('<div class="meta_row parent-title">').append(
        '<span class="item glyphicon glyphicon-share-alt"></span>',
        '<span class="item title">' + note.forumContent.title + '</span>'
      )
    }

    var authorText = getAuthorText(note)

    var $contentSignatures = $('<span>', { class: 'signatures' }).html(authorText)
    var $contentAuthors = $('<div>', { class: 'meta_row' }).append($contentSignatures)

    var $revisionsLink = params.withRevisionsLink
      ? $('<a>', {
          class: 'note_content_pdf item',
          href: '/revisions?id=' + note.id,
          text: 'Show Revisions',
        })
      : null

    // Display modal showing full BibTeX reference. Click handler is definied in public/index.js
    var $bibtexLink =
      note.content?._bibtex?.value && params.withBibtexLink
        ? $(
            '<span class="item"><a href="#" data-target="#bibtex-modal" data-toggle="modal" data-bibtex="' +
              encodeURIComponent(note.content._bibtex.value) +
              '">Show Bibtex</a></span>'
          )
        : null

    var $metaEditRow = $('<div>', { class: 'meta_row' })
    var formattedDate = view.forumDate(
      note.cdate,
      note.tcdate,
      note.mdate,
      note.tmdate,
      note.content?.year?.value,
      note.pdate
    )
    var $dateItem =
      !notePastDue || details.writable
        ? $('<span>', { class: 'date item' }).text(formattedDate)
        : null
    var $invItem = $('<span>', { class: 'item' }).text(
      options.isEdit
        ? view.prettyId(note.invitations[0])
        : note.content?.venue?.value || view.prettyId(note.invitations[0])
    )
    var $readersItem = _.has(note, 'readers')
      ? $('<span>', { class: 'item' }).html('Readers: ' + view.prettyReadersList(note.readers))
      : null
    var $replyCountLabel =
      params.withReplyCount && details.replyCount
        ? $('<span>', { class: 'item' }).text(
            details.replyCount === 1 ? '1 Reply' : details.replyCount + ' Replies'
          )
        : null
    $metaEditRow.append(
      $dateItem,
      $invItem,
      $readersItem,
      $replyCountLabel,
      $bibtexLink,
      $revisionsLink
    )

    var $metaActionsRow = null

    if (canEdit && params.editInvitations?.length && !notePastDue) {
      var $editInvitations = _.map(params.editInvitations, function (invitation) {
        return $('<button class="btn btn-xs edit_button referenceinvitation">')
          .text(view.prettyInvitationId(invitation.id))
          .click(function () {
            params.onEditRequested(invitation)
          })
      })
      $metaActionsRow = $('<div>', { class: 'meta_row meta_actions' }).append(
        '<span class="item hint">Edit</span>',
        $editInvitations
      )
      $metaEditRow.addClass('pull-left')
    }

    $note.append(
      $titleAndPdf,
      $titleCollapsed,
      $parentNote,
      $contentAuthors,
      $('<div class="clearfix">').append($metaEditRow, $metaActionsRow),
      buildContent(note, params)
    )

    var buildTag = function (tags, tagInvitation) {
      var buildRelations = function (relation) {
        var description = tagInvitation.edit?.note?.[relation]

        if (_.has(description, 'values')) {
          return description.values
        }

        if (_.has(description, 'values-regex')) {
          if (_.startsWith(description['value-regex'], '~.*')) {
            return [params.user.profile.id]
          }
        }

        // Default value: logged in user
        return [params.user.profile.id]
      }

      return view.mkTagInput('tag', tagInvitation.edit?.note?.content?.tag?.value, tags, {
        forum: note.id,
        placeholder:
          tagInvitation.edit?.note?.content?.tag?.description ||
          (tagInvitation && view.prettyId(tagInvitation.id)),
        label: tagInvitation && view.prettyInvitationId(tagInvitation.id),
        readOnly: params.readOnlyTags,
        onChange: function (id, value, deleted, done) {
          var body = {
            id: id,
            tag: value,
            signatures: buildRelations('signatures'),
            readers: buildRelations('readers'),
            forum: note.id,
            invitation: tagInvitation.id,
            ddate: deleted ? Date.now() : null,
          }
          // body = getCopiedValues(body, tagInvitation.reply);

          Webfield.post('/tags', body, function (result) {
            done(result)
            if (params.onTagChanged) {
              params.onTagChanged(result)
            }
          })
        },
      })
    }

    // Group tags by invitation id and signatures
    var processedInvitations = []
    var invitationsWithoutTags = []
    var tagsWithInvitations = []
    var tagsWithoutInvitations = []

    // Process tags
    var groupByInvitation = _.groupBy(details.tags, 'invitation')
    _.forEach(groupByInvitation, function (tags) {
      var invitationId = tags[0].invitation
      var tagInvitation = _.find(params.tagInvitations, ['id', invitationId])

      // Group tags by signature
      var groupBySignature = _.groupBy(tags, 'signatures')
      _.forEach(groupBySignature, function (signatureTags) {
        if (tagInvitation && _.includes(signatureTags[0].signatures, params.user.profile.id)) {
          tagsWithInvitations.push(buildTag(signatureTags, tagInvitation))
          processedInvitations.push(tagInvitation)
        } else {
          // read-only tag, invitation is not available
          tagsWithoutInvitations.push(buildTag(signatureTags, undefined))
        }
      })
    })

    // Process tag invitations that do not have tags
    var pendingTagInvitations = _.difference(params.tagInvitations, processedInvitations)
    _.forEach(pendingTagInvitations, function (tagInvitation) {
      if (
        tagInvitation.edit?.note?.invitation ||
        tagInvitation?.edit?.note?.forum === note.id
      ) {
        invitationsWithoutTags.push(buildTag([], tagInvitation))
      }
    })

    // Append tags to note
    var tagWidgets = invitationsWithoutTags.concat(tagsWithInvitations, tagsWithoutInvitations)
    var maxTagsToShow = 3
    if (tagWidgets.length <= maxTagsToShow) {
      $note.append(tagWidgets)
    } else {
      $note.append(tagWidgets.slice(0, maxTagsToShow))
      $note.append(
        $('<div>', { id: note.id + '-tags', class: 'collapse note-tags-overflow' }).append(
          tagWidgets.slice(maxTagsToShow)
        ),
        '<div><a href="#' +
          note.id +
          '-tags" class="note-tags-toggle" role="button" ' +
          'data-toggle="collapse" aria-expanded="false">Show ' +
          (tagWidgets.length - maxTagsToShow) +
          ' more...</a></div>'
      )
    }

    // Append invitation buttons
    var $replyRow = $('<div>', { class: 'reply_row clearfix' })
    if (!_.isEmpty(params.replyInvitations) && !notePastDue) {
      $replyRow.append(
        '<span class="item hint">Add</span>',
        _.map(params.replyInvitations, function (invitation) {
          return $('<button class="btn btn-xs">')
            .text(view.prettyInvitationId(invitation.id))
            .click(function () {
              params.onNewNoteRequested(invitation)
            })
        })
      )
    }
    $note.append($replyRow)

    return $note
  }

  var pdfUrl = function (note, isEdit) {
    var path = isEdit ? '/notes/edits/pdf' : '/pdf'
    return _.startsWith(note.content.pdf?.value, '/pdf')
      ? path + '?id=' + note.id
      : note.content?.pdf?.value
  }

  const deleteOrRestoreNote = async (
    note,
    invitation,
    noteTitle,
    user,
    onTrashedOrRestored
  ) => {
    const isDeleted = note.ddate && note.ddate < Date.now()
    var postUpdatedNote = function ($editSignatures, $editReaders) {
      const ddate = isDeleted ? { delete: true } : Date.now()
      let editSignatureInputValues = view.idsFromListAdder(
        $editSignatures,
        invitation.edit.signatures
      )
      const editReaderValues = getReaders(
        $editReaders,
        invitation,
        editSignatureInputValues,
        true
      )
      if (!editSignatureInputValues || !editSignatureInputValues.length) {
        editSignatureInputValues = [user.profile.id]
      }
      const editToPost = constructEdit({
        formData: { editSignatureInputValues, editReaderValues },
        noteObj: { ...note, ddate },
        invitationObj: invitation,
      })
      Webfield2.post('/notes/edits', editToPost, null).then(function () {
        // the return of the post is edit without updatednote
        // so get the updated note again
        Webfield2.get('/notes', { id: note.id, trash: !isDeleted }).then(function (result) {
          onTrashedOrRestored({ ...result.notes[0], details: note.details })
        })
      })
    }

    const $editSignatures = await buildSignatures(
      invitation.edit.signatures,
      null,
      user,
      'signature'
    )
    const $editReaders = await buildEditReaders(invitation.edit.readers, null)

    // If there's only 1 signature available don't show the modal
    if (!$editSignatures.find('div.dropdown').length) {
      postUpdatedNote($editSignatures)
      return
    }

    showConfirmDeleteModal(note, noteTitle, $editSignatures, $editReaders)

    $('#confirm-delete-modal .modal-footer .btn-primary').on('click', function () {
      postUpdatedNote($editSignatures)
      $('#confirm-delete-modal').modal('hide')
    })
  }

  const showConfirmDeleteModal = (note, noteTitle, $editSignaturesDropdown, $editReaders) => {
    const actionText = note.ddate ? 'Restore' : 'Delete'
    $('#confirm-delete-modal').remove()

    $('#content').append(
      Handlebars.templates.genericModal({
        id: 'confirm-delete-modal',
        showHeader: true,
        title: `${actionText} Note`,
        body: `<p class="mb-4">Are you sure you want to ${actionText.toLowerCase()} the note
        "${noteTitle}" by ${view.prettyId(
          note.signatures[0]
        )}? The ${actionText.toLowerCase()}d note will
        be updated with the signature you choose below.</p>`,
        showFooter: true,
        primaryButtonText: actionText,
      })
    )

    $editReaders?.addClass('note_editor ml-0 mr-0 mb-2')
    $editSignaturesDropdown.addClass('note_editor ml-0 mr-0 mb-2')
    $('#confirm-delete-modal .modal-body').append($editReaders, $editSignaturesDropdown)

    $('#confirm-delete-modal').modal('show')
  }

  const mkNewNoteEditor = async (invitation, forum, replyto, user, options) => {
    var params = _.assign(
      {
        onNoteCreated: null,
        onCompleted: null,
        onNoteCancelled: null,
        onValidate: null,
        onError: null,
      },
      options
    )

    if ($('.note_editor.panel').length) {
      promptError(
        'You currently have another editor pane open on this page. ' +
          'Please submit your changes or click Cancel before continuing',
        { scrollToTop: false }
      )
      if (params.onCompleted) {
        params.onCompleted(null)
      }
      return
    }

    var contentOrder = order(invitation.edit?.note?.content, invitation.id)
    var profileWidget = contentOrder.includes('authors') && contentOrder.includes('authorids')
    var $contentMap = _.reduce(
      contentOrder,
      function (ret, k) {
        ret[k] = mkComposerInput(
          k,
          invitation.edit?.note?.content?.[k],
          invitation.edit?.note?.content?.[k].value.param?.default || '',
          { useDefaults: true, user: user, profileWidget: profileWidget }
        )
        return ret
      },
      {}
    )

    var uploadInProgressFields = []
    function buildEditor(editReaders, editSignatures, noteReaders, noteSignatures) {
      var $submitButton = $('<button class="btn btn-sm">Submit</button>')
      var $cancelButton = $('<button class="btn btn-sm">Cancel</button>')

      $submitButton.click(function () {
        if ($submitButton.prop('disabled')) {
          return false
        }

        $submitButton
          .prop({ disabled: true })
          .append(
            [
              '<div class="spinner-small">',
              '<div class="rect1"></div><div class="rect2"></div>',
              '<div class="rect3"></div><div class="rect4"></div>',
              '</div>',
            ].join('\n')
          )
        $cancelButton.prop({ disabled: true })

        var content = getContent(invitation, $contentMap)
        var constNoteSignature =
          Array.isArray(invitation.edit.note?.signatures) &&
          invitation.edit.note?.signatures[0].includes('/signatures}')
        const useEditSignature =
          constNoteSignature ||
          (_.has(invitation.edit.note?.signatures.param, 'const') &&
            invitation.edit.note?.signatures?.param.const[0].includes('/signatures}')) // when note signature is edit signature, note reader should use edit signatures
        const editSignatureInputValues = view.idsFromListAdder(
          editSignatures,
          invitation.edit.signatures
        )
        const noteSignatureInputValues = view.idsFromListAdder(
          noteSignatures,
          invitation.edit?.note?.signatures
        )
        const editReaderValues = getReaders(
          editReaders,
          invitation,
          editSignatureInputValues,
          true
        )
        const noteReaderValues = getReaders(
          noteReaders,
          invitation,
          useEditSignature ? editSignatureInputValues : noteSignatureInputValues
        )
        const editWriterValues = getWriters(invitation, editSignatureInputValues, user)
        content[0].editSignatureInputValues = editSignatureInputValues
        content[0].noteSignatureInputValues = noteSignatureInputValues
        content[0].editReaderValues = editReaderValues
        content[0].noteReaderValues = noteReaderValues
        content[0].editWriterValues = editWriterValues
        content[0].replyto = replyto

        var errorList = content[2].concat(validate(invitation, content[0], noteReaders))
        if (params.onValidate) {
          errorList = errorList.concat(params.onValidate(invitation, content[0]))
        }
        var files = content[1]

        if (!_.isEmpty(errorList)) {
          if (params.onError) {
            params.onError(errorList)
          } else {
            promptError(errorList[0])
          }
          $submitButton.prop({ disabled: false }).find('.spinner-small').remove()
          $cancelButton.prop({ disabled: false })
          return
        }

        if (_.isEmpty(files)) {
          return saveNote(content[0], invitation)
        }

        var onError = function (e) {
          var errorMsg
          if (e.responseJSON && e.responseJSON.message) {
            errorMsg = e.responseJSON.message
          } else if (e.readyState === 0) {
            errorMsg = 'There is an error with the network and the file could not be uploaded'
          } else {
            errorMsg = 'There was an error uploading the file'
          }

          if (params.onError) {
            params.onError([errorMsg])
          } else if (e.responseJSON && e.responseJSON.errors) {
            promptError(e.responseJSON.errors[0])
          } else {
            promptError(errorMsg)
          }
          $submitButton.prop({ disabled: false }).find('.spinner-small').remove()
          $cancelButton.prop({ disabled: false })
        }

        var fieldNames = _.keys(files)
        var promises = fieldNames.map(function (fieldName) {
          var uploadInProgressField = uploadInProgressFields.find(
            (p) => p.fieldName === fieldName
          )
          if (uploadInProgressField) {
            uploadInProgressField.contentRef = content[0]
            return uploadInProgressField.promiseRef
          }
          var $progressBar = $contentMap[fieldName].find('div.progress')
          var file = files[fieldName]
          var chunkSize = 1024 * 1000 * 5 // 5mb
          var chunkCount = Math.ceil(file.size / chunkSize)
          var clientUploadId = nanoid()
          var chunks = Array.from(new Array(chunkCount), function (e, chunkIndex) {
            return new File(
              [file.slice(chunkIndex * chunkSize, (chunkIndex + 1) * chunkSize, file.type)],
              file.name
            )
          })
          var sendSingleChunk = function (chunk, index) {
            var data = new FormData()
            data.append('invitationId', invitation.id)
            data.append('name', fieldName)
            data.append('chunkIndex', index + 1)
            data.append('totalChunks', chunkCount)
            data.append('clientUploadId', clientUploadId)
            data.append('file', chunk)
            return Webfield2.sendFileChunk(data, $progressBar).then(
              function (result) {
                if (index + 1 === chunkCount) {
                  if (!result.url) {
                    $progressBar.hide()
                    throw new Error('No URL returned, file upload failed')
                  }
                  var uploadInProgressField = uploadInProgressFields.find(
                    (p) => p.fieldName === fieldName
                  )
                  if (uploadInProgressField) {
                    uploadInProgressField.contentRef[fieldName] = result.url
                    updateFileSection(
                      $contentMap[fieldName],
                      fieldName,
                      invitation.edit.note?.content?.[fieldName],
                      uploadInProgressField.contentRef[fieldName]
                    )
                  } else {
                    content[0][fieldName] = result.url
                    updateFileSection(
                      $contentMap[fieldName],
                      fieldName,
                      invitation.edit.note?.content?.[fieldName],
                      content[0][fieldName]
                    )
                  }
                  uploadInProgressFields = uploadInProgressFields.filter(
                    (p) => p.fieldName !== fieldName
                  )
                }
              },
              function (e) {
                $progressBar.hide()
                uploadInProgressFields = uploadInProgressFields.filter(
                  (p) => p.fieldName !== fieldName
                )
                onError(e)
              }
            )
          }
          $progressBar.show()
          var sendChunksPromiseRef = chunks.reduce(function (oldPromises, currentChunk, i) {
            return oldPromises.then(function (_) {
              return sendSingleChunk(currentChunk, i)
            })
          }, Promise.resolve())
          uploadInProgressFields.push({
            fieldName,
            contentRef: content[0],
            promiseRef: sendChunksPromiseRef,
          })
          return sendChunksPromiseRef
        })

        Promise.all(promises).then(
          function () {
            saveNote(content[0], invitation)
          },
          function (e) {
            if (e) onError(e)
          }
        )
      })

      $cancelButton.on('click', function () {
        const confirmCancel =
          $noteEditor.data('hasUnsavedData') &&
          // eslint-disable-next-line no-alert
          !window.confirm(
            'Any unsaved changes will be lost. Are you sure you want to continue?'
          )
        if (confirmCancel) return

        view.clearAutosaveData(autosaveStorageKeys)
        if (params.onNoteCancelled) {
          params.onNoteCancelled()
        } else {
          $noteEditor.remove()
        }
      })

      var saveNote = function (formContent, invitation) {
        const editToPost = constructEdit({ formData: formContent, invitationObj: invitation })
        Webfield2.post('/notes/edits', editToPost, { handleErrors: false }).then(
          function (result) {
            if (params.onNoteCreated) {
              const constructedNote = {
                ...result.note,
                invitations: [invitation.id],
                details: { invitation, writable: true },
              }

              // Try to get the complete note, since edit does not contain all fields.
              // If it cannot be retrieved, use the note constructed from the edit response.
              Webfield2.get(
                '/notes',
                { id: result.note.id, details: 'invitation,presentation,writable' },
                { handleErrors: false }
              ).then(
                function (noteRes) {
                  params.onNoteCreated(
                    noteRes.notes?.length > 0 ? noteRes.notes[0] : constructedNote
                  )
                },
                function () {
                  params.onNoteCreated(constructedNote)
                }
              )
            }
            $noteEditor.remove()
            view.clearAutosaveData(autosaveStorageKeys)
          },
          function (jqXhr, textStatus) {
            var errorText = Webfield.getErrorFromJqXhr(jqXhr, textStatus)
            if (params.onError) {
              params.onError([errorText])
            } else {
              promptError(errorText)
            }
            $submitButton.prop({ disabled: false }).find('.spinner-small').remove()
            $cancelButton.prop({ disabled: false })
          }
        )
      }

      var $noteEditor = $('<div>', { class: 'note_editor panel' }).append(
        '<h2 class="note_content_title">New ' +
          view.prettyInvitationId(invitation.id) +
          '</h2>',
        '<div class="required_field">* denotes a required field</div>',
        '<hr class="small">',
        _.values($contentMap),
        noteReaders,
        noteSignatures,
        $('<div class="note_content_section">').append(
          '<h2 class="note_content_section">Edit History</h2>',
          '<hr class="small">',
          editReaders,
          editSignatures
        ),
        $('<div>', { class: 'row' }).append($submitButton, $cancelButton)
      )
      $noteEditor.data('invitationId', invitation.id)

      view.autolinkFieldDescriptions($noteEditor)
      var autosaveStorageKeys = view.setupAutosaveHandlers(
        $noteEditor,
        user,
        replyto + '|new',
        invitation.id
      )

      if (params.onCompleted) {
        params.onCompleted($noteEditor)
      }
    }

    try {
      const editReaders = await buildEditReaders(invitation.edit?.readers, null)
      const editSignatures = await buildSignatures(
        invitation.edit?.signatures,
        null,
        user,
        'signatures'
      )

      const parentId = forum === replyto ? null : replyto
      let noteReaders = null
      await buildNoteReaders(invitation.edit.note.readers, [], parentId, (result, error) => {
        if (error) {
          if (params.onError) {
            params.onError([error])
          } else {
            promptError(error)
          }
        }
        noteReaders = result
      })
      const noteSignatures = await buildSignatures(
        invitation.edit?.note?.signatures,
        null,
        user,
        'signatures'
      )
      buildEditor(editReaders, editSignatures, noteReaders, noteSignatures)
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(error)

      const err =
        error === 'no_results' ? 'You do not have permission to create a note' : error
      if (params.onError) {
        params.onError([err])
      } else {
        promptError(err)
      }
    }
  }

  function buildEditReaders(fieldDescription) {
    if (!fieldDescription) {
      // done(undefined, 'Invitation is missing readers');
      return null // not essentially an error
    }

    var requiredText = fieldDescription.optional
      ? null
      : $('<span>', { text: '*', class: 'required_field' })

    if (_.has(fieldDescription, 'param') && _.has(fieldDescription.param, 'regex')) {
      return Webfield.get(
        '/groups',
        { regex: fieldDescription.param.regex },
        { handleErrors: false }
      ).then(
        function (result) {
          if (_.isEmpty(result.groups)) {
            promptError('You do not have permission to create a note')
          } else {
            var everyoneList = _.filter(result.groups, function (g) {
              return g.id === 'everyone'
            })
            var restOfList = _.sortBy(
              _.filter(result.groups, function (g) {
                return g.id !== 'everyone'
              }),
              function (g) {
                return g.id
              }
            )

            var $readers = mkComposerInput('readers', { value: fieldDescription }, [], {
              groups: everyoneList.concat(restOfList),
            })
            $readers.find('.small_heading').prepend(requiredText)
            return $readers
          }
        },
        function (jqXhr, textStatus) {
          var errorText = Webfield.getErrorFromJqXhr(jqXhr, textStatus)
          promptError(errorText)
        }
      )
    } else if (_.has(fieldDescription, 'param') && _.has(fieldDescription.param, 'enum')) {
      var values = fieldDescription.param.enum
      var extraGroupsP = $.Deferred().resolve([])
      var regexIndex = _.findIndex(values, function (g) {
        return g.indexOf('.*') >= 0
      })
      if (regexIndex >= 0) {
        var regex = values[regexIndex]
        extraGroupsP = Webfield.get('/groups', { regex: regex }).then(function (result) {
          if (result.groups && result.groups.length) {
            var groups = result.groups.map(function (g) {
              return g.id
            })
            fieldDescription.param.enum = values
              .slice(0, regexIndex)
              .concat(groups, values.slice(regexIndex + 1))
          } else {
            fieldDescription.param.enum.splice(regexIndex, 1)
          }
          return result.groups
        })
      }
      return extraGroupsP.then(function () {
        var $readers = mkComposerInput('readers', { value: fieldDescription }, [])
        $readers.find('.small_heading').prepend(requiredText)
        return $readers
      })
    } else {
      var $readers = mkComposerInput('readers', { value: fieldDescription }, [])
      $readers.find('.small_heading').prepend(requiredText)
      return $readers
    }
  }

  const buildNoteReaders = async (fieldDescription, fieldValue, replyto, done) => {
    if (!fieldDescription) {
      // done(undefined, 'Invitation is missing readers');
      done(null) // not essentially an error
      return
    }

    var requiredText = fieldDescription.optional
      ? null
      : $('<span>', { text: '*', class: 'required_field' })
    var setParentReaders = function (parent, fieldDescription, fieldType, done) {
      if (parent) {
        return Webfield2.get('/notes', { id: parent }).then(function (result) {
          var newFieldDescription = fieldDescription
          if (result.notes.length > 0) {
            var parentReaders = result.notes[0].readers
            if (!_.includes(parentReaders, 'everyone')) {
              newFieldDescription = {
                description: fieldDescription.description,
                default: fieldDescription.param?.default,
                param: {},
              }
              newFieldDescription.param[fieldType] = parentReaders
              if (!fieldValue.length) {
                fieldValue = newFieldDescription.param[fieldType]
              }
            }
          }
          done(newFieldDescription)
        })
      } else {
        done(fieldDescription)
      }
    }

    if (_.has(fieldDescription, 'param') && _.has(fieldDescription.param, 'regex')) {
      return Webfield2.get(
        '/groups',
        { regex: fieldDescription.param.regex },
        { handleErrors: false }
      ).then(
        function (result) {
          if (_.isEmpty(result.groups)) {
            done(undefined, 'You do not have permission to create a note')
          } else {
            var everyoneList = _.filter(result.groups, function (g) {
              return g.id === 'everyone'
            })
            var restOfList = _.sortBy(
              _.filter(result.groups, function (g) {
                return g.id !== 'everyone'
              }),
              function (g) {
                return g.id
              }
            )

            var $readers = mkComposerInput(
              'readers',
              { value: fieldDescription },
              fieldValue,
              { groups: everyoneList.concat(restOfList) }
            )
            if (fieldDescription.optional) {
              $readers.find('.small_heading').prepend(requiredText)
            }
            done($readers)
          }
        },
        function (jqXhr, textStatus) {
          var errorText = Webfield.getErrorFromJqXhr(jqXhr, textStatus)
          done(undefined, errorText)
        }
      )
    } else if (_.has(fieldDescription, 'param') && _.has(fieldDescription.param, 'enum')) {
      var values = fieldDescription.param.enum
      var extraGroupsP = []
      var regexIndex = _.findIndex(values, function (g) {
        return g.indexOf('.*') >= 0
      })
      var regex = null
      if (regexIndex >= 0) {
        regex = values[regexIndex]
        var result = await Webfield.get('/groups', { regex: regex })
        if (result.groups && result.groups.length) {
          var groups = result.groups.map(function (g) {
            return g.id
          })
          fieldDescription.param.enum = values
            .slice(0, regexIndex)
            .concat(groups, values.slice(regexIndex + 1))
        } else {
          fieldDescription.param.enum.splice(regexIndex, 1)
        }
      }

      return setParentReaders(
        replyto,
        fieldDescription,
        'enum',
        function (newFieldDescription) {
          // Make sure the new parent readers belong to the current invitation available values
          var invitationReaders = fieldDescription.param.enum
          var replyValues = []
          newFieldDescription.param.enum.forEach(function (valueReader) {
            if (invitationReaders.includes(valueReader) || valueReader.match(regex)) {
              replyValues.push(valueReader)
            }
          })

          // Make sure AnonReviewers are in the dropdown options where '/Reviewers' is in the parent note
          var hasReviewers = _.find(replyValues, function (v) {
            return v.endsWith('/Reviewers')
          })
          var hasAnonReviewers = _.find(replyValues, function (v) {
            return v.includes('/AnonReviewer') || v.includes('/Reviewer_')
          })
          if (hasReviewers && !hasAnonReviewers) {
            fieldDescription.param.enum.forEach(function (value) {
              if (value.includes('AnonReviewer') || value.includes('Reviewer_')) {
                replyValues.push(value)
              }
            })
          }

          newFieldDescription.param.enum = replyValues
          if (
            _.difference(newFieldDescription.param.default, newFieldDescription.param.enum)
              .length !== 0
          ) {
            // invitation default is not in list of possible values
            done(undefined, 'Default reader is not in the list of readers')
          }
          var $readers = mkComposerInput('readers', { value: newFieldDescription }, fieldValue)
          $readers.find('.small_heading').prepend(requiredText)
          done($readers)
        }
      )
    } else if (
      (_.has(fieldDescription, 'param') && _.has(fieldDescription, 'const')) ||
      Array.isArray(fieldDescription)
    ) {
      if (Array.isArray(fieldDescription)) {
        // wrap array as param.const to reuse code
        fieldDescription = { param: { const: fieldDescription } }
      }
      return setParentReaders(
        replyto,
        fieldDescription,
        'const',
        function (newFieldDescription) {
          // eslint-disable-next-line no-template-curly-in-string
          if (fieldDescription.param.const[0] === '${{note.replyto}.readers}') {
            fieldDescription.param.const = newFieldDescription.param.const
          }
          var subsetReaders = fieldDescription.param.const.every(function (val) {
            var found = newFieldDescription.param.const.indexOf(val) !== -1
            if (!found && val.includes('/Reviewer_')) {
              var hasReviewers = _.find(newFieldDescription.param.const, function (v) {
                return v.includes('/Reviewers')
              })
              return hasReviewers
            }
            return found
          })
          if (
            _.isEqual(newFieldDescription.param.const, fieldDescription.param.const) ||
            subsetReaders
          ) {
            // for values, readers must match with invitation instead of parent invitation
            var $readers = mkComposerInput('readers', { value: fieldDescription }, fieldValue)
            $readers.find('.small_heading').prepend(requiredText)
            done($readers)
          } else {
            done(undefined, 'Can not create note, readers must match parent note')
          }
        }
      )
    } else {
      var $readers = mkComposerInput('readers', { value: fieldDescription }, fieldValue)
      $readers.find('.small_heading').prepend(requiredText)
      done($readers)
    }
  }

  function buildSignatures(fieldDescription, fieldValue, user, headingText = 'signatures') {
    var $signatures
    if (_.has(fieldDescription, 'param.regex')) {
      var currentVal = fieldValue && fieldValue[0]

      if (fieldDescription.param.regex === '~.*') {
        if (user && user.profile) {
          var prefId = user.profile.preferredId || user.profile.id
          $signatures = view.mkDropdownList(
            headingText,
            fieldDescription.description,
            currentVal,
            [prefId],
            true
          )
          return $.Deferred().resolve($signatures)
        } else {
          return $.Deferred().reject('no_results')
        }
      } else {
        if (!user) {
          return $.Deferred().reject('no_results')
        }

        return Webfield.get(
          '/groups',
          {
            regex: fieldDescription.param.regex,
            signatory: user.id,
          },
          { handleErrors: false }
        ).then(
          function (result) {
            if (_.isEmpty(result.groups)) {
              return $.Deferred().reject('no_results')
            }

            var uniquePrettyIds = {}
            var dropdownListOptions = []
            var singleOption = result.groups.length === 1
            _.forEach(result.groups, function (group) {
              var prettyGroupId = view.prettyId(group.id)
              if (!(prettyGroupId in uniquePrettyIds)) {
                dropdownListOptions.push({
                  id: group.id,
                  description:
                    prettyGroupId +
                    (!singleOption &&
                    !group.id.startsWith('~') &&
                    group.members &&
                    group.members.length === 1
                      ? ' (' + view.prettyId(group.members[0]) + ')'
                      : ''),
                })
                uniquePrettyIds[prettyGroupId] = group.id
              }
            })
            $signatures = view.mkDropdownList(
              headingText,
              fieldDescription.description,
              currentVal,
              dropdownListOptions,
              true
            )
            return $signatures
          },
          function (jqXhr, textStatus) {
            return Webfield.getErrorFromJqXhr(jqXhr, textStatus)
          }
        )
      }
    } else {
      $signatures = mkComposerInput(headingText, { value: fieldDescription }, fieldValue)
      return $.Deferred().resolve($signatures)
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
      ...(options ?? {}),
    }
    if ($('.note_editor.panel').length) {
      promptError(
        'You currently have another editor pane open on this page. ' +
          'Please submit your changes or click Cancel before continuing',
        { scrollToTop: false }
      )
      if (params.onCompleted) {
        params.onCompleted(null)
      }
      return false
    }

    // the order here should be from invitation, not note.details
    // presentation info may be different
    const contentOrder = order(invitation.edit?.note?.content, invitation.id)
    var profileWidget = contentOrder.includes('authors') && contentOrder.includes('authorids')
    const $contentMap = _.reduce(
      contentOrder,
      (map, fieldName) => {
        const fieldContent = _.get(note, ['content', fieldName, 'value'], '')
        map[fieldName] = mkComposerInput(
          fieldName,
          invitation.edit.note.content[fieldName],
          fieldContent,
          { note: note, useDefaults: true, profileWidget: profileWidget }
        )
        return map
      },
      {}
    )

    var uploadInProgressFields = []
    const buildEditor = (editReaders, editSignatures, noteReaders, noteSignatures) => {
      const $submitButton = $('<button class="btn btn-sm">Submit</button>')
      const $cancelButton = $('<button class="btn btn-sm">Cancel</button>')

      $submitButton.click(() => {
        if ($submitButton.prop('disabled')) {
          return false
        }

        $submitButton
          .prop('disabled', true)
          .append(
            [
              '<div class="spinner-small">',
              '<div class="rect1"></div><div class="rect2"></div>',
              '<div class="rect3"></div><div class="rect4"></div>',
              '</div>',
            ].join('\n')
          )
        $cancelButton.prop('disabled', true)

        const noteEditObject = {
          isEdit: params.isEdit,
          ...(params.isEdit ? { edit: params.editToUpdate } : { note }),
        }
        const content = getContent(invitation, $contentMap, noteEditObject)
        var constNoteSignature =
          Array.isArray(invitation.edit.note?.signatures) &&
          invitation.edit.note?.signatures[0].includes('/signatures}')
        const useEditSignature =
          constNoteSignature ||
          (_.has(invitation.edit.note?.signatures?.param, 'const') &&
            invitation.edit.note?.signatures?.param.const[0].includes('/signatures}')) // when note signature is edit signature, note reader should use edit signatures
        const editSignatureInputValues = view.idsFromListAdder(
          editSignatures,
          invitation.edit.signatures
        )
        const noteSignatureInputValues = view.idsFromListAdder(
          noteSignatures,
          invitation.edit?.note?.signatures
        )
        const editReaderValues = getReaders(
          editReaders,
          invitation,
          editSignatureInputValues,
          true
        )
        const noteReaderValues = getReaders(
          noteReaders,
          invitation,
          useEditSignature ? editSignatureInputValues : noteSignatureInputValues
        )
        const editWriterValues = getWriters(invitation, editSignatureInputValues, user)
        content[0].editSignatureInputValues = editSignatureInputValues
        content[0].noteSignatureInputValues = noteSignatureInputValues
        content[0].editReaderValues = editReaderValues
        content[0].noteReaderValues = noteReaderValues
        content[0].editWriterValues = editWriterValues

        let errorList = content[2].concat(validate(invitation, content[0], noteReaders))
        if (params.onValidate) {
          errorList = errorList.concat(params.onValidate(invitation, content[0], note))
        }

        const files = content[1]

        if (!_.isEmpty(errorList)) {
          if (params.onError) {
            params.onError(errorList)
          } else {
            promptError(errorList[0])
          }
          $submitButton.prop({ disabled: false }).find('.spinner-small').remove()
          $cancelButton.prop({ disabled: false })
          return
        }

        if (_.isEmpty(files)) {
          return saveNote(content[0], note, invitation)
        }

        var onError = function (e) {
          var errorMsg
          if (e.responseJSON && e.responseJSON.message) {
            errorMsg = e.responseJSON.message
          } else if (e.readyState === 0) {
            errorMsg = 'There is an error with the network and the file could not be uploaded'
          } else {
            errorMsg = 'There was an error uploading the file'
          }

          if (params.onError) {
            params.onError([errorMsg])
          } else if (e.responseJSON && e.responseJSON.errors) {
            promptError(e.responseJSON.errors[0])
          } else {
            promptError(errorMsg)
          }
          $submitButton.prop({ disabled: false }).find('.spinner-small').remove()
          $cancelButton.prop({ disabled: false })
        }

        var fieldNames = _.keys(files)
        var promises = fieldNames.map(function (fieldName) {
          var uploadInProgressField = uploadInProgressFields.find(
            (p) => p.fieldName === fieldName
          )
          if (uploadInProgressField) {
            uploadInProgressField.contentRef = content[0]
            return uploadInProgressField.promiseRef
          }
          var $progressBar = $contentMap[fieldName].find('div.progress')
          var file = files[fieldName]
          var chunkSize = 1024 * 1000 * 5 // 5mb
          var chunkCount = Math.ceil(file.size / chunkSize)
          var clientUploadId = nanoid()
          var chunks = Array.from(new Array(chunkCount), function (e, chunkIndex) {
            return new File(
              [file.slice(chunkIndex * chunkSize, (chunkIndex + 1) * chunkSize, file.type)],
              file.name
            )
          })
          var sendSingleChunk = function (chunk, index) {
            var data = new FormData()
            data.append('invitationId', invitation.id)
            data.append('name', fieldName)
            data.append('chunkIndex', index + 1)
            data.append('totalChunks', chunkCount)
            data.append('clientUploadId', clientUploadId)
            data.append('file', chunk)
            return Webfield2.sendFileChunk(data, $progressBar).then(
              function (result) {
                if (index + 1 === chunkCount) {
                  if (!result.url) {
                    $progressBar.hide()
                    throw new Error('No URL returned, file upload failed')
                  }
                  var uploadInProgressField = uploadInProgressFields.find(
                    (p) => p.fieldName === fieldName
                  )
                  if (uploadInProgressField) {
                    uploadInProgressField.contentRef[fieldName] = result.url
                    updateFileSection(
                      $contentMap[fieldName],
                      fieldName,
                      invitation.edit.note?.content?.[fieldName],
                      uploadInProgressField.contentRef[fieldName]
                    )
                  } else {
                    content[0][fieldName] = result.url
                    updateFileSection(
                      $contentMap[fieldName],
                      fieldName,
                      invitation.edit.note?.content?.[fieldName],
                      content[0][fieldName]
                    )
                  }
                  uploadInProgressFields = uploadInProgressFields.filter(
                    (p) => p.fieldName !== fieldName
                  )
                }
              },
              function (e) {
                $progressBar.hide()
                uploadInProgressFields = uploadInProgressFields.filter(
                  (p) => p.fieldName !== fieldName
                )
                onError(e)
              }
            )
          }
          $progressBar.show()
          var sendChunksPromiseRef = chunks.reduce(function (oldPromises, currentChunk, i) {
            return oldPromises.then(function (_) {
              return sendSingleChunk(currentChunk, i)
            })
          }, Promise.resolve())
          uploadInProgressFields.push({
            fieldName,
            contentRef: content[0],
            promiseRef: sendChunksPromiseRef,
          })
          return sendChunksPromiseRef
        })

        Promise.all(promises).then(
          function () {
            saveNote(content[0], note, invitation)
          },
          function (e) {
            if (e) onError(e)
          }
        )
      })

      $cancelButton.on('click', function () {
        const confirmCancel =
          $noteEditor.data('hasUnsavedData') &&
          // eslint-disable-next-line no-alert
          !window.confirm(
            'Any unsaved changes will be lost. Are you sure you want to continue?'
          )
        if (confirmCancel) return

        if (params.onNoteCancelled) {
          params.onNoteCancelled()
        } else {
          $noteEditor.remove()
        }
        view.clearAutosaveData(autosaveStorageKeys)
      })

      var saveNote = function (formContent, existingNote, invitation) {
        const editToPost = params.isEdit
          ? constructUpdatedEdit(params.editToUpdate, invitation, formContent)
          : constructEdit({
              formData: formContent,
              noteObj: existingNote,
              invitationObj: invitation,
            })
        Webfield2.post('/notes/edits', editToPost, { handleErrors: false }).then(
          function (edit) {
            if (params.onNoteEdited) {
              if (params.isEdit) {
                params.onNoteEdited()
              } else {
                const constructedNote = {
                  ...edit.note,
                  invitations: [invitation.id],
                  details: { invitation, writable: true },
                }
                Webfield2.get(
                  '/notes',
                  { id: edit.note.id, details: 'invitation,presentation,writable' },
                  { handleErrors: false }
                ).then(
                  function (noteRes) {
                    params.onNoteEdited(
                      noteRes.notes?.length > 0 ? noteRes.notes[0] : constructedNote
                    )
                  },
                  function () {
                    params.onNoteEdited(constructedNote)
                  }
                )
              }
            }
            $noteEditor.remove()
            view.clearAutosaveData(autosaveStorageKeys)
          },
          function (jqXhr, textStatus) {
            var errorText = Webfield.getErrorFromJqXhr(jqXhr, textStatus)
            if (params.onError) {
              params.onError([errorText])
            } else {
              promptError(errorText)
            }
            $submitButton.prop({ disabled: false }).find('.spinner-small').remove()
            $cancelButton.prop({ disabled: false })
          }
        )
      }

      var $noteEditor = $('<div>', { class: 'note_editor existing panel' }).append(
        '<h2 class="note_content_title">Edit ' +
          view.prettyInvitationId(invitation.id) +
          '</h2>',
        '<div class="required_field">* denotes a required field</div>',
        '<hr class="small">',
        _.values($contentMap),
        noteReaders,
        noteSignatures,
        $('<div class="note_content_section">').append(
          '<h2>Edit History</h2>',
          '<hr class="small">',
          editReaders,
          editSignatures
        ),
        $('<div>', { class: 'row' }).append($submitButton, $cancelButton)
      )
      $noteEditor.data('invitationId', invitation.id)

      view.autolinkFieldDescriptions($noteEditor)
      var autosaveStorageKeys = view.setupAutosaveHandlers(
        $noteEditor,
        user,
        note.id,
        invitation.id
      )

      if (params.onCompleted) {
        params.onCompleted($noteEditor)
      }
    }

    try {
      const editReaders = await buildEditReaders(invitation.edit?.readers, null)
      const editSignatures = await buildSignatures(
        invitation.edit?.signatures,
        null,
        user,
        'signatures'
      )

      const parentId = note.forum === note.replyto ? null : note.replyto
      let noteReaders = null
      await buildNoteReaders(
        invitation.edit.note.readers,
        note.readers ?? [],
        parentId,
        (result, error) => {
          if (error) {
            if (params.onError) {
              params.onError([error])
            } else {
              promptError(error)
            }
          }
          noteReaders = result
        }
      )
      const noteSignatures = await buildSignatures(
        invitation.edit?.note?.signatures,
        null,
        user,
        'signatures'
      )
      buildEditor(editReaders, editSignatures, noteReaders, noteSignatures)
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(error)

      if (params.onError) {
        params.onError([error])
      } else {
        promptError(error)
      }
    }
  }

  const orderCache = {}
  const order = (invitationEditNoteContent, invitationId) => {
    if (invitationId && orderCache[invitationId]) {
      return orderCache[invitationId]
    }

    var orderedFields = _.map(
      _.sortBy(
        _.map(invitationEditNoteContent, function (fieldProps, fieldName) {
          return {
            field: fieldName,
            order: fieldProps.order,
          }
        }),
        ['order']
      ),
      'field'
    )
    if (invitationId) {
      orderCache[invitationId] = orderedFields
    }
    return orderedFields
  }

  const constructEdit = ({ formData, noteObj, invitationObj }) => {
    const fieldsToIgnoreConst = ['authors', 'authorids']
    if (!invitationObj.edit) return undefined
    const result = {}
    const note = {}
    const content = {}
    const editContent = {}
    const { note: noteFields, ...otherFields } = invitationObj.edit

    // editToPost.readers/writers etc.
    Object.entries(otherFields).forEach(([field, value]) => {
      if (!_.has(value, 'param')) return
      switch (field) {
        case 'readers':
          result[field] = formData?.editReaderValues ?? noteObj?.[field]
          break
        case 'writers':
          result[field] = formData?.editWriterValues ?? noteObj?.[field]
          break
        case 'signatures':
          result[field] = formData?.editSignatureInputValues
          break
        case 'ddate':
          break
        default:
          // readers/writers/signatures collected in editor default to note readers/writers/signatures
          result[field] = formData?.[field] ?? noteObj?.[field]
          break
      }
    })

    // editToPost.edit.content fields
    Object.entries(otherFields.content ?? {}).forEach(
      ([editContentFieldName, editContentFieldValue]) => {
        if (!editContentFieldValue.value.param) return
        if (editContentFieldValue.value.param.const !== undefined) {
          editContent[editContentFieldName] = {
            value: editContentFieldValue.value.param.const,
          }
          return
        }
        var newVal = formData?.editContent?.[editContentFieldName]
        if (
          typeof newVal === 'string' &&
          (editContentFieldValue.value.param.input === 'text' ||
            editContentFieldValue.value.param.input === 'textarea' ||
            (editContentFieldValue.value.param.type === 'string' &&
              !editContentFieldValue.value.param.enum))
        ) {
          newVal = newVal?.trim()
        }
        editContent[editContentFieldName] = {
          value: newVal,
        }
      }
    )

    const { content: contentFields, ...otherNoteFields } = noteFields

    // editToPost.note.id/ddate/reader/writers etc.
    Object.entries(otherNoteFields).forEach(([otherNoteField, value]) => {
      if (!_.has(value, 'param')) return
      switch (otherNoteField) {
        case 'readers':
          note[otherNoteField] = formData?.noteReaderValues ?? noteObj?.[otherNoteField]
          break
        case 'signatures':
          note[otherNoteField] =
            formData?.noteSignatureInputValues ?? noteObj?.[otherNoteField]
          break
        case 'license':
          note[otherNoteField] = formData?.noteLicenseValue ?? noteObj?.[otherNoteField]
          break
        case 'cdate':
          note[otherNoteField] = formData?.noteCDateValue ?? noteObj?.[otherNoteField]
          break
        case 'mdate':
          note[otherNoteField] = formData?.noteMDateValue ?? noteObj?.[otherNoteField]
          break
        case 'pdate':
          note[otherNoteField] = formData?.notePDateValue ?? noteObj?.[otherNoteField]
          break
        default:
          note[otherNoteField] = formData?.[otherNoteField] ?? noteObj?.[otherNoteField]
          break
      }
    })

    // content fields
    Object.entries(contentFields || []).forEach(([contentFieldName, contentFieldValue]) => {
      if (
        (formData?.[contentFieldName] === undefined ||
          formData?.[contentFieldName]?.delete === true) &&
        noteObj?.content?.[contentFieldName]?.value === undefined
      ) {
        // do not return field
        return
      }

      var valueObj = contentFieldValue.value
      if (valueObj) {
        const shouldKeepConstValue = fieldsToIgnoreConst.includes(contentFieldName)
        if (
          (!shouldKeepConstValue && (!_.has(valueObj, 'param') || valueObj.param.const)) ||
          (shouldKeepConstValue && valueObj.param?.const?.replace)
        ) {
          return
        } else {
          var newVal = formData?.[contentFieldName]
          if (
            typeof newVal === 'string' &&
            (valueObj.param?.input === 'text' ||
              valueObj.param?.input === 'textarea' ||
              (valueObj.param?.type === 'string' && !valueObj.param?.enum))
          ) {
            newVal = newVal?.trim()
          }
          content[contentFieldName] = {
            value: newVal ?? noteObj?.content?.[contentFieldName]?.value,
          }
        }
      }

      var fieldReader = contentFieldValue.readers
      if (fieldReader?.param && !fieldReader.param.const) {
        content[contentFieldName].readers = noteObj?.content?.[contentFieldName]?.readers
      }
    })

    result.invitation = invitationObj.id
    if (Object.keys(content).length) note.content = content
    if (Object.keys(note).length) result.note = note
    if (Object.keys(editContent).length) result.content = editContent
    return result
  }

  const constructUpdatedEdit = (edit, invitation, formContent) => {
    const shouldSetValue = (fieldPath) => {
      const field = _.get(invitation, fieldPath)
      return field && field.param && !field.param.const
    }

    const editToPost = {}
    Object.keys(invitation.edit).forEach((p) => {
      if (shouldSetValue(`edit.${p}`) && edit[p]) {
        editToPost[p] = edit[p]
      }
    })
    editToPost.id = edit.id
    editToPost.invitation = edit.invitation
    if (shouldSetValue('edit.readers')) {
      editToPost.readers = formContent.editReaderValues ?? edit.readers
    }
    if (shouldSetValue('edit.signatures')) {
      editToPost.signatures = formContent.editSignatureInputValues ?? edit.signatures
    }

    const editContent = {}
    Object.keys(invitation.edit.content ?? {}).forEach((editContentFieldName) => {
      if (shouldSetValue(`edit.content.${editContentFieldName}.value`)) {
        editContent[editContentFieldName] = {
          value: formContent.editContent?.[editContentFieldName],
        }
      }
    })

    if (Object.keys(editContent).length) editToPost.content = editContent

    const editNote = {}
    Object.keys(invitation.edit.note).forEach((p) => {
      if (shouldSetValue(`edit.note.${p}`)) {
        switch (p) {
          case 'license':
            editNote[p] = formContent.noteLicenseValue ?? edit.note[p]
            break
          case 'cdate':
            editNote[p] = formContent.noteCDateValue ?? edit.note[p]
            break
          case 'pdate':
            editNote[p] = formContent.notePDateValue ?? edit.note[p]
            break
          default:
            editNote[p] = edit.note[p]
            break
        }
      }
    })

    if (invitation.edit.note?.content) {
      editNote.content = {}
      Object.keys(invitation.edit.note.content).forEach((fieldName) => {
        if (formContent[fieldName] === undefined) {
          if (shouldSetValue(`edit.note.content.${fieldName}.readers`)) {
            editNote.content[fieldName] = {
              readers: edit.note.content[fieldName].readers,
            }
          }
          return
        }
        editNote.content[fieldName] = {
          value: formContent[fieldName],
          ...(shouldSetValue(`edit.note.content.${fieldName}.readers`) && {
            readers: edit.note.content[fieldName].readers,
          }),
        }
      })
    }
    editToPost.note = editNote

    return editToPost
  }

  const validate = (invitation, formContent, readersWidget) => {
    const errorList = []
    const invitationEditContent = invitation.edit?.note?.content

    Object.keys(invitationEditContent).forEach(function (fieldName) {
      if (fieldName === 'pdf' && !invitationEditContent.pdf.value.param?.optional) {
        if (
          formContent.pdf &&
          !_.endsWith(formContent.pdf, '.pdf') &&
          !_.startsWith(formContent.pdf, '/pdf') &&
          !_.startsWith(formContent.pdf, 'http')
        ) {
          errorList.push('Uploaded file must have .pdf extension')
        }

        if (!formContent.pdf) {
          errorList.push('You must provide a PDF (file upload)')
        }
      }
      if (
        invitationEditContent[fieldName].value &&
        !invitationEditContent[fieldName].value.param?.optional &&
        _.isEmpty(formContent[fieldName])
      ) {
        errorList.push('Field missing: ' + view.prettyField(fieldName))
      }

      // authors search has pending results to be added
      if (fieldName === 'authorids' && $('div.search-results>div.author-row').length) {
        errorList.push('You have additional authors to be added to authors list')
      }
    })

    if (invitation.edit?.note?.readers?.hasOwnProperty('enum')) {
      var inputValues = view.idsFromListAdder(readersWidget, invitation.edit.note.readers)
      if (!inputValues.length) {
        errorList.push('Readers can not be empty. You must select at least one reader')
      }
    }

    return errorList
  }

  var getContent = function (invitation, $contentMap, noteEditObj) {
    var files = {}
    var errors = []
    var invitationContent = invitation.edit.note.content
    var content = _.reduce(
      invitationContent,
      function (ret, contentObjInInvitation, k) {
        // Let the widget handle it :D and extract the data when we encouter authorids
        const contentObj = contentObjInInvitation.value
        if (!contentObj && contentObjInInvitation.readers) return ret
        const presentationObj = contentObjInInvitation.value.param || {}
        if (presentationObj.hidden && k === 'authors') {
          return ret
        }
        var $inputVal = $contentMap[k].find('.note_content_value[name="' + k + '"]')
        var inputVal = $inputVal.val()

        if (
          k === 'authorids' &&
          ((contentObj.param?.hasOwnProperty('regex') &&
            view.isTildeIdAllowed(contentObj.param.regex)) ||
            Array.isArray(contentObj))
        ) {
          ret.authorids = []
          ret.authors = []
          $contentMap.authorids.find('.author-row').each(function () {
            var authoridStored = $(this).find('.author-fullname>a').data('tildeid')
            var authorid = authoridStored ?? $(this).find('.author-fullname').text() // text() may add extra space
            // If it does the field .author-fullname does not start with a tilde
            // it means that the name was user defined and should be placed in the authors field
            // Also the authorid would be the email
            if (!_.startsWith(authorid, '~')) {
              ret.authors.push(authorid)
              authorid = $(this).find('.author-emails').text()
            } else {
              ret.authors.push(view.prettyId(authorid))
            }
            ret.authorids.push(authorid)
          })
          return ret
        } else if (contentObj.param?.hasOwnProperty('enum')) {
          // value-radio
          if (presentationObj.input === 'radio') {
            var $selection = $contentMap[k].find(
              '.note_content_value input[type="radio"]:checked'
            )
            inputVal = $selection.length ? $selection.val() : ''
          } else if (presentationObj.input === 'checkbox') {
            // values-checkbox
            if (presentationObj.type.endsWith('[]')) {
              inputVal = []
              $contentMap[k]
                .find('.note_content_value input[type="checkbox"]')
                .each(function (i) {
                  if ($(this).prop('checked')) {
                    inputVal.push($(this).val())
                  }
                })
            } else {
              // value-checkbox
              inputVal = $contentMap[k]
                .find('.note_content_value input[type="checkbox"]')
                .prop('checked')
                ? contentObj.param.enum[0]
                : ''
            }
          } else if (presentationObj.input === 'select' || !_.has(presentationObj, 'input')) {
            // values-dropdown
            if (presentationObj.type.endsWith('[]')) {
              inputVal = view.idsFromListAdder($contentMap[k], ret)
            } else {
              // value-dropdown
              var values = view.idsFromListAdder($contentMap[k], ret)
              if (values?.length > 0) {
                inputVal = values[0]
              }
            }
          }
        } else if (
          Array.isArray(contentObj) ||
          (contentObj.param?.hasOwnProperty('const') && presentationObj.type?.endsWith('[]'))
        ) {
          // values
          if (k !== 'authorids') {
            inputVal = view.idsFromListAdder($contentMap[k], ret)
          }
        } else if (contentObj.param?.hasOwnProperty('regex')) {
          // values-regex
          if (presentationObj.type.endsWith('[]')) {
            var inputArray = inputVal.split(',')
            inputVal = _.filter(
              _.map(inputArray, function (s) {
                return s.trim()
              }),
              function (e) {
                return !_.isEmpty(e)
              }
            )
          }
        } else if (presentationObj.type === 'json') {
          if (inputVal) {
            var inputStr = _.map(inputVal.split('\n'), function (line) {
              return line.trim()
            }).join('')

            try {
              inputVal = JSON.parse(inputStr)
            } catch (error) {
              inputVal = null
              errors.push(
                'Field ' +
                  k +
                  ' contains invalid JSON. Please make sure all quotes and brackets match.'
              )
            }
          }
        } else if (presentationObj.type === 'file') {
          var $fileSection = $contentMap[k]
          var $fileInput =
            $fileSection &&
            $fileSection.find('input.note_' + k.replace(/\W/g, '.') + '[type="file"]')
          var file = $fileInput && $fileInput.val() ? $fileInput[0].files[0] : null

          // Check if there's a file. If the file has been removed by the
          // user set inputVal to and empty string. This is for revisions.
          if (file) {
            inputVal = file.name
            files[k] = file
          } else if ($inputVal.data('fileRemoved')) {
            ret[k] = ''
          }
        }

        if (noteEditObj) {
          var existingContent = noteEditObj.isEdit
            ? noteEditObj.edit.note.content[k]
            : noteEditObj.note.content[k]
          if (
            inputVal === '' &&
            existingContent?.value &&
            existingContent.value !== inputVal
          ) {
            ret[k] = null
          }
        }

        if (inputVal) {
          ret[k] = inputVal
        }

        return ret
      },
      {}
    )
    return [content, files, errors]
  }

  var getWriters = function (invitation, signatures, user) {
    var writers = invitation.edit ? invitation.edit.writers : invitation.reply.writers
    if (writers && Array.isArray(writers)) {
      return undefined
    }
    if (writers && _.has(writers, 'param') && _.has(writers.param, 'const')) {
      return undefined
    }

    if (writers && _.has(writers, 'param') && writers.param.regex === '~.*') {
      return [user.profile.id]
    }

    return signatures
  }

  var getReaders = function (widget, invitation, signatures, isEdit = false) {
    if (isEdit && Array.isArray(invitation.edit.readers)) {
      return undefined
    }
    if (Array.isArray(invitation.edit.note?.readers)) {
      return undefined
    }
    // eslint-disable-next-line no-nested-ternary
    var readers = invitation.edit
      ? isEdit
        ? invitation.edit.readers
        : invitation.edit.note?.readers
      : invitation.reply.readers
    var inputValues = view.idsFromListAdder(widget, readers)

    var invitationValues = []
    if (_.has(readers, 'param') && _.has(readers.param, 'enum')) {
      invitationValues = readers.param.enum.map(function (v) {
        return _.has(v, 'id') ? v.id : v
      })
    }

    // Add signature if exists in the invitation readers list
    if (signatures && signatures.length && !_.includes(inputValues, 'everyone')) {
      var signatureId = signatures[0]

      // Where the signature is an AnonReviewer and it is not selected in the readers value
      var index = Math.max(
        signatureId.indexOf('AnonReviewer'),
        signatureId.indexOf('Reviewer_')
      )
      if (index >= 0) {
        var reviewersSubmittedId = signatureId.slice(0, index).concat('Reviewers/Submitted')
        var reviewersId = signatureId.slice(0, index).concat('Reviewers')

        if (
          _.isEmpty(
            _.intersection(inputValues, [signatureId, reviewersSubmittedId, reviewersId])
          )
        ) {
          if (_.includes(invitationValues, signatureId)) {
            inputValues.push(signatureId)
          } else if (_.includes(invitationValues, reviewersSubmittedId)) {
            inputValues = _.union(inputValues, [reviewersSubmittedId])
          } else if (_.includes(invitationValues, reviewersId)) {
            inputValues = _.union(inputValues, [reviewersId])
          }
        }
      } else {
        var acIndex = Math.max(
          signatureId.indexOf('Area_Chair1'),
          signatureId.indexOf('Area_Chair_')
        )
        if (acIndex >= 0) {
          signatureId = signatureId.slice(0, acIndex).concat('Area_Chairs')
        }

        if (_.includes(invitationValues, signatureId)) {
          inputValues = _.union(inputValues, [signatureId])
        }
      }
    }

    return inputValues
  }

  return {
    mkNewNoteEditor: mkNewNoteEditor,
    mkNoteEditor: mkNoteEditor,
    mkNotePanel: mkNotePanel,
    deleteOrRestoreNote: deleteOrRestoreNote,
    constructEdit: constructEdit,
    constructUpdatedEdit: constructUpdatedEdit,
  }
})()
