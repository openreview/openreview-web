/* globals $, jQuery, _: false */
/* globals view, Webfield: false */
/* globals promptError, typesetMathJax: false */
/* globals marked, DOMPurify, MathJax, Handlebars, nanoid: false */

// eslint-disable-next-line wrap-iife
module.exports = (function () {
  var mkDropdown = function (
    placeholder,
    readonly,
    selectedValue,
    onOptionsChanged,
    onSelectedChanged,
    extraClasses
  ) {
    extraClasses = extraClasses || ''
    var value = selectedValue
    var valueId = selectedValue
    if (selectedValue && _.isObject(selectedValue)) {
      value = selectedValue.description
      valueId = selectedValue.id
    }

    var inputParams = {
      readonly: readonly || false,
      placeholder: placeholder,
      class: 'form-control',
      value: value,
      value_id: valueId, // eslint-disable-line
    }

    var $dropdown = $('<div>', { class: 'dropdown ' + extraClasses }).append(
      $('<input>', inputParams),
      $('<div>', { class: 'dropdown_content' }).hide()
    )

    var $input = $dropdown.find('input')
    $input.attr('autocomplete', 'off')
    if (onOptionsChanged) {
      $input.click(function () {
        onOptionsChanged(update, '')
      })

      $input.keydown(function (e) {
        if (e.keyCode === 40) {
          var $first = $dropdown.find('.dropdown_content').find('div').first()
          $first.focus()
          return false
        }
      })

      if (!readonly) {
        $input.keyup(function () {
          onOptionsChanged(update, $input.val(), $input.attr('value_id'))
        })

        $input.focusout(function () {
          if (onSelectedChanged) {
            onSelectedChanged($input.val(), $input.attr('value_id'), true)
          }
        })
      }
    }

    var update = function (vs) {
      $('.dropdown > .dropdown_content').empty().hide()

      var values = _.map(vs, function (value) {
        return _.isString(value) ? { id: value, description: prettyId(value) || value } : value
      })
      if (!values.length) {
        return
      }

      var $content = $dropdown.children('.dropdown_content')
      $content.append(
        _.map(values, function (v) {
          return $('<div>', { text: v.description, tabindex: '0' })
            .click(function () {
              $input.val(v.description)
              $input.attr('value_id', v.id)
              $content.hide()
              $content.empty()
              if (onSelectedChanged) {
                onSelectedChanged(v.description, v.id)
              }
            })
            .keydown(function (e) {
              if (e.keyCode === 13) {
                $input.val(v.description)
                $input.attr('value_id', v.id)
                $content.hide()
                $content.empty()
                if (onSelectedChanged) {
                  onSelectedChanged(v.description, v.id)
                }
              }
            })
            .focus(function (e) {
              var $this = $(this)
              $this.addClass('active').siblings().removeClass()
              if (!readonly && onSelectedChanged) {
                onSelectedChanged(v.description, v.id, true)
              }
            })
        })
      )

      $content.on('keydown', 'div', function (e) {
        var $this = $(this)
        if (e.keyCode === 40) {
          $this.next().focus()
          return false
        } else if (e.keyCode === 38) {
          if ($this.index() === 0) {
            $input.focus()
          } else {
            $this.prev().focus()
          }
          return false
        }
      })

      $content.show()
    }

    return $dropdown
  }

  var mkTagInput = function (fieldName, fieldDescription, fieldValue, params) {
    var tag
    var widgetOptions

    if (fieldDescription) {
      if (_.has(fieldDescription, 'value-dropdown')) {
        tag = {
          id: fieldValue.length && fieldValue[0].id,
          options: fieldDescription['value-dropdown'],
          value: fieldValue.length && fieldValue[0].tag,
        }
        widgetOptions = {
          placeholder: fieldDescription.default || params.placeholder,
          label: params.label,
          onChange: params.onChange,
        }

        return mkSingleTagWidget(tag, widgetOptions)
      }

      if (_.has(fieldDescription, 'values-dropdown')) {
        tag = {
          id: 'values-dropdown' + params.forum,
          value: _.map(fieldValue, function (value) {
            return { id: value.id, tag: value.tag, name: prettyId(value.tag) }
          }),
        }
        widgetOptions = {
          placeholder: params.placeholder,
          onChange: params.onChange,
          values: fieldDescription['values-dropdown'],
        }

        return mkMultipleTagWidget(tag, widgetOptions)
      }

      if (_.has(fieldDescription, 'values-url')) {
        tag = {
          id: 'values-url' + params.forum,
          optionsUrl: fieldDescription['values-url'],
          value: _.map(fieldValue, function (value) {
            return { id: value.id, tag: value.tag, name: prettyId(value.tag) }
          }),
        }
        widgetOptions = {
          placeholder: params.placeholder,
          onChange: params.onChange,
        }

        return mkMultipleTagWidget(tag, widgetOptions)
      }

      if (_.has(fieldDescription, 'value-regex')) {
        tag = {
          id: fieldValue.length && fieldValue[0].id,
          type: 'text',
          value: fieldValue.length && fieldValue[0].tag,
        }
        widgetOptions = {
          placeholder: params.placeholder,
          label: params.placeholder,
          onChange: params.onChange,
          readonly: false,
        }

        return mkFreeTextTagWidget(tag, widgetOptions)
      }

      if (_.has(fieldDescription, 'value-radio') && fieldValue.length) {
        tag = {
          id: fieldValue[0].id,
          type: 'text',
          value: fieldValue[0].tag,
        }
        widgetOptions = {
          placeholder: params.placeholder,
          label: freeTextTagWidgetLabel(fieldValue[0].invitation, fieldValue[0].signatures),
          onChange: params.onChange,
          readonly: params.readOnly,
        }

        return mkFreeTextTagWidget(tag, widgetOptions)
      }
    } else {
      var signature = fieldValue.length && fieldValue[0].signatures
      tag = {
        id: 'values-text' + params.forum,
        type: 'text',
        value: _.map(fieldValue, function (value) {
          return prettyId(value.tag)
        }).join(', '),
      }
      widgetOptions = {
        placeholder: params.placeholder,
        label: params.label || freeTextTagWidgetLabel(fieldValue[0].invitation, signature),
        onChange: params.onChange,
        readonly: true,
      }

      return mkFreeTextTagWidget(tag, widgetOptions)
    }

    return null
  }

  var mkSingleTagWidget = function (tag, options) {
    var defaults = {
      placeholder: '',
      readOnly: false,
      onChange: null,
    }
    options = _.assign(defaults, options)

    var templateFunc = Handlebars.templates.tagWidget_bid // jshint ignore:line
    var $widget = $(templateFunc({ tag: tag, options: options }))

    $('.dropdown-menu li a', $widget).click(function () {
      var newValue = $(this).text()
      $('button.dropdown-toggle .bid-value', $widget).text(newValue)
      $('button.dropdown-toggle', $widget).click()
      $widget.removeClass('incomplete')

      if (options.onChange) {
        options.onChange($widget.data('id'), newValue, false, function (savedTag) {
          $widget.data('id', savedTag.id)
        })
      }
      return false
    })

    return $widget
  }

  var mkMultipleTagWidget = function (tag, options) {
    var defaults = {
      placeholder: '',
      readOnly: false,
      onChange: null,
      values: [],
    }
    options = _.assign(defaults, options)

    var templateFunc = Handlebars.templates.tagWidget_recommend // jshint ignore:line
    var $widget = $(templateFunc({ tag: tag, options: options }))
    var values = options.values.map(function (v) {
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

    var $reviewerDropdown = mkDropdown(
      options.placeholder,
      false,
      {},
      function (update, prefix) {
        if (values.length) {
          update(filteredOptions(values, prefix))
        } else {
          Webfield.get(tag.optionsUrl, {}).then(function (result) {
            var group = result.groups[0]
            values = _.map(group.members, function (member) {
              return { id: member, description: prettyId(member) }
            })
            update(filteredOptions(values, prefix))
          })
        }
      },
      function (value, id, focusOut) {
        if (!focusOut) {
          $('.dropdown-container', $widget).before(
            '<span class="selected-reviewer" data-tag="' +
              id +
              '">' +
              value +
              ' <a href="#" title="Delete recommendation"><span class="glyphicon glyphicon-remove" aria-hidden="true"></span></a>' +
              '</span>'
          )
          $('.dropdown input', $widget).val('').focus()

          if (options.onChange) {
            options.onChange(undefined, id, false, function (savedTag) {
              $('.selected-reviewer', $widget).last().data('id', savedTag.id)
            })
          }
        }
      }
    )
    $('.dropdown-container', $widget).append($reviewerDropdown)

    // Add Reviewer
    $widget.on('click', '.show-reviewer-dropdown', function () {
      $('.dropdown-container', $widget).show()
      $(this).hide()
      $('.hide-reviewer-dropdown', $widget).show()
      return false
    })

    // Remove Reviewer
    $widget.on('click', '.selected-reviewer a', function () {
      $(this)
        .parent()
        .fadeOut('fast', function () {
          $(this).remove()
        })

      if (options.onChange) {
        var deletedId = $(this).parent().data('id')
        var deletedValue = $(this).parent().data('tag')
        options.onChange(deletedId, deletedValue, true, function () {})
      }
      return false
    })

    // Done Adding
    $widget.on('click', '.hide-reviewer-dropdown', function () {
      $('.dropdown-container', $widget).hide()
      $(this).hide()
      $('.show-reviewer-dropdown', $widget).show()
      return false
    })

    return $widget
  }

  var mkFreeTextTagWidget = function (tag, options) {
    var defaults = {
      placeholder: '',
      readOnly: false,
      onChange: null,
    }
    options = _.assign(defaults, options)

    var templateFunc = Handlebars.templates.tagWidget_text // jshint ignore:line
    var $widget = $(templateFunc({ tag: tag, options: options }))

    // Text tag widget
    var eventHandler = function () {
      var buttonText = $('.toggle-edit-value', $widget).text() === 'Edit' ? 'Save' : 'Edit'
      $('.toggle-edit-value', $widget).text(buttonText)
      $('.current-value', $widget).toggle()
      $('.new-value', $widget).toggle()

      if (buttonText === 'Edit') {
        var newVal = $('.new-value', $widget).val()
        $('.current-value', $widget).text(newVal)

        if (options.onChange) {
          options.onChange($widget.data('id'), newVal, false, function (savedTag) {
            $widget.data('id', savedTag.id)
          })
        }
      }

      return false
    }

    if (!options.readonly) {
      $widget.on('click', '.toggle-edit-value', eventHandler)
      $widget.on('submit', 'form', eventHandler)
    } else {
      $('.toggle-edit-value', $widget).hide()
    }

    return $widget
  }

  var freeTextTagWidgetLabel = function (invitation, signatures) {
    var label
    var invitationGroup = invitation.split('/-/')[0]

    if (signatures.length) {
      if (invitationGroup && invitationGroup === signatures[0]) {
        label = prettyId(signatures[0])
      } else {
        label = prettyId(invitation) + ' ' + prettyId(signatures[0], true)
      }
    } else {
      label = prettyId(invitation)
    }
    return label
  }

  var mkRemovableItem = function (text, id) {
    return $('<span>', { class: 'removable_item' }).append(
      $('<span>', { class: 'removable_item_content', text: text, value_id: id }), // eslint-disable-line
      $('<span>', { class: 'removable_item_button glyphicon glyphicon-remove-circle' }).click(
        function () {
          $(this)
            .closest('.list_adder_list')
            .next()
            .find('.dropdown > input')
            .prop('disabled', false)
          $(this).parent().remove()
        }
      )
    )
  }

  var mkItemsWithDropdownAdder = function (
    name,
    permList,
    initialList,
    hoverText,
    onOptionsChanged,
    onSelectedChanged
  ) {
    var readonly = false
    var $dropdown = null
    if (onOptionsChanged) {
      $dropdown = mkDropdown(
        name,
        readonly,
        undefined,
        onOptionsChanged,
        function (description, id, fromFocus) {
          if (onSelectedChanged(description, id) && !fromFocus) {
            var $item = hoverText
              ? mkHoverItem(description, id, true)
              : mkRemovableItem(description, id)
            $list.append($item)

            var $input = $dropdown.children('input')
            if ($input.length) {
              $input.val('')
            }
          }
        }
      )
    }

    var $list = $('<div>', { class: 'list_adder_list' })
      .append(
        _.map(
          _.differenceWith(permList, initialList, function (superSetElement, subSetElement) {
            // musthavevalue from invitation will have disable property so compare only id.
            return superSetElement.id === subSetElement.id
          }),
          function (value) {
            return hoverText
              ? mkHoverItem(value.description, value.id)
              : mkItem(value.description)
          }
        )
      )
      .append(
        _.map(initialList, function (value) {
          if (hoverText) {
            return mkHoverItem(value.description, value.id)
          } else if (value.disable) {
            // disabled removableitem
            var removableItem = mkRemovableItem(value.description, value.id)
            removableItem
              .addClass('disabled')
              .children('.removable_item_button')
              .addClass('disabled')
            return removableItem
          } else {
            return mkRemovableItem(value.description, value.id) // normal(enabled) removeableitem
          }
        })
      )

    return [$list, $('<div>', { class: 'list_adder' }).append($dropdown)]
  }

  var mkDropdownAdder = function (fieldName, fieldDescription, values, fieldValue, params) {
    var $dropdown = $('<div>', { class: 'row' })
    var $hoveritem = mkHoverItem(
      $('<span>', { text: prettyField(fieldName), class: 'line_heading' }),
      fieldDescription,
      false,
      true,
      params.required
    )
    $dropdown.append($hoveritem)

    var dropdownOptions = _.map(values, function (value) {
      if (value.id && value.description) {
        return value
      }

      return {
        id: value,
        description: prettyId(value),
      }
    })

    var alwaysHaveValues = _.map(params.alwaysHaveValues, function (value) {
      if (value.id && value.description) {
        return value
      }

      return {
        id: value,
        description: prettyId(value),
        disable: true,
      }
    })

    var differenceOptions = dropdownOptions

    var filterIds = function (ids, selected) {
      var selectedValues = []
      var nonSelectedValues = []

      _.forEach(dropdownOptions, function (option) {
        if (_.includes(ids, option.id)) {
          selectedValues.push(option)
        } else {
          nonSelectedValues.push(option)
        }
      })

      if (selected) {
        // add musthavevalues
        _.forEachRight(alwaysHaveValues, function (alwaysHaveValue) {
          if (
            selectedValues.find(function (selectedValue) {
              // alwayshavevalue is already selected
              return selectedValue.id === alwaysHaveValue.id
            })
          ) {
            selectedValues = selectedValues.filter(function (selectedValue) {
              // remove it
              return selectedValue.id !== alwaysHaveValue.id
            })
          }
          selectedValues.unshift(alwaysHaveValue) // and add to front
        })
      }

      return selected ? selectedValues : nonSelectedValues
    }

    var refreshData = function (update, term) {
      var filterOptions = function (options, term) {
        return _.filter(options, function (p) {
          return _.includes(p.description.toLowerCase(), term.toLowerCase())
        })
      }

      var ids = idsFromListAdder($dropdown, fieldDescription)
      differenceOptions = filterIds(ids)
      update(filterOptions(differenceOptions, term))
    }

    var onSelectionChanged = function (value, id) {
      var selectedOption = _.find(differenceOptions, ['id', id])
      var $input = $dropdown.find('input')

      if (!(selectedOption && selectedOption.description === value)) {
        $input.val('')
        $input.attr('value_id', '')
        return false
      } else {
        $input.val(value)
        $input.attr('value_id', id)
        if (differenceOptions.length === 1) {
          $input.prop('disabled', true)
        }
        return true
      }
    }

    var variousOptions = params.refreshData && dropdownOptions.length > 1
    var data = variousOptions ? [] : dropdownOptions
    var onOptionsChanged = variousOptions ? refreshData : undefined
    var hoverText = params.hoverText || !variousOptions
    var selectedValues = filterIds(fieldValue || [], true)
    $dropdown.append(
      mkItemsWithDropdownAdder(
        fieldName,
        data,
        selectedValues,
        hoverText,
        onOptionsChanged,
        onSelectionChanged
      )
    )
    if (selectedValues.length === dropdownOptions.length) {
      $dropdown.find('input').prop('disabled', true)
    }
    return $dropdown
  }

  var mkHoverItem = function (content, resultText, removable, title, required) {
    var cssClass = title ? 'hover_title' : 'hover_item'
    var $hoverItem = $('<div>', {
      class: cssClass + (removable ? ' removable_item' : ''),
      translate: 'no',
    })
    if (_.isString(resultText) && resultText.length > 0) {
      if (resultText.includes('/number}')) {
        resultText =
          '"number" will be replaced with the paper number after the submission has been completed.'
      } else if (resultText.includes('/signatures}')) {
        resultText = '"signatures" will be replaced with the edit signature shown below.'
      } else if (resultText.includes('/value}')) {
        const fieldName = resultText.split('/').slice(-2)[0]
        resultText =
          '"' + fieldName + '" will be replaced with the value of the field ' + fieldName
      }
      var $hoverResult = $('<div>', { class: 'hover_result' }).text(resultText).hide()
      $hoverItem.append($hoverResult).hover(
        function () {
          $hoverResult.show()
        },
        function () {
          $hoverResult.hide()
        }
      )
    }

    // Add formatting to $ notation content
    if (_.isString(content)) {
      content = content.replace(/\{(\S+)\}/g, '<em>$1</em>') // todo remove brackets
    }
    var $hoverTarget = $('<div>', { class: 'hover_target', translate: 'no' }).append(content)

    if (required) {
      $hoverTarget.prepend($('<span>', { text: '*', class: 'required_field' }))
    }

    $hoverItem.append($hoverTarget)

    if (removable) {
      $hoverTarget.append(
        $('<span>', {
          class: 'removable_item_button glyphicon glyphicon-remove-circle',
        }).click(function () {
          $hoverItem.remove()
        })
      )
    }

    $hoverItem.append($hoverTarget)

    return $hoverItem
  }

  var idsFromListAdder = function ($adder, fieldDescription) {
    var ids = []
    if (!$adder) {
      return ids
    }
    $adder.find('.item').each(function () {
      ids.push($(this).text())
    })
    $adder.find('.removable_item_content').each(function () {
      ids.push($(this).attr('value_id'))
    })
    $adder.find('.list_adder_list .hover_result').each(function () {
      ids.push($(this).text())
    })
    $adder.find('.dropdown.note_content_value').each(function () {
      if (_.isEmpty($(this).val())) {
        return
      }

      var id = $(this).attr('value_id')
      if (_.has(fieldDescription, 'value-dropdown-hierarchy')) {
        var values = fieldDescription['value-dropdown-hierarchy']
        if (id === 'everyone') {
          ids.push(id)
        } else if (_.endsWith(id, 'Authors Only')) {
          var author = _.find(values, function (v) {
            return _.endsWith(v, 'Authors')
          })
          ids.push(author)
        } else {
          // Find the selected value in the field description
          var index = _.findIndex(values, function (v) {
            return _.startsWith(id, v.split('/').slice(-2).join(' '))
          })
          // Assign as a result the selected and subsequents values
          ids = values.slice(index)
        }
      } else {
        ids.push(id)
      }
    })
    return ids
  }

  var mkRemovablePair = function (k, v) {
    var $item = $('<span>', { class: 'removable_pair' }).append(
      $('<span>', { class: 'removable_pair_content' }).append(
        $('<span>', { class: 'removable_pair_key', text: k }),
        $('<span>', { text: ' = ' }),
        $('<span>', { class: 'removable_pair_val', text: v })
      ),
      $('<span>', { class: 'removable_pair_button glyphicon glyphicon-remove-circle' }).click(
        function () {
          $item.remove()
        }
      )
    )
    return $item
  }

  var mkMapAdder = function (name, initialMap) {
    var $keyInput = $('<input>', { type: 'text' })
    var $valInput = $('<input>', { type: 'text' })
    var $map = $('<div>', { class: 'map_adder' })

    $map.append(
      _.map(initialMap, function (v, k) {
        return mkRemovablePair(k, v)
      })
    )

    return mkSection(name, [
      $map,
      $('<div>', { class: 'map_adder' }).append(
        $keyInput,
        $valInput,
        $('<button class="btn map_adder_button">', { text: 'Add' }).click(function () {
          var $item = mkRemovablePair($keyInput.val(), $valInput.val())
          $map.append($item)
          $keyInput.val('')
          $valInput.val('')
        })
      ),
    ])
  }

  var mapFromMapAdder = function ($adder) {
    var kvs = Object.create(null)
    $adder.find('.removable_pair_content').each(function () {
      var $content = $(this)
      var k = $content.find('.removable_pair_key').first().text()
      var v = $content.find('.removable_pair_val').first().text()
      kvs[k] = v
    })
    return kvs
  }

  var mkInputSection = function (name, v, isPassword) {
    var $section = mkSection(
      name,
      $('<input>', {
        class: 'form-control input_section_input',
        name: name,
        type: isPassword ? 'password' : 'text',
        value: v || '',
      })
    )
    return $section
  }

  var valFromInputSection = function ($section) {
    return $section.find('input').val()
  }

  var mkProfileCard = function ($fullName, $emails, $title) {
    var $profileCard = $('<div>', { class: 'profile-card' })
    var $basicInformation = $('<div>', { class: 'basic-information' })
    $profileCard.append(
      $basicInformation.append(
        $('<div>', { class: 'author-fullname' }).append($fullName),
        $title ? $('<div>', { class: 'author-title' }).append($title) : null
      ),
      $('<div>', { class: 'author-emails' }).append($emails)
    )
    return $profileCard
  }

  var mkSearchProfile = function (authors, authorids, options) {
    var defaults = {
      allowUserDefined: true,
      allowAddRemove: true,
    }
    options = _.defaults(options, defaults)
    var $container = $('<div>', { class: 'search-profile' })
    var $authors = $('<div>', { class: 'submission-authors' })

    var createAuthorRow = function ($fullName, $emails, $title) {
      // Check if the current profileId is already in the author list
      var repeatedProfileId = false
      $authors.find('.author-fullname').each(function () {
        if ($(this).text() === $fullName.text()) {
          repeatedProfileId = true
        }
      })
      // Do not add the same author to the list
      if (repeatedProfileId) return null
      // Clear all the inputs after adding to the Author list
      $('.search-input').each(function () {
        $(this).val('')
      })
      if ($noResults) $noResults.hide()
      // Add row with buttons UP and REMOVE to control the order of authors
      // or to remove authors from the table
      var $row = $('<div>', { class: 'author-row' })
      var $upButton = $(
        '<button class="btn btn-xs"><span class="glyphicon glyphicon-arrow-up"></span></button>'
      ).on('click', function () {
        $row.insertBefore($row.prev())
      })
      var $deleteButton = $(
        '<button class="btn btn-xs"><span class="glyphicon glyphicon-minus"></span></button>'
      ).on('click', function () {
        $row.remove()
      })

      $row.append(
        mkProfileCard($fullName, $emails, $title),
        $('<div>', { class: 'profile-actions' }).append(
          $upButton,
          options.allowAddRemove ? $deleteButton : null
        )
      )
      return $row
    }

    var getPreferredName = function (profile, authorid, authorname) {
      var tildeId
      if (profile) {
        var nameObj = _.find(profile.content.names, 'preferred')
        tildeId = (nameObj && nameObj.username) || profile.id
      } else {
        tildeId = authorid
      }
      var setClass = function (className) {
        return function (match) {
          return '<span class="' + className + '">' + match + '</span>'
        }
      }
      if (tildeId.startsWith('~')) {
        return $('<a>', {
          href: '/profile?id=' + tildeId,
          target: '_blank',
          'data-tildeid': tildeId,
        }).append(
          tildeId
            .replace(/[^~_0-9]+/g, setClass('black'))
            .replace(/[~_0-9]+/g, setClass('light-gray'))
        )
      } else {
        return $('<a>', {
          href: '/profile?email=' + tildeId,
          class: 'black',
          target: '_blank',
        }).append(authorname)
      }
    }

    var getEmails = function (emails) {
      return $(
        emails
          .filter(Boolean)
          .map(function (email) {
            return '<span>' + email.toLowerCase() + '</span>'
          })
          .join(', ')
      )
    }

    var createAddButton = function ($fullName, $emails, title) {
      return $(
        '<button class="btn btn-xs"><span class="glyphicon glyphicon-plus"></span></button>'
      ).on('click', function () {
        $authors.append(createAuthorRow($fullName, $emails, title))
        $searchResults.empty()
      })
    }

    // If authors and authorids are passed, we prepopulate the table
    if (authors && authorids) {
      var tildeIds = []
      var emailIds = []
      for (var i = 0; i < authorids.length; i++) {
        if (_.startsWith(authorids[i], '~')) {
          tildeIds.push(authorids[i])
        } else if (_.includes(authorids[i], '@')) {
          emailIds.push(authorids[i])
        }
      }

      var tildeProfilesP = Webfield.post('/profiles/search', { ids: tildeIds })
      var emailProfilesP = Webfield.post('/profiles/search', { emails: emailIds })

      $.when(tildeProfilesP, emailProfilesP).then(function (tildeRes, emailRes) {
        var profiles = _.concat(tildeRes.profiles, emailRes.profiles)
        for (var i = 0; i < authors.length; i++) {
          var $spanFullname
          var $spanEmails
          var title = ''

          // eslint-disable-next-line no-loop-func
          var profile = _.find(profiles, function (profile) {
            if (profile.id === authorids[i]) {
              return true
            }
            if (
              _.startsWith(authorids[i], '~') &&
              _.find(profile.content.names, ['username', authorids[i]])
            ) {
              return true
            }
            return profile.email === authorids[i]
          })

          if (profile) {
            title = formatProfileContent(profile.content).title
            if (options.allowAddRemove) {
              $spanFullname = getPreferredName(profile)
              $spanEmails = getEmails(profile.content.emails)
            } else {
              // Authors are not editable, keep the original values
              $spanFullname = getPreferredName(null, authorids[i], authors[i])
              if (profile.email) {
                $spanEmails = getEmails([profile.email])
              } else {
                $spanEmails = getEmails(profile.content.emails)
              }
            }
          } else {
            $spanFullname = $('<span>' + authors[i] + '</span>')
            $spanEmails = getEmails([authorids[i]])
          }
          $authors.append(createAuthorRow($spanFullname, $spanEmails, title))
        }
      })
    }

    if (!options.allowAddRemove) {
      $container.append($authors)
      return $container
    }

    var createSearchResultRow = function (profile) {
      var $fullName = getPreferredName(profile)
      var $emails = getEmails(profile.content.emails)
      var formattedProfile = formatProfileContent(profile.content)
      var $addButton = createAddButton($fullName, $emails, formattedProfile.title)

      // Add row with ADD button to create a row in the Author list
      var $row = $('<div>', { class: 'author-row' })
      $row.append(
        mkProfileCard($fullName, $emails, formattedProfile.title),
        $('<div>', { class: 'profile-actions' }).append($addButton)
      )
      return $row
    }

    var $searchResults = $('<div>', { class: 'search-results' })

    var $noResults = $('<table>', { class: 'table' }).append(
      $('<tr>').append(
        "<td><span>No matching profiles found. Please enter the author's full name and email, then click the + button to add the author.</span></td>"
      )
    )
    $noResults.hide()

    var $firstNameSearch = $('<input>', {
      id: 'first-name-search',
      class: 'search-input form-control note-content-search',
      type: 'text',
      placeholder: 'Full name',
    })
    var $emailSearch = $('<input>', {
      id: 'email-search',
      class: 'search-input form-control note-content-search',
      type: 'text',
      placeholder: 'Email',
    })

    var addDirectly = function () {
      $(this).hide()
      var $fullName = $('<span>' + _.trim($firstNameSearch.val()) + '</span>')
      var $emails = $('<span>').append(_.trim($emailSearch.val()))
      $authors.append(createAuthorRow($fullName, $emails))
      $searchResults.empty()
    }

    var $addDirectlyButton = $(
      '<button id="add-directly" class="btn btn-xs"><span class="glyphicon glyphicon-plus"></span></button>'
    )
      .on('click', addDirectly)
      .hide()

    var $spinner = $(
      [
        '<div class="spinner-small spinner-search">',
        '<div class="rect1"></div><div class="rect2"></div>',
        '<div class="rect3"></div><div class="rect4"></div>',
        '</div>',
      ].join('\n')
    )
    // var $spinner = $(Handlebars.templates.spinner({extraClasses: 'spinner-inline'}));
    $spinner.addClass('invisible')

    var $searchInput = $('<div class="search-container">').append(
      $firstNameSearch,
      $emailSearch,
      $addDirectlyButton,
      $spinner
    )

    var handleResponses = function (namesResponse, emailResponse) {
      $spinner.addClass('invisible')
      $searchResults.empty()
      $noResults.hide()

      var response = namesResponse || emailResponse
      if (namesResponse && emailResponse) {
        var profiles = _.unionWith(
          emailResponse.profiles,
          namesResponse.profiles,
          function (emailProfile, nameProfile) {
            return emailProfile.id === nameProfile.id
          }
        )
        response = {
          count: profiles.length,
          profiles: profiles,
        }
      }
      // Only show Profiles that have an associated email
      var profilesWithEmails = _.filter(response.profiles, function (profile) {
        return profile.content.emails && profile.content.emails.length
      })
      if (profilesWithEmails.length) {
        profilesWithEmails.forEach(function (profile) {
          $searchResults.append(createSearchResultRow(profile))
        })
        $searchResults.append(
          $('<div>', { class: 'text-center' }).append(
            '<span class="hint">Click the + button of the profile you wish to add to the authors list</span>'
          )
        )
      } else if (options.allowUserDefined) {
        $noResults.show()
      }
      // No profiles were found using the email and now if the fields are valid, the user can add directly a person
      // with no Profile
      var email = _.trim($emailSearch.val())
      var fullName = _.trim($firstNameSearch.val())
      if (
        options.allowUserDefined &&
        emailResponse &&
        !emailResponse.count &&
        isValidEmail(email) &&
        isValidName(fullName)
      ) {
        $addDirectlyButton.show()
      }
    }

    var combinedSearch = function () {
      $addDirectlyButton.hide()
      var fullName = _.trim($firstNameSearch.val())
      var email = _.trim($emailSearch.val())

      var hasValidName = fullName && fullName.length > 2
      var hasValidEmail = email.length > 5 && email.indexOf('@') !== -1

      if (hasValidName || hasValidEmail) {
        $spinner.removeClass('invisible')
      }

      // If both the name and the email information are in the search, then we have to do two searches
      // Then we merge the responses by doing a union and prioritizing email results
      if (hasValidName && hasValidEmail) {
        Webfield.get('/profiles/search', { term: email }).then(function (emailResponse) {
          Webfield.get('/profiles/search', { fullname: fullName, es: true }).then(
            function (namesResponse) {
              handleResponses(namesResponse, emailResponse)
            }
          )
        })
      } else if (hasValidEmail) {
        Webfield.get('/profiles/search', { term: email }).then(function (emailResponse) {
          handleResponses(null, emailResponse)
        })
      } else if (hasValidName) {
        Webfield.get('/profiles/search', { fullname: fullName, es: true }).then(
          function (namesResponse) {
            handleResponses(namesResponse, null)
          }
        )
      }
    }

    var clearSearchWhenEmpty = function () {
      var fullName = _.trim($firstNameSearch.val())
      var email = _.trim($emailSearch.val())

      if (!fullName && !email) {
        $searchResults.empty()
      }
    }

    var debounceSearch = _.debounce(combinedSearch, 300)

    $firstNameSearch.on('input', function () {
      clearSearchWhenEmpty()
      debounceSearch()
    })
    $emailSearch.on('input', function () {
      clearSearchWhenEmpty()
      // Lower case email always
      $(this).val($(this).val().toLowerCase())
      debounceSearch()
    })

    $container.append($authors, $searchInput, $searchResults, $noResults)

    return $container
  }

  var valueInput = function (contentInput, fieldName, fieldDescription) {
    var $smallHeading = $('<div>', { text: prettyField(fieldName), class: 'small_heading' })
    if (fieldDescription.required) {
      $smallHeading.prepend('<span class="required_field">*</span>')
    }

    var $description
    if (fieldDescription.scroll) {
      $description = $('<textarea class="form-control scroll-box" readonly>').text(
        fieldDescription.description
      )
    } else {
      $description = $('<div class="hint disable-tex-rendering">').text(
        fieldDescription.description
      )
    }

    var $row = $('<div>', { class: 'row' }).append($smallHeading, $description, contentInput)

    return $row
  }

  var markdownInput = function ($contentInput, fieldName, fieldDescription) {
    var $smallHeading = $('<div>', { text: prettyField(fieldName), class: 'small_heading' })
    if (fieldDescription.required) {
      $smallHeading.prepend('<span class="required_field">*</span>')
    }

    var $description
    if (fieldDescription.scroll) {
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

    var uniqueId = Math.floor(Math.random() * 1000)
    var $markDownWithPreviewTabs = $(
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

    var $row = $('<div>', { class: 'row' }).append(
      $smallHeading,
      $description,
      $markDownWithPreviewTabs
    )

    $('#markdown-preview-tab-' + uniqueId, $row).on('shown.bs.tab', function (e) {
      var id = $(e.relatedTarget).attr('href')
      var newTabId = $(e.target).attr('href')
      var markdownContent = $(id).children().eq(0).val()
      if (markdownContent) {
        $(newTabId)[0].innerHTML =
          '<div class="note_content_value markdown-rendered">' +
          DOMPurify.sanitize(marked(markdownContent)) +
          '</div>'
        setTimeout(function () {
          MathJax.typesetPromise()
        }, 100)
      } else {
        $(newTabId).text('Nothing to preview')
      }
    })

    return $row
  }

  var mkComposerContentInput = function (fieldName, fieldDescription, fieldValue, params) {
    var contentInputResult = null

    var mkCharCouterWidget = function ($input, minChars, maxChars) {
      var $widget = $('<div>', { class: 'char-counter hint' }).append(
        '<div class="pull-left" style="display:none;">Additional characters required: <span class="min-count">' +
          minChars +
          '</span></div>',
        '<div class="pull-left" style="display:none;">Characters remaining: <span class="max-count">' +
          maxChars +
          '</span></div>'
      )
      var $minCount = $widget.find('.min-count')
      var $maxCount = $widget.find('.max-count')
      var $divs = $widget.children()

      $input.on(
        'input',
        _.throttle(function () {
          // Remove extra white spaces at the beginning, at the end and in between words.
          var charsUsed = $input.val().trim().length
          var charsRequired = minChars - charsUsed
          var charsRemaining = maxChars - charsUsed
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

    var fieldDefault =
      params && params.useDefaults ? _.get(fieldDescription, 'default', '') : ''
    fieldValue = fieldValue || fieldDefault // These will always be mutually exclusive

    var $input
    if (_.has(fieldDescription, 'value')) {
      contentInputResult = valueInput(
        $('<input>', {
          type: 'text',
          class: 'form-control note_content_value',
          name: fieldName,
          value: fieldDescription.value,
          readonly: true,
        }),
        fieldName,
        fieldDescription
      )
    } else if (_.has(fieldDescription, 'values')) {
      contentInputResult = mkDropdownAdder(
        fieldName,
        fieldDescription.description,
        fieldDescription.values,
        fieldValue,
        { hoverText: true, refreshData: false, required: fieldDescription.required }
      )
    } else if (_.has(fieldDescription, 'value-regex')) {
      var $inputGroup
      // Create a new regex that doesn't include min and max length
      var regexStr = fieldDescription['value-regex']
      var re = new RegExp('^' + regexStr.replace(/\{\d+,\d+\}$/, '') + '$')
      var newlineMatch = '\n'.match(re)
      if (newlineMatch && newlineMatch.length) {
        $input = $('<textarea>', {
          class: 'note_content_value form-control',
          name: fieldName,
          text: fieldValue,
        })

        if (fieldDescription.markdown) {
          $inputGroup = markdownInput($input, fieldName, fieldDescription)
        } else {
          $inputGroup = valueInput($input, fieldName, fieldDescription)
        }

        var lenMatches = _.get(fieldDescription, 'value-regex', '').match(/\{(\d+),(\d+)\}$/)
        if (lenMatches) {
          var minLen = parseInt(lenMatches[1], 10)
          var maxLen = parseInt(lenMatches[2], 10)
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
      if (!_.get(fieldDescription, 'disableAutosave', false)) {
        $input.addClass('autosave-enabled')
      }
      contentInputResult = $inputGroup
    } else if (_.has(fieldDescription, 'values-regex')) {
      if (params && params.groups) {
        var groupIds = _.map(params.groups, function (g) {
          return g.id
        })
        contentInputResult = mkDropdownAdder(
          fieldName,
          fieldDescription.description,
          groupIds,
          fieldValue,
          { hoverText: false, refreshData: true, required: fieldDescription.required }
        )
      } else {
        $input = $('<input>', {
          type: 'text',
          class: 'form-control note_content_value',
          name: fieldName,
          value: fieldValue,
        })
        if (!_.get(fieldDescription, 'disableAutosave', false)) {
          $input.addClass('autosave-enabled')
        }
        contentInputResult = valueInput($input, fieldName, fieldDescription)
      }
    } else if (_.has(fieldDescription, 'value-dropdown')) {
      contentInputResult = mkDropdownList(
        fieldName,
        fieldDescription.description,
        fieldValue,
        fieldDescription['value-dropdown'],
        fieldDescription.required
      )
    } else if (_.has(fieldDescription, 'value-dropdown-hierarchy')) {
      var values = fieldDescription['value-dropdown-hierarchy']
      var formattedValues = []
      var formattedFieldValue = fieldValue && fieldValue.length && fieldValue[0]
      values.forEach(function (value, index) {
        var formattedValue = ''

        if (value === 'everyone') {
          formattedValue = value
        } else if (index === values.length - 1) {
          formattedValue = value.split('/').slice(-2).join(' ')
        } else {
          if (_.endsWith(value, 'Authors')) {
            formattedValue = value.split('/').slice(-2).join(' ') + ' Only'
            formattedValues.push(formattedValue)
          }
          formattedValue = value.split('/').slice(-2).join(' ') + ' and Higher'
        }

        formattedValues.push(formattedValue)
        if (value === formattedFieldValue) {
          formattedFieldValue = formattedValue
        }
      })

      contentInputResult = mkDropdownList(
        fieldName,
        fieldDescription.description,
        formattedFieldValue,
        formattedValues,
        fieldDescription.required
      )
    } else if (_.has(fieldDescription, 'values-dropdown')) {
      contentInputResult = mkDropdownAdder(
        fieldName,
        fieldDescription.description,
        fieldDescription['values-dropdown'],
        fieldValue,
        {
          hoverText: false,
          refreshData: true,
          required: fieldDescription.required,
          alwaysHaveValues: fieldDescription.default,
        }
      )
    } else if (_.has(fieldDescription, 'value-radio')) {
      $input = $('<div>', { class: 'note_content_value value-radio-container' }).append(
        _.map(fieldDescription['value-radio'], function (v) {
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
    } else if (
      _.has(fieldDescription, 'value-checkbox') ||
      _.has(fieldDescription, 'values-checkbox')
    ) {
      var options = _.has(fieldDescription, 'value-checkbox')
        ? [fieldDescription['value-checkbox']]
        : fieldDescription['values-checkbox']
      var checkedValues = _.isArray(fieldValue) ? fieldValue : [fieldValue]
      var requiredValues = fieldDescription.default

      var checkboxes = _.map(options, function (option) {
        var checked = _.includes(checkedValues, option) ? 'checked' : ''
        var disabled = _.includes(requiredValues, option) ? 'disabled' : ''
        return (
          '<label class="checkbox-inline">' +
          '<input type="checkbox" name="' +
          fieldName +
          '" value="' +
          _.escape(option) +
          '" ' +
          checked +
          ' ' +
          disabled +
          '> ' +
          (params.prettyId ? prettyId(option) : option) +
          '</label>'
        )
      })
      contentInputResult = valueInput(
        '<div class="note_content_value no-wrap">' + checkboxes.join('\n') + '</div>',
        fieldName,
        fieldDescription
      )
    } else if (
      _.has(fieldDescription, 'value-copied') ||
      _.has(fieldDescription, 'values-copied')
    ) {
      contentInputResult = valueInput(
        $('<input>', {
          type: 'hidden',
          class: 'note_content_value',
          name: fieldName,
          value: fieldDescription['value-copied'] || fieldDescription['values-copied'],
        }),
        fieldName,
        fieldDescription
      ).css('display', 'none')
    } else if (_.has(fieldDescription, 'value-dict')) {
      contentInputResult = valueInput(
        $('<textarea>', {
          class: 'note_content_value form-control',
          name: fieldName,
          text: fieldValue && JSON.stringify(fieldValue, undefined, 4),
        }),
        fieldName,
        fieldDescription
      )
    } else if (_.has(fieldDescription, 'value-file')) {
      contentInputResult = mkAttachmentSection(fieldName, fieldDescription, fieldValue)
    }

    if (params?.isPreview && fieldDescription) {
      if (contentInputResult) return contentInputResult
      return $('<div class="alert alert-danger mt-3">').text(
        `Error: ${fieldName} can't be rendered`
      )
    }
    return contentInputResult
  }

  var mkDropdownList = function (fieldName, fieldDescription, fieldValue, values, required) {
    var $input = $('<div>', { class: 'row' })

    if (fieldName === 'readers' && values.length > 1) {
      var $smallHeading = $('<div>', { text: prettyField(fieldName), class: 'small_heading' })
      if (fieldDescription.required) {
        $smallHeading.prepend('<span class="required_field">*</span>')
      }

      var $description = $('<div class="hint">').text(fieldDescription)
      $input.append($smallHeading, $description)
    } else {
      $input.append(
        mkHoverItem(
          $('<span>', { text: prettyField(fieldName), class: 'line_heading' }),
          fieldDescription,
          false,
          true,
          required
        )
      )
    }

    var dropdownOptions = _.map(values, function (value) {
      if (value.id && value.description) {
        return value
      }
      return {
        id: value,
        description: prettyId(value),
      }
    })

    if (dropdownOptions.length === 1) {
      $input.append(
        mkHoverItem(dropdownOptions[0].description, dropdownOptions[0].id).addClass(
          'list_adder_list'
        )
      )
    } else {
      var selectedValue = _.find(dropdownOptions, ['id', fieldValue])

      var filterOptions = function (options, term) {
        return _.filter(options, function (p) {
          return _.includes(p.description.toLowerCase(), term.toLowerCase())
        })
      }

      var $dropdown = mkDropdown(
        fieldName,
        false,
        selectedValue,
        function (update, term) {
          update(filterOptions(dropdownOptions, term))
        },
        function (value, id) {
          var selectedOption = _.find(dropdownOptions, ['id', id])
          var $input = $dropdown.find('input')

          if (!(selectedOption && selectedOption.description === value)) {
            $input.val('')
            $input.attr('value_id', '')
          } else {
            $input.val(value)
            $input.attr('value_id', id)
          }
        }
      )

      var $dropdownInput = $dropdown.find('input')
      $dropdownInput.attr({
        class: 'form-control dropdown note_content_value',
        name: fieldName,
        autocomplete: 'off',
      })

      $input.append($dropdown)
    }

    return $input
  }

  var mkComposerInput = function (fieldName, fieldDescription, fieldValue, params) {
    var contentInputResult

    if (fieldName === 'pdf' && fieldDescription['value-regex']) {
      contentInputResult = mkPdfSection(fieldDescription, fieldValue)
    } else if (
      fieldName === 'authorids' &&
      ((_.has(fieldDescription, 'values-regex') &&
        isTildeIdAllowed(fieldDescription['values-regex'])) ||
        _.has(fieldDescription, 'values'))
    ) {
      var authors
      var authorids
      if (params && params.note) {
        authors = params.note.content.authors
        authorids = params.note.content.authorids
      } else if (params && params.user) {
        var userProfile = params.user.profile
        authors = [userProfile.fullname]
        authorids = [userProfile.preferredId]
      }
      var invitationRegex = fieldDescription['values-regex']
      // Enable allowUserDefined if the values-regex has '~.*|'
      // Don't enable adding or removing authors if invitation uses 'values' instead of values-regex
      contentInputResult = valueInput(
        mkSearchProfile(authors, authorids, {
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

    if (contentInputResult && fieldDescription && fieldDescription.hidden === true) {
      return contentInputResult.hide()
    }
    return contentInputResult
  }

  var mkItem = function (text, f) {
    var $item = $('<div>', { class: 'item', text: text })

    if (f) {
      return $item.addClass('button').click(f)
    }
    return $item
  }

  var mkBlockItem = function (text, f) {
    var $item = $('<div>', { class: 'item', text: text })

    if (f) {
      return $('<div>').append($item.addClass('button').click(f))
    } else {
      return $('<div>').append($item)
    }
  }

  var mkSection = function (name, $innerContent) {
    var $section = $('<div>', { class: 'section' }).append(
      name ? $('<div>', { class: 'section_title', text: name }) : null,
      $innerContent
    )
    return $section
  }

  var mkListItems = function (os, clickF, textF) {
    return _.map(os, function (o) {
      return mkItem(
        textF ? textF(o) : o,
        clickF
          ? function () {
              clickF(o)
            }
          : null
      )
    })
  }

  var fileTransferByInvitation = function (pdfRegex) {
    if (pdfRegex.toLowerCase() === 'upload') {
      return 'upload'
    } else if (_.startsWith(pdfRegex.toLowerCase(), 'upload|')) {
      return 'either'
    } else {
      return 'url'
    }
  }

  var arxivAutofill = function (e) {
    var regexStr = e.data.regexStr
    var pdfText = $('.note_pdf').val()
    if (pdfText.indexOf('arxiv.org/pdf/') > -1 && pdfText.match(regexStr)) {
      $('.row:has(.note_pdf) .load_error').remove()
      var arxivIdx = pdfText.split('arxiv.org/pdf/')[1].split('.pdf')[0]
      $.ajax({
        url: 'http://export.arxiv.org/api/query?id_list=' + arxivIdx,
        dataType: 'xml',
        success: function (data) {
          var xml = $(data)

          if (xml.find('entry')) {
            var entry = xml.find('entry')[0]

            var contentMap = {}
            if (entry.getElementsByTagName('title')) {
              contentMap.title = entry.getElementsByTagName('title')[0].childNodes[0].nodeValue
            }

            if (entry.getElementsByTagName('summary')) {
              contentMap.abstract = entry
                .getElementsByTagName('summary')[0]
                .childNodes[0].nodeValue.replace(/\n/g, ' ')
                .trim()
            }

            if (entry.getElementsByTagName('author')) {
              var authList = []
              var authors = entry.getElementsByTagName('author')
              for (var i = 0; i < authors.length; i++) {
                var auth = authors[i].childNodes[1].childNodes[0].nodeValue
                authList[i] = auth
              }
              contentMap.authors = authList.join(', ')
            }

            // eslint-disable-next-line no-restricted-syntax, guard-for-in
            for (var k in contentMap) {
              $('.note_content_value[name=' + k + ']').val(contentMap[k])
            }
          }
          $('.row:has(.note_pdf) i').remove()
        },
        error: function () {
          $('.row:has(.note_pdf) i').remove()
          $('.row:has(.note_pdf)').append(
            $('<span>', { text: 'arXiv autofill failed', class: 'load_error hint' })
          )
          $('.note_content_value').val('')
        },
      })
    }
  }

  // Private function that creates the input element for entering a pdf, and binds
  // the arxivAutofill callback if the pdf is the first field in the form.
  var mkFileInput = function (fieldName, type, order, regexStr) {
    var $notePdf = $('<input>', {
      type: type,
      class: 'form-control note_content_value_input note_' + fieldName.replace(/\W/g, '_'),
    })
    var $clearBtn = null

    if (type === 'text' && order <= 1) {
      $notePdf.on('keyup', null, { regexStr: regexStr }, arxivAutofill)
    } else if (type === 'file') {
      $clearBtn = $(
        '<button class="btn"><span class="glyphicon glyphicon-remove" aria-hidden="true"></span></button>'
      ).on('click', function () {
        // Clear current selection from file input and reset existing selection
        $notePdf.val('')
        var $fieldRow = $(this).closest('.row')
        $fieldRow.find('.note_content_value').val('').data('fileRemoved', true)
        $fieldRow.find('.existing-filename').text('').hide()
      })
    }

    var $progressBar = $(
      '<div class="progress"><div class="progress-bar progress-bar-striped active" role="progressbar" aria-valuemin="0" aria-valuemax="100" style="width: 2%"/></div>'
    ).hide()
    return $clearBtn
      ? $('<div class="input-group file-input-group">')
          .append($notePdf, $('<span class="input-group-btn">').append($clearBtn))
          .add($progressBar)
      : $notePdf
  }

  // Private helper function used by mkPdfSection and mkAttachmentSection
  var mkFileRow = function ($widgets, fieldName, fieldDescription, fieldValue) {
    var smallHeading = $('<div>', { text: prettyField(fieldName), class: 'small_heading' })
    if (_.has(fieldDescription, 'required') && fieldDescription.required) {
      var requiredText = $('<span>', { text: '*', class: 'required_field' })
      smallHeading.prepend(requiredText)
    }

    var $noteContentVal = $('<input>', {
      class: 'note_content_value',
      name: fieldName,
      value: fieldValue,
      style: 'display: none;',
    })

    var $fieldValue = fieldValue
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

  var mkPdfSection = function (fieldDescription, fieldValue) {
    var order = fieldDescription.order
    var regexStr = fieldDescription['value-regex']
    var invitationFileTransfer = fileTransferByInvitation(regexStr)

    if (invitationFileTransfer === 'upload') {
      return mkFileRow(
        mkFileInput('pdf', 'file', order, regexStr),
        'pdf',
        fieldDescription,
        fieldValue
      )
    } else if (invitationFileTransfer === 'url') {
      return mkFileRow(
        mkFileInput('pdf', 'text', order, regexStr),
        'pdf',
        fieldDescription,
        fieldValue
      )
    } else if (invitationFileTransfer === 'either') {
      var $span = $('<div>', { class: 'item', style: 'width: 80%' })
      var timestamp = Date.now()
      var $radioItem = $('<div>', { class: 'item' }).append(
        $('<div>').append(
          $('<input>', { class: 'upload', type: 'radio', name: 'pdf_' + timestamp }).click(
            function () {
              $span.html(mkFileInput('pdf', 'file', order, regexStr))
            }
          ),
          $('<span>', { class: 'item', text: 'Upload PDF file' })
        ),
        $('<div>').append(
          $('<input>', { class: 'url', type: 'radio', name: 'pdf_' + timestamp }).click(
            function () {
              $span.html(mkFileInput('pdf', 'text', order, regexStr))
            }
          ),
          $('<span>', { class: 'item', text: 'Enter URL' })
        )
      )
      return mkFileRow([$radioItem, $span], 'pdf', fieldDescription, fieldValue)
    }
  }

  var updatePdfSection = function ($pdf, fieldDescription, fieldValue) {
    $pdf.empty()
    $pdf.append(mkPdfSection(fieldDescription, fieldValue).children())
  }

  var mkAttachmentSection = function (fieldName, fieldDescription, fieldValue) {
    var order = fieldDescription.order
    var regexStr = fieldDescription['value-file'].regex
    var mimeType = fieldDescription['value-file'].mimetype
    var size = fieldDescription['value-file'].size

    var invitationFileTransfer = 'url'
    if (regexStr && (mimeType || size)) {
      invitationFileTransfer = 'either'
    } else if (!regexStr) {
      invitationFileTransfer = 'upload'
    }

    if (invitationFileTransfer === 'upload') {
      return mkFileRow(
        mkFileInput(fieldName, 'file', order, regexStr),
        fieldName,
        fieldDescription,
        fieldValue
      )
    } else if (invitationFileTransfer === 'url') {
      return mkFileRow(
        mkFileInput(fieldName, 'text', order, regexStr),
        fieldName,
        fieldDescription,
        fieldValue
      )
    } else if (invitationFileTransfer === 'either') {
      var $span = $('<div>', { class: 'item', style: 'width: 80%' })
      var timestamp = Date.now()
      var $radioItem = $('<div>', { class: 'item' }).append(
        $('<div>').append(
          $('<input>', {
            class: 'upload',
            type: 'radio',
            name: fieldName + '_' + timestamp,
          }).click(function () {
            $span.html(mkFileInput(fieldName, 'file', order, regexStr))
          }),
          $('<span>', { class: 'item', text: 'Upload file' })
        ),
        $('<div>').append(
          $('<input>', {
            class: 'url',
            type: 'radio',
            name: fieldName + '_' + timestamp,
          }).click(function () {
            $span.html(mkFileInput(fieldName, 'text', order, regexStr))
          }),
          $('<span>', { class: 'item', text: 'Enter URL' })
        )
      )
      return mkFileRow([$radioItem, $span], fieldName, fieldDescription, fieldValue)
    }
  }

  var updateFileSection = function ($fileSection, fieldName, fieldDescription, fieldValue) {
    $fileSection.empty()
    $fileSection.append(
      mkAttachmentSection(fieldName, fieldDescription, fieldValue).children()
    )
  }

  var prettyReadersList = function (readers, dontShowGlobe) {
    var readersHtml
    if (readers.indexOf('everyone') > -1 && !dontShowGlobe) {
      readersHtml = '<span class="readers-icon glyphicon glyphicon-globe"></span> Everyone'
    } else {
      var formattedReaders = []
      readers.forEach(function (id) {
        if (!id || id === 'Super User') return
        formattedReaders.push(
          '<span title="' +
            id +
            '" data-toggle="tooltip" data-placement="top">' +
            prettyId(id, true) +
            '</span>'
        )
      })

      readersHtml = formattedReaders.join(', ')
    }
    return readersHtml
  }

  var orderCache = {}
  var order = function (replyContent, invitationId, disableCache) {
    if (invitationId && orderCache[invitationId] && !disableCache) {
      return orderCache[invitationId]
    }

    var orderedFields = _.map(
      _.sortBy(
        _.map(replyContent, function (fieldProps, fieldName) {
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

  var autolinkHtml = function (value) {
    // Regex based on https://gist.github.com/dperini/729294 modified to not accept FTP urls
    var urlRegex =
      /(?:(?:https?):\/\/)(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,}))\.?)(?::\d{2,5})?(?:[/?#]\S*[^.,()"'\s])?/gi
    var profileRegex = /(?:.)?(~[^\d\s]+_[^\d\s]+[0-9]+)/gi

    var intermediate = value.replace(urlRegex, function (match) {
      var url = match.startsWith('https://openreview.net')
        ? match.replace('https://openreview.net', '')
        : match
      return `<a href="${url}" target="_blank" rel="nofollow">${url}</a>`
    })

    return intermediate.replace(profileRegex, function (fullMatch, match) {
      if (fullMatch !== match && fullMatch.charAt(0).match(/\S/)) return fullMatch
      return ' <a href="/profile?id=' + match + '" target="_blank">' + prettyId(match) + '</a>'
    })
  }

  var autolinkFieldDescriptions = function ($noteEditor) {
    // Searches note editor form for all field descriptions and replaces any
    // valid URLs with links using the autolinkHtml function
    $noteEditor
      .find('div.hint')
      .not('div.char-counter')
      .each(function () {
        $(this).html(autolinkHtml($(this).html()))
      })
  }

  var mkTitleComponent = function (note, titleText) {
    var $titleHTML = $('<h2 class="note_content_title">')
    var titleHref =
      '/forum?id=' + note.forum + (note.forum !== note.id ? '&noteId=' + note.id : '')

    $titleHTML.append($('<span>', { text: titleText }).data('href', titleHref))
    return $titleHTML
  }

  var getTitleText = function (note, generatedTitleText) {
    if (_.trim(note.content.title)) {
      return note.content.title
    }
    if (_.trim(note.content.verdict)) {
      return 'Verdict: ' + note.content.verdict
    }
    return generatedTitleText
  }

  var mkPdfIcon = function (note, isReference) {
    // PDF for title
    var $pdfLink = null
    if (note.content.pdf) {
      var downloadURL = pdfUrl(note, isReference)
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
    if (note.content.ee || note.content.html) {
      $htmlLink = $('<a>', {
        class: 'note_content_pdf html-link',
        href: note.content.ee || note.content.html,
        title: 'Open Website',
        target: '_blank',
      }).append('<img src="/images/html_icon_blue.svg">')
    }
    return $htmlLink
  }

  var getAuthorText = function (note) {
    var notePastDue = note.ddate && note.ddate < Date.now()
    if (notePastDue) {
      // Note trashed
      return $('<span>', { class: 'signatures' }).text('[Deleted]')
    }

    var authorList
    if (note.content.authors?.length > 0) {
      // Probably a forum-level note (because it has authors)
      if (note.content.authorids?.length > 0) {
        authorList = note.content.authors.map(function (a, i) {
          var aId = note.content.authorids[i]
          if (!aId) {
            return a
          }

          if (aId.indexOf('~') === 0) {
            return (
              '<a href="/profile?id=' +
              encodeURIComponent(aId) +
              '" class="profile-link" data-toggle="tooltip" data-placement="bottom" title="' +
              aId +
              '">' +
              a +
              '</a>'
            )
          } else if (aId.indexOf('@') !== -1) {
            return (
              '<a href="/profile?email=' +
              encodeURIComponent(aId) +
              '" class="profile-link" data-toggle="tooltip" data-placement="bottom" title="' +
              aId +
              '">' +
              a +
              '</a>'
            )
          } else if (aId.indexOf('http') === 0) {
            return (
              '<a href="' +
              aId +
              '" class="profile-link" data-toggle="tooltip" data-placement="bottom" title="' +
              aId +
              '">' +
              a +
              '</a>'
            )
          } else {
            return a
          }
        })
      } else {
        authorList = note.content.authors
      }
    } else {
      // Note with no authors, just signatures, such as a forum comment
      authorList = note.signatures.map(function (signature) {
        if (signature.indexOf('~') === 0) {
          return (
            '<a href="/profile?id=' +
            encodeURIComponent(signature) +
            '" class="profile-link">' +
            prettyId(signature) +
            '</a>'
          )
        } else {
          return prettyId(signature)
        }
      })
    }

    var maxAuthorsToShow = 20
    if (authorList.length <= maxAuthorsToShow) {
      return $('<span>', { class: 'signatures' }).html(authorList.join(', '))
    }

    var showAllLinkText = `et al. (${
      authorList.length - maxAuthorsToShow
    } additional authors not shown)`
    var hideLinkText = '(hide authors)'
    return $('<span>', { class: 'signatures' }).append(
      authorList.slice(0, maxAuthorsToShow).join(', '),
      $('<span>', { class: 'more-authors', style: 'display: none;' }).html(
        ', ' + authorList.slice(maxAuthorsToShow).join(', ')
      ),
      ' ',
      $('<a>', { class: 'show-all', href: '#', role: 'button' })
        .text(showAllLinkText)
        .on('click', function (e) {
          $(this).text($(this).text() === hideLinkText ? showAllLinkText : hideLinkText)
          $(this).prev('span').toggle()
          return false
        })
    )
  }

  var buildContent = function (note, params, additionalOmittedFields) {
    if (!params?.withContent || (note.ddate && note.ddate < Date.now())) {
      return
    }

    // Get order of content fields from invitation. If no invitation is provided,
    // use default ordering of content object.
    var invitation
    if (note.details) {
      if (!_.isEmpty(note.details.originalInvitation)) {
        invitation = note.details.originalInvitation
      } else if (!_.isEmpty(note.details.invitation)) {
        invitation = note.details.invitation
      }
    } else if (!_.isEmpty(params.invitation)) {
      invitation = params.invitation
    }

    var contentKeys = Object.keys(note.content)
    var contentOrder = invitation
      ? _.union(order(invitation.reply.content, invitation.id), contentKeys)
      : contentKeys

    var omittedContentFields = [
      'title',
      'authors',
      'author_emails',
      'authorids',
      'pdf',
      'verdict',
      'paperhash',
      'ee',
      'html',
      'year',
      ...(!params.isReference ? ['venue', 'venueid'] : []),
    ].concat(additionalOmittedFields || [])

    var $contents = []
    contentOrder.forEach(function (fieldName) {
      if (omittedContentFields.includes(fieldName) || fieldName.startsWith('_')) {
        return
      }

      var valueString = prettyContentValue(note.content[fieldName])
      if (!valueString) {
        return
      }

      // Build download links
      if (valueString.indexOf('/attachment/') === 0) {
        $contents.push(
          $('<div>', { class: 'note_contents' }).append(
            $('<span>', { class: 'note_content_field' }).text(prettyField(fieldName) + ': '),
            $('<span>', { class: 'note_content_value' }).html(
              mkDownloadLink(note.id, fieldName, valueString, {
                isReference: params.isReference,
              })
            )
          )
        )
        return
      }

      var invitationField = invitation?.reply?.content?.[fieldName] ?? {}
      var $elem = $('<span>', { class: 'note_content_value' })
      if (invitationField.markdown) {
        var re = new RegExp(
          '^' + (invitationField['value-regex'] ?? '').replace(/\{\d+,\d+\}$/, '') + '$'
        )
        var newlineAllowed = re.test('\n')
        $elem[0].innerHTML = DOMPurify.sanitize(
          newlineAllowed ? marked(valueString) : marked.parseInline(valueString)
        )
        $elem.addClass('markdown-rendered')
      } else {
        // First set content as text to escape HTML, then autolink escaped HTML
        $elem.text(valueString)
        $elem.html(autolinkHtml($elem.html()))
      }

      $contents.push(
        $('<div>', { class: 'note_contents' }).append(
          $('<span>', { class: 'note_content_field' }).text(prettyField(fieldName) + ': '),
          $elem
        )
      )
    })

    return $contents
  }

  var buildOriginalNote = function (note, originalNote, params) {
    var $originalNote = $('<div>', {
      id: 'original_note_' + originalNote.id,
      class: 'private-contents panel',
    })

    // If the values in original Note and blind Note are the same we can omit the field
    if (
      originalNote.content.authorids &&
      !_.isEqual(note.content.authorids, originalNote.content.authorids)
    ) {
      var $origAuthorText = getAuthorText(originalNote)
      $originalNote.append(
        // Add authors
        $('<div>', { class: 'meta_row note_contents' }).append(
          $('<span>', { class: 'note_content_field' }).html('Authors:'),
          $origAuthorText
        )
      )
    }

    if (originalNote.content.pdf && !note.content.pdf) {
      $originalNote.append(
        $('<div>', { class: 'note_contents' }).append(
          $('<span>', { class: 'note_content_field' }).text('Pdf: '),
          $('<span>', { class: 'note_content_value' }).html(
            mkDownloadLink(originalNote.id, 'pdf', originalNote.content.pdf, {
              isReference: params.isReference,
            })
          )
        )
      )
    }

    if (
      (originalNote.content.ee && !note.content.ee) ||
      (originalNote.content.html && !note.content.html)
    ) {
      var fieldName = originalNote.content.ee ? 'ee' : 'html'
      var link = originalNote.content.ee || originalNote.content.html
      $originalNote.append(
        $('<div>', { class: 'note_contents' }).append(
          $('<span>', { class: 'note_content_field' }).text('Html: '),
          $('<span>', { class: 'note_content_value' }).html(
            '<a href="' +
              link +
              '" class="attachment-download-link" title="Download ' +
              prettyField(fieldName) +
              '" target="_blank">' +
              link +
              '</a>'
          )
        )
      )
    }

    // We do not need to show duplicate information.
    // If the values in original Note and blind Note are the same we can omit the field
    var additionalOmittedFields = Object.keys(originalNote.content).filter(function (key) {
      return _.isEqual(note.content[key], originalNote.content[key])
    })

    $originalNote.append(
      buildContent(
        originalNote,
        {
          withContent: params.withContent,
          invitation: note.details && note.details.originalInvitation,
        },
        additionalOmittedFields
      )
    )

    if (!$originalNote.children().length) {
      return null
    }

    var notePastDue = note.ddate && note.ddate < Date.now()
    var origFormattedDate = forumDate(
      originalNote.cdate,
      originalNote.tcdate,
      originalNote.mdate,
      originalNote.tmdate,
      originalNote.content.year,
      originalNote.pdate
    )
    var $origDateItem =
      !notePastDue || note.details.writable
        ? $('<span>', { class: 'date item' }).text(origFormattedDate)
        : null
    var $origInvItem = $('<span>', { class: 'item' }).text(
      originalNote.content.venue || prettyId(originalNote.invitation)
    )
    var $origReadersItem = null
    if (originalNote.readers && originalNote.readers.length) {
      // Filtering out the venue Group, because it's confusing. If the reader is a substring of the Note's invitation
      // then that means that the reader is the venue Group. E.g.
      // Note invitation: thecvf.com/ECCV/2020/Conference/-/Submission
      // Reader thecvf.com/ECCV/2020/Conference
      // Reader is a substring of the Note invitation, so we filter it out
      var filteredReaders = originalNote.readers.filter(function (reader) {
        return originalNote.invitation.indexOf(reader) === -1
      })
      $origReadersItem = $('<span>', { class: 'private-author-label' }).html(
        'Revealed to ' + prettyReadersList(filteredReaders)
      )
    }
    $originalNote.prepend(
      $('<div>', { class: 'meta_row' }).append($origReadersItem),
      $('<hr>', { class: 'small' }),
      $('<div>', { class: 'meta_row' }).append($origDateItem, $origInvItem)
    )

    return $originalNote
  }

  var mkNotePanel = function (note, options) {
    var params = _.assign(
      {
        invitation: null,
        onEditRequested: null,
        replyInvitations: [],
        referenceInvitations: [],
        tagInvitations: [],
        originalInvitations: [],
        onNewNoteRequested: null,
        withContent: false,
        withReplyCount: false,
        withRevisionsLink: false,
        withParentNote: false,
        onTrashedOrRestored: null,
        isReference: false,
        user: {},
        withModificationDate: false,
        withDateTime: false,
        withBibtexLink: true,
        readOnlyTags: false,
        newLayout: false,
      },
      options
    )
    var $note = $('<div>', { id: 'note_' + note.id, class: 'note panel' })
    var forumId = note.forum
    var details = note.details || {}

    var notePastDue = note.ddate && note.ddate < Date.now()
    if (notePastDue) {
      $note.addClass('trashed')
    }
    if (note.content._disableTexRendering) {
      $note.addClass('disable-tex-rendering')
    }
    if (params.newLayout) {
      $note.addClass('new-layout')
    }

    var generatedTitleText = generateNoteTitle(note.invitation, note.signatures)
    var titleText = getTitleText(note, generatedTitleText)
    var useGeneratedTitle = !_.trim(note.content.title) && !_.trim(note.content.verdict)
    var $titleHTML = mkTitleComponent(note, titleText)

    var $pdfLink = mkPdfIcon(note, params.isReference)
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

    // Trash and Edit buttons
    var $trashButton = null
    var $editButton = null
    var $actionButtons = null
    if (
      // $('#content').hasClass('legacy-forum') ||
      // $('#content').hasClass('tasks') ||
      // $('#content').hasClass('revisions')
      true
    ) {
      var canEdit =
        (details.original && details.originalWritable) ||
        (!details.originalWritable && details.writable)
      if (canEdit && params.onTrashedOrRestored) {
        var buttonContent = notePastDue
          ? 'Restore'
          : '<span class="glyphicon glyphicon-trash" aria-hidden="true"></span>'
        $trashButton = $(
          '<button id="trashbutton_' +
            note.id +
            '" class="btn btn-xs trash_button">' +
            buttonContent +
            '</button>'
        )
        $trashButton.click(function () {
          var noteToDelete = note
          if (!options.isReference && details.originalWritable) {
            noteToDelete = details.original
          }
          deleteOrRestoreNote(noteToDelete, titleText, params.user, params.onTrashedOrRestored)
        })
      }

      if (canEdit && params.onEditRequested && !notePastDue) {
        $editButton = $(
          '<button class="btn btn-xs edit_button"><span class="glyphicon glyphicon-edit" aria-hidden="true"></span></button>'
        )
        $editButton.click(function () {
          var options = details.originalWritable ? { original: true } : {}
          params.onEditRequested(null, options)
        })
      }

      if ($editButton || $trashButton) {
        $actionButtons = $('<div>', { class: 'meta_actions' }).append(
          $editButton,
          $trashButton
        )
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
      $actionButtons
    )

    var $parentNote = null
    if (params.withParentNote && note.forumContent && note.forum !== note.id) {
      $parentNote = $('<div class="meta_row parent-title">').append(
        '<span class="item glyphicon glyphicon-share-alt"></span>',
        '<span class="item title">' + note.forumContent.title + '</span>'
      )
    }

    var $contentSignatures = getAuthorText(note)
    var $contentAuthors = $('<div>', { class: 'meta_row' }).append($contentSignatures)

    var trueAuthorText =
      note.tauthor && note.tauthor.indexOf('~') === 0
        ? '<a href="/profile?id=' +
          encodeURIComponent(note.tauthor) +
          '" class="profile-link">' +
          prettyId(note.tauthor) +
          '</a>'
        : prettyId(note.tauthor)
    if (
      !note.content.authors &&
      trueAuthorText &&
      trueAuthorText !== $contentSignatures.html()
    ) {
      $contentAuthors.append(
        '<span class="author no-margin">' + trueAuthorText + '</span>',
        '<span class="private-author-label">(privately revealed to you)</span>'
      )
    }
    if (
      note.readers.length === 1 &&
      note.readers[0].indexOf('~') === 0 &&
      note.readers[0] === note.signatures[0]
    ) {
      $contentAuthors.append('<span class="private-author-label">(visible only to you)</span>')
    }

    // Meta Info Row
    var $metaEditRow = $('<div>', { class: 'meta_row' })
    var formattedDate = forumDate(
      note.cdate,
      note.tcdate,
      note.mdate,
      note.tmdate,
      note.content.year,
      note.pdate,
      note.id !== note.forum // include time if this a reply
    )
    var $replyCountLabel =
      params.withReplyCount && details.replyCount
        ? $('<span>', { class: 'item' }).text(
            details.replyCount === 1 ? '1 Reply' : details.replyCount + ' Replies'
          )
        : null
    var $revisionsLink =
      params.withRevisionsLink && details.revisions
        ? $('<a>', {
            class: 'note_content_pdf item',
            href: '/revisions?id=' + note.id,
            text: 'Show Revisions',
          })
        : null
    // Display modal showing full BibTeX reference. Click handler is definied in public/index.js
    var $bibtexLink =
      note.content._bibtex && params.withBibtexLink
        ? $(
            '<span class="item"><a href="#" data-target="#bibtex-modal" data-toggle="modal" data-bibtex="' +
              encodeURIComponent(note.content._bibtex) +
              '">Show Bibtex</a></span>'
          )
        : null

    var $dateItem = null
    var $invItem = null
    var $readersItem = null
    var prettyInv = prettyInvitationId(note.invitation)
    if (params.newLayout) {
      $dateItem = !notePastDue
        ? $('<span>', {
            class: 'date item',
            'data-toggle': 'tooltip',
            'data-placement': 'top',
            title: 'Date Created',
          }).text(formattedDate)
        : null
      var invLabelText = prettyInv + ' by ' + prettyId(note.signatures[0], true)
      $invItem = $('<span>', {
        class: 'item highlight',
        'data-toggle': 'tooltip',
        'data-placement': 'top',
        title: 'Reply Type',
      })
        .text(invLabelText)
        .css(getInvitationColors(prettyInv))
      var iconName = note.readers.includes('everyone') ? 'globe' : 'eye-open'
      var onlineText =
        note.odate && note.readers.includes('everyone')
          ? 'Visible to everyone since ' + forumDate(note.odate)
          : 'Reply Visibility'
      $readersItem = $('<span>', { class: 'item' }).append(
        '<span class="glyphicon glyphicon-' +
          iconName +
          '" data-toggle="tooltip" data-placement="top" title="' +
          onlineText +
          '" aria-hidden="true"></span>',
        ' ',
        prettyReadersList(note.readers, true)
      )
      $metaEditRow.append(
        $invItem,
        $dateItem,
        $readersItem,
        $replyCountLabel,
        $bibtexLink,
        $revisionsLink
      )
    } else {
      $dateItem =
        !notePastDue || details.writable
          ? $('<span>', { class: 'date item' }).text(formattedDate)
          : null
      $invItem = $('<span>', { class: 'item' }).text(
        options.isReference
          ? prettyId(note.invitation)
          : note.content.venue || prettyId(note.invitation)
      )
      $readersItem = _.has(note, 'readers')
        ? $('<span>', { class: 'item' }).html('Readers: ' + prettyReadersList(note.readers))
        : null
      $metaEditRow.append(
        $dateItem,
        $invItem,
        $readersItem,
        $replyCountLabel,
        $bibtexLink,
        $revisionsLink
      )
    }

    var $metaActionsRow = null
    var $modifiableOriginalButton = null
    if (
      !$editButton &&
      params.onEditRequested &&
      params.originalInvitations.length &&
      !params.referenceInvitations
    ) {
      var modifiableOriginalTooltipText =
        'Click here to access the original version of the paper. Changes to the original version will update the anonymous version used by viewers during the review process.'
      $modifiableOriginalButton = $(
        '<button class="btn btn-xs edit_button" data-toggle="tooltip" data-placement="top" title="' +
          modifiableOriginalTooltipText +
          '">Modifiable Original</button>'
      )
      $modifiableOriginalButton.click(function () {
        location.href = '/forum?id=' + note.original
      })
    }

    var $originalInvitations = _.map(params.originalInvitations, function (invitation) {
      var buttonText = prettyInvitationId(invitation.id)
      var editorOptions = { original: true }
      if (
        buttonText === 'Revision' &&
        invitation.multiReply === false &&
        invitation.details.repliedNotes?.length
      ) {
        buttonText = 'Edit Revision'
        editorOptions = { revision: true }
      }

      return $('<button class="btn btn-xs edit_button">')
        .text(buttonText)
        .on('click', function () {
          params.onEditRequested(invitation, editorOptions)
        })
    })

    var $referenceInvitations = _.map(params.referenceInvitations, function (invitation) {
      return $('<button class="btn btn-xs edit_button">')
        .text(prettyInvitationId(invitation.id))
        .click(function () {
          params.onEditRequested(invitation)
        })
    })
    if ($originalInvitations || $referenceInvitations || $modifiableOriginalButton) {
      $metaActionsRow = $('<div>', { class: 'meta_row meta_actions' }).append(
        $originalInvitations,
        $modifiableOriginalButton,
        $referenceInvitations
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

    // Add info from origial note below content
    if (details.original) {
      $note.append(buildOriginalNote(note, details.original, params))
    }

    var buildTag = function (tags, tagInvitation) {
      var buildRelations = function (relation) {
        var description = tagInvitation.reply[relation]

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

      return mkTagInput('tag', tagInvitation && tagInvitation.reply.content.tag, tags, {
        forum: note.id,
        placeholder:
          (tagInvitation && tagInvitation.reply.content.tag.description) ||
          (tagInvitation && prettyId(tagInvitation.id)),
        label: tagInvitation && prettyInvitationId(tagInvitation.id),
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
          body = getCopiedValues(body, tagInvitation.reply)

          Webfield.post('/tags', body).then(function (result) {
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
      if (tagInvitation.reply.invitation || tagInvitation.reply.forum === note.id) {
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
            .text(prettyInvitationId(invitation.id))
            .click(function () {
              params.onNewNoteRequested(invitation)
            })
        })
      )
    }
    $note.append($replyRow)

    return $note
  }

  var generateNoteTitle = function (invitationId, signatures) {
    var formattedInvitation = prettyInvitationId(invitationId)
    var signature = _.isEmpty(signatures) ? '' : prettyId(signatures[0], true)
    var signatureMatches = signature.match(/^(Paper\d+) (.+)$/)
    var invMatches = invitationId.match(/\/(Paper\d+)\//)
    var suffix
    if (
      (invMatches || signatureMatches) &&
      formattedInvitation.toLowerCase().indexOf('review') !== -1
    ) {
      var paper = invMatches ? invMatches[1] : signatureMatches[1]
      var signatureWithoutPaper = signatureMatches ? signatureMatches[2] : signature
      suffix = ' of ' + paper + ' by ' + signatureWithoutPaper
    } else {
      suffix = ' by ' + signature
    }
    return formattedInvitation + suffix
  }

  var pdfUrl = function (note, isReference) {
    var path = isReference
      ? `${note.version === 2 ? '/notes/edits/pdf' : '/references/pdf'}`
      : '/pdf'
    return _.startsWith(note.content.pdf, '/pdf') ? path + '?id=' + note.id : note.content.pdf
  }

  var deleteOrRestoreNote = function (note, noteTitle, user, onTrashedOrRestored) {
    var newNote = _.cloneDeep(note)
    newNote.details = newNote.details || {}
    var isDeleted = newNote.ddate && newNote.ddate < Date.now()

    if (isDeleted) {
      // Restore deleted note
      newNote.ddate = null
      newNote.writers = getWriters(newNote.details.invitation, newNote.signatures, user)
      newNote = getCopiedValues(newNote, newNote.details.invitation.reply)
      return Webfield.post('/notes', newNote, { handleErrors: false }).then(
        function (updatedNote) {
          onTrashedOrRestored(Object.assign(newNote, updatedNote))
        },
        function (jqXhr, textStatus) {
          var errorText = Webfield.getErrorFromJqXhr(jqXhr, textStatus)
          promptError(errorText, { scrollToTop: false })
        }
      )
    }

    var postUpdatedNote = function ($signaturesDropdown) {
      var newSignatures = idsFromListAdder($signaturesDropdown, {})
      if (!newSignatures || !newSignatures.length) {
        newSignatures = [user.profile.id]
      }
      newNote.signatures = newSignatures
      newNote.ddate = Date.now()
      if (newNote.details?.invitation) {
        // reference won't have invitation in detail
        newNote.writers = getWriters(newNote.details.invitation, newSignatures, user)
        newNote = getCopiedValues(newNote, newNote.details.invitation.reply)
      }

      Webfield.post('/notes', newNote, { handleErrors: false }).then(
        function (updatedNote) {
          onTrashedOrRestored(Object.assign(newNote, updatedNote))
        },
        function (jqXhr, textStatus) {
          var errorText = Webfield.getErrorFromJqXhr(jqXhr, textStatus)
          promptError(errorText, { scrollToTop: false })
        }
      )
    }

    return loadSignaturesDropdown(note.invitation, note.signatures, user)
      .then(function ($signaturesDropdown) {
        // If there's only 1 signature available don't show the modal
        if (!$signaturesDropdown.find('div.dropdown').length) {
          postUpdatedNote($signaturesDropdown)
          return
        }

        showConfirmDeleteModal(newNote, noteTitle, $signaturesDropdown)

        $('#confirm-delete-modal .modal-footer .btn-primary').on('click', function () {
          postUpdatedNote($signaturesDropdown)
          $('#confirm-delete-modal').modal('hide')
        })
      })
      .fail(function (error) {
        var errorToDisplay =
          error === 'no_results' ? 'You do not have permission to delete this note' : error
        promptError(errorToDisplay, { scrollToTop: false })
      })
  }

  var showConfirmDeleteModal = function (note, noteTitle, $signaturesDropdown) {
    $('#confirm-delete-modal').remove()

    $('#content').append(
      Handlebars.templates.genericModal({
        id: 'confirm-delete-modal',
        showHeader: true,
        title: 'Delete Note',
        body:
          '<p style="margin-bottom: 1.5rem;">Are you sure you want to delete "' +
          noteTitle +
          '" by ' +
          prettyId(note.signatures[0]) +
          '? The deleted note will ' +
          'be updated with the signature you choose below.</p>',
        showFooter: true,
        primaryButtonText: 'Delete',
      })
    )

    $signaturesDropdown.removeClass('row').addClass('note_editor text-center mb-2')
    $signaturesDropdown.find('.required_field').remove()
    $signaturesDropdown.find('span.line_heading').text('Signature:')
    $('#confirm-delete-modal .modal-body').append($signaturesDropdown)

    $('#confirm-delete-modal').modal('show')
  }

  var loadSignaturesDropdown = function (invitationId, noteSignatures, user) {
    return Webfield.get('/invitations', { id: invitationId }).then(function (result) {
      if (!result.invitations || !result.invitations.length) {
        promptError('Could not load invitation ' + invitationId)
        return $.Deferred().reject()
      }

      return buildSignatures(result.invitations[0].reply.signatures, noteSignatures, user)
    })
  }

  // Format essential profile data for display
  var formatProfileContent = function (profileContent) {
    var name = _.find(profileContent.names, ['preferred', true]) || profileContent.names[0]
    var email = profileContent.preferredEmail || profileContent.emails[0]

    var title
    if (profileContent.history && profileContent.history.length) {
      var position = _.upperFirst(_.get(profileContent.history, '[0].position', '')).trim()
      var institutionName = _.get(profileContent.history, '[0].institution.name', '').trim()
      var institutionDomain = _.get(
        profileContent.history,
        '[0].institution.domain',
        ''
      ).trim()
      var institution = institutionDomain
        ? institutionName + ' (' + institutionDomain + ')'
        : institutionName
      var separator = position && institution ? ' at ' : ''
      title = position + separator + institution
    } else {
      title = _.last(email.split('@'))
    }

    var expertise = _.flatMap(profileContent.expertise, function (entry) {
      return entry.keywords
    })

    return {
      name: name,
      email: email,
      title: title,
      expertise: expertise,
    }
  }

  var prettyId = function (id, onlyLast) {
    var lowercaseExceptions = [
      'conference',
      'workshop',
      'submission',
      'recommendation',
      'paper',
      'review',
      'reviewer',
      'reviewers',
      'official',
      'public',
      'meta',
      'comment',
      'question',
      'acceptance',
      'pcs',
      'affinity',
      'bid',
      'tpms',
    ]

    if (!id || typeof id !== 'string') {
      return ''
    } else if (id.indexOf('~') === 0 && id.length > 1) {
      return id.substring(1).replace(/_|\d+/g, ' ').trim()
    } else if (id === 'everyone' || id === '(anonymous)' || id === '(guest)' || id === '~') {
      return id
    } else {
      if (id.includes('${')) {
        var match = id.match('{.*}')[0]
        var newMatch = match.replace(/\//g, '.')
        // remove value when it appears at the end of the token
        id = id.replace(match, newMatch).replace('.value}', '}')
      }
      var tokens = id.split('/')
      if (onlyLast) {
        var sliceIndex = _.findIndex(tokens, function (token) {
          return token.match(/^[pP]aper\d+$/)
        })
        tokens = tokens.slice(sliceIndex)
      }

      var transformedId = tokens
        .map(function (token) {
          // API v2 tokens can include strings like ${note.number}
          if (token.includes('${')) {
            token = token
              .replace(/\$\{(\S+)\}/g, function (match, p1) {
                return ' {' + p1.split('.').pop() + '}'
              })
              .replace(/_/g, ' ')
            return token
          }

          token = token
            .replace(/^\./g, '') // journal names start with '.'
            .replace(/\..+/g, '') // remove text after dots, ex: uai.org
            .replace(/^-$/g, '') // remove dashes
            .replace(/_/g, ' ') // replace undescores with spaces

          // if the letters in the token are all lowercase, replace it with empty string
          var lettersOnly = token.replace(/\d|\W/g, '')
          if (
            lettersOnly &&
            lettersOnly === lettersOnly.toLowerCase() &&
            lowercaseExceptions.indexOf(token) < 0
          ) {
            token = ''
          }

          return token
        })
        .filter(function (formattedToken) {
          // filter out any empty tokens
          return formattedToken
        })
        .join(' ')

      return transformedId || id
    }
  }

  var prettyInvitationId = function (id) {
    if (!id) {
      return ''
    }

    // Only take last 2 parts of the invitation
    var tokens = id.split('/').slice(-2)

    tokens = tokens
      .map(function (token) {
        if (token.startsWith('~')) {
          token = prettyId(token)
        }
        return token
          .replace(/^-$/g, '') // remove dashes
          .replace(/_/g, ' ') // replace undescores with spaces
          .replace(/\.\*/g, '') // remove wildcards
          .replace(/^.*[0-9]$/g, '') // remove tokens ending with a digit
          .trim()
      })
      .filter(function (token) {
        return !!token
      })

    return tokens.join(' ')
  }

  var prettyContentValue = function (v) {
    if (_.isString(v)) {
      return v
    } else if (_.isNumber(v) || _.isBoolean(v)) {
      return v.toString()
    } else if (_.isArray(v)) {
      if (_.isObject(v[0])) {
        return JSON.stringify(v, undefined, 4).replace(/"/g, '')
      } else {
        return v.join(', ')
      }
    } else if (_.isObject(v)) {
      return JSON.stringify(v, undefined, 4).replace(/"/g, '')
    } else {
      // null, undefined, function, symbol, etc.
      return ''
    }
  }

  var prettyField = function (fieldName) {
    if (typeof fieldName !== 'string') {
      return ''
    }

    if (fieldName === 'pdf') {
      return 'PDF'
    }

    var words = fieldName
      .replace(/_/g, ' ')
      .split(' ')
      .map(function (word) {
        return word.charAt(0).toUpperCase() + word.substring(1)
      })
    return words.join(' ').trim()
  }

  var forumDate = function (
    createdDate,
    trueCreatedDate,
    modifiedDate,
    trueModifiedDate,
    createdYear,
    pdate,
    withTime = false,
    withTimezone = false
  ) {
    var mdateSettings = {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      ...(withTime && { hour: 'numeric', minute: 'numeric' }),
      ...(withTimezone && { timeZoneName: 'long' }),
    }
    var cdateSettings = {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      ...(withTime && { hour: 'numeric', minute: 'numeric' }),
      ...(withTimezone && { timeZoneName: 'long' }),
    }

    var cdate = createdDate || trueCreatedDate || Date.now()
    var hasYear =
      (typeof createdYear === 'string' && createdYear.length) ||
      (typeof createdYear === 'number' && createdYear > 0)
    var cdateObj = hasYear ? new Date(createdYear) : new Date(cdate)

    // if the cdateObj lacks the precision to represent days/months,
    // remove them from cdateSettings
    if (
      cdateObj.getUTCSeconds() === 0 &&
      cdateObj.getUTCMinutes() === 0 &&
      cdateObj.getUTCHours() === 0 &&
      cdateObj.getUTCDate() === 1
    ) {
      // for some reason, dates are 1-indexed
      delete cdateSettings.day

      if (cdateObj.getUTCMonth() === 0) {
        delete cdateSettings.month
        cdateSettings.timeZone = 'UTC'
      }
    }

    var cdateFormatted = cdateObj.toLocaleDateString('en-GB', cdateSettings)
    var mdate = modifiedDate || trueModifiedDate
    var mdateFormatted = mdate
      ? new Date(mdate).toLocaleDateString('en-GB', mdateSettings)
      : ''

    if (pdate) {
      var pdateFormatted = new Date(pdate).toLocaleDateString('en-GB', mdateSettings)
      var secondaryDate = mdate
        ? `Last Modified: ${mdateFormatted}`
        : `Uploaded: ${cdateFormatted}`
      return `Published: ${pdateFormatted}, ${secondaryDate}`
    }

    var mdateStr = ''
    if (hasYear && cdate === mdate) {
      mdateStr =
        ' (imported: ' + new Date(cdate).toLocaleDateString('en-GB', mdateSettings) + ')'
    } else if (cdate < trueCreatedDate && trueCreatedDate === trueModifiedDate) {
      mdateStr = ' (imported: ' + mdateFormatted + ')'
    } else if (mdate && cdate !== mdate) {
      mdateStr = ' (modified: ' + mdateFormatted + ')'
    }
    return cdateFormatted + mdateStr
  }

  var truncateTitle = function (title, len) {
    len = len || 80
    var index = title.indexOf(' ', len)
    if (index === -1) {
      return title
    }

    return title.substring(0, index) + '&hellip;'
  }

  var getCopiedValues = function (_content, invitationReplyContent) {
    var content = _.cloneDeep(_content) // don't modify the passed in object
    replaceCopiedValues(content, invitationReplyContent, _content)
    return content
  }

  var replaceCopiedValues = function (content, invitationReplyContent, original) {
    _.mapKeys(invitationReplyContent, function (value, key) {
      if (_.has(value, 'value-copied')) {
        // some of the field values are surrounded by curly brackets, remove them
        var field = _.get(value, 'value-copied').replace(/{|}/g, '')
        content[key] = _.get(original, field)
      }

      if (_.has(value, 'values-copied')) {
        // some of the field values are surrounded by curly brackets, remove them
        var values = _.get(value, 'values-copied')
        _.forEach(values, function (v) {
          if (_.startsWith(v, '{')) {
            var field = v.slice(1, -1)
            var fieldValue = _.get(original, field)
            if (!_.isNil(fieldValue)) {
              if (!Array.isArray(fieldValue)) {
                fieldValue = [fieldValue]
              }
              content[key] = _.union(content[key] || [], fieldValue)
            }
          } else {
            content[key] = _.union(content[key] || [], [v])
          }
        })
      }

      if (typeof value === 'object' && !_.isNil(content)) {
        replaceCopiedValues(content[key], value, original)
      }
    })
  }

  var isValidEmail = function (email) {
    // Matches only lowercased emails
    var emailRegex =
      /^[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/

    return emailRegex.test(email)
  }

  var isValidName = function (fullName) {
    return fullName && fullName.length > 2
  }

  var isTildeIdAllowed = function (regex) {
    return regex.indexOf('~.*') !== -1 || regex.indexOf('^~\\S+$') !== -1
  }

  var validate = function (invitation, content, readersWidget) {
    var errorList = []
    var replyContent = invitation.reply.content

    Object.keys(replyContent).forEach(function (fieldName) {
      if (fieldName === 'pdf' && replyContent.pdf.required) {
        if (
          content.pdf &&
          !_.endsWith(content.pdf, '.pdf') &&
          !_.startsWith(content.pdf, '/pdf') &&
          !_.startsWith(content.pdf, 'http')
        ) {
          errorList.push('Uploaded file must have .pdf extension')
        }

        if (!content.pdf && replyContent.pdf['value-regex']) {
          if (replyContent.pdf['value-regex'] === 'upload') {
            errorList.push('You must provide a PDF (file upload)')
          } else if (replyContent.pdf['value-regex'].includes('upload')) {
            errorList.push('You must provide a PDF (either by URL or file upload)')
          } else {
            errorList.push('You must provide a PDF (URL)')
          }
        }
      }

      if (replyContent[fieldName].required && _.isEmpty(content[fieldName])) {
        errorList.push('Field missing: ' + prettyField(fieldName))
      }

      // authors search has pending results to be added
      if (fieldName === 'authorids' && $('div.search-results>div.author-row').length) {
        errorList.push('You have additional authors to be added to authors list')
      }
    })

    if (invitation.reply.readers.hasOwnProperty('values-dropdown')) {
      const inputValues = idsFromListAdder(readersWidget, invitation.reply.readers)
      if (!inputValues.length) {
        errorList.push('Readers can not be empty. You must select at least one reader')
      }
    }

    if (invitation.reply.readers.hasOwnProperty('values-checkbox')) {
      const inputValues = []
      readersWidget.find('.note_content_value input[type="checkbox"]').each(function (i) {
        if ($(this).prop('checked')) {
          inputValues.push($(this).val())
        }
      })
      if (!inputValues.length) {
        errorList.push('Readers can not be empty. You must select at least one reader')
      }
    }

    return errorList
  }

  var addNonreadersICLR = function (readerInputValues, invitation) {
    var nonreaders = []
    if (
      readerInputValues &&
      readerInputValues !== 'everyone' &&
      invitation.id.match(
        /ICLR.cc\/2017\/conference\/-\/paper[0-9]+\/(official|public)\/comment/
      )
    ) {
      var authoridsStr = $(
        'div #note_' +
          invitation.reply.forum +
          ' .note_contents:contains("Authorids") > .note_content_value'
      ).text()
      var authorids = _.map(authoridsStr.split(','), function (i) {
        return i.trim()
      })

      nonreaders = authorids
    }
    return nonreaders
  }

  var getContent = function (invitation, $contentMap) {
    var files = {}
    var errors = []
    var invitationContent = invitation.edit
      ? invitation.edit.note.content
      : invitation.reply.content
    var content = _.reduce(
      invitationContent,
      function (ret, contentObjInInvitation, k) {
        // Let the widget handle it :D and extract the data when we encouter authorids
        const contentObj = invitation.edit
          ? contentObjInInvitation.value
          : contentObjInInvitation
        if (contentObj.hidden && k === 'authors') {
          return ret
        }
        var $inputVal = $contentMap[k].find('.note_content_value[name="' + k + '"]')
        var inputVal = $inputVal.val()

        if (
          contentObj.hasOwnProperty('values-dropdown') ||
          (contentObj.hasOwnProperty('values') && k !== 'authorids')
        ) {
          inputVal = idsFromListAdder($contentMap[k], ret)
        } else if (
          k === 'authorids' &&
          ((contentObj['values-regex'] && isTildeIdAllowed(contentObj['values-regex'])) ||
            contentObj.values)
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
              ret.authors.push(prettyId(authorid))
            }
            ret.authorids.push(authorid)
          })
          return ret
        } else if (contentObj.hasOwnProperty('value-dropdown')) {
          var values = idsFromListAdder($contentMap[k], ret)
          if (values && values.length) {
            inputVal = values[0]
          }
        } else if (contentObj.hasOwnProperty('value-regex')) {
          inputVal = inputVal.trim()
        } else if (contentObj.hasOwnProperty('values-regex')) {
          var inputArray = inputVal.split(',')
          inputVal = _.filter(
            _.map(inputArray, function (s) {
              return s.trim()
            }),
            function (e) {
              return !_.isEmpty(e)
            }
          )
        } else if (contentObj.hasOwnProperty('value-checkbox')) {
          inputVal = $contentMap[k]
            .find('.note_content_value input[type="checkbox"]')
            .prop('checked')
            ? contentObj['value-checkbox']
            : ''
        } else if (contentObj.hasOwnProperty('values-checkbox')) {
          inputVal = []
          $contentMap[k].find('.note_content_value input[type="checkbox"]').each(function (i) {
            if ($(this).prop('checked')) {
              inputVal.push($(this).val())
            }
          })
        } else if (contentObj.hasOwnProperty('value-radio')) {
          var $selection = $contentMap[k].find(
            '.note_content_value input[type="radio"]:checked'
          )
          inputVal = $selection.length ? $selection.val() : ''
        } else if (contentObj.hasOwnProperty('value-dict')) {
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
        } else if (
          contentObj.hasOwnProperty('value-file') ||
          (contentObj['value-regex'] && contentObj['value-regex'] === 'upload')
        ) {
          var $fileSection = $contentMap[k]
          var $fileInput =
            $fileSection &&
            $fileSection.find('input.note_' + k.replace(/\W/g, '_') + '[type="file"]')
          var file = $fileInput && $fileInput.val() ? $fileInput[0].files[0] : null
          var $textInput =
            $fileSection &&
            $fileSection.find('input.note_' + k.replace(/\W/g, '_') + '[type="text"]')
          var url = $textInput && $textInput.val()

          // Check if there's a file. If not, check if there's a url and update ONLY if the new value
          // (url) is different from the current value (inputVal). If the file has been removed by the
          // user set inputVal to and empty string. This is for revisions.
          if (file) {
            inputVal = file.name
            files[k] = file
          } else if (url && (!inputVal || url !== inputVal)) {
            inputVal = url
          } else if ($inputVal.data('fileRemoved')) {
            ret[k] = ''
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

    if (writers && _.has(writers, 'values')) {
      return writers.values
    }

    if (writers && _.has(writers, 'values-regex') && writers['values-regex'] === '~.*') {
      return [user.profile.id]
    }

    return signatures
  }

  var getReaders = function (widget, invitation, signatures, isEdit = false) {
    // eslint-disable-next-line no-nested-ternary
    var readers = invitation.edit
      ? isEdit
        ? invitation.edit.readers
        : invitation.edit.note?.readers
      : invitation.reply.readers
    var inputValues = idsFromListAdder(widget, readers)

    var invitationValues = []
    if (_.has(readers, 'values-dropdown')) {
      invitationValues = readers['values-dropdown'].map(function (v) {
        return _.has(v, 'id') ? v.id : v
      })
    } else if (_.has(readers, 'value-dropdown-hierarchy')) {
      invitationValues = readers['value-dropdown-hierarchy']
    } else if (_.has(readers, 'values-checkbox')) {
      inputValues = []
      widget.find('.note_content_value input[type="checkbox"]').each(function (i) {
        if ($(this).prop('checked')) {
          inputValues.push($(this).val())
        }
      })
      invitationValues = readers['values-checkbox']
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

  var mkNewNoteEditor = function (invitation, forum, replyto, user, options) {
    var params = _.assign(
      {
        onNoteCreated: null,
        onCompleted: null,
        onNoteCancelled: null,
        onValidate: null,
        onError: null,
        isPreview: false,
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

    var contentOrder = order(invitation.reply.content, invitation.id, params.isPreview)
    var $contentMap = _.reduce(
      contentOrder,
      function (ret, k) {
        ret[k] = mkComposerInput(
          k,
          invitation.reply.content[k],
          invitation.reply.content[k]?.default || '',
          { useDefaults: true, user: user, isPreview: params.isPreview }
        )
        return ret
      },
      {}
    )
    var uploadInProgressFields = []

    function buildEditor(readers, signatures) {
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

        var signatureInputValues = idsFromListAdder(signatures, invitation.reply.signatures)
        var readerValues = getReaders(readers, invitation, signatureInputValues)
        var nonReadersValues = null
        if (_.has(invitation, 'reply.nonreaders.values')) {
          nonReadersValues = invitation.reply.nonreaders.values
        }
        // TODO: Temporary ICLR hack
        nonReadersValues = _.union(
          nonReadersValues,
          addNonreadersICLR(readerValues, invitation)
        )
        var writerValues = getWriters(invitation, signatureInputValues, user)

        var errorList = content[2].concat(validate(invitation, content[0], readers))
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

        var note = {
          content: content[0],
          readers: readerValues,
          nonreaders: nonReadersValues,
          signatures: signatureInputValues,
          writers: writerValues,
          invitation: invitation.id,
          forum: forum || invitation.reply.forum,
          replyto: replyto || invitation.reply.replyto,
        }

        if (_.isEmpty(files)) {
          return saveNote(note)
        }

        var onError = function (e) {
          var errorMsg
          if (e.responseJSON && e.responseJSON.message) {
            errorMsg = e.responseJSON.message
          } else if (e.readyState === 0) {
            errorMsg = 'There is an error with the network and the file could not be uploaded'
          } else if (e.message) {
            errorMsg = e.message
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
          // #region parallel upload
          var uploadInProgressField = uploadInProgressFields.find(
            (p) => p.fieldName === fieldName
          )
          if (uploadInProgressField) {
            uploadInProgressField.noteRef = note
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
            return Webfield.sendFileChunk(data, $progressBar).then(
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
                    uploadInProgressField.noteRef.content[fieldName] = result.url
                    updateFileSection(
                      $contentMap[fieldName],
                      fieldName,
                      invitation.reply.content[fieldName],
                      uploadInProgressField.noteRef.content[fieldName]
                    )
                  } else {
                    note.content[fieldName] = result.url
                    updateFileSection(
                      $contentMap[fieldName],
                      fieldName,
                      invitation.reply.content[fieldName],
                      note.content[fieldName]
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
            noteRef: note,
            promiseRef: sendChunksPromiseRef,
          })
          return sendChunksPromiseRef
          // #endregion
        })
        Promise.all(promises).then(
          function () {
            saveNote(note)
          },
          function (e) {
            if (e) onError(e)
          }
        )
      })

      $cancelButton.click(function () {
        const confirmCancel =
          $noteEditor.data('hasUnsavedData') &&
          // eslint-disable-next-line no-alert
          !window.confirm(
            'Any unsaved changes will be lost. Are you sure you want to continue?'
          )
        if (confirmCancel) return

        clearAutosaveData(autosaveStorageKeys)
        if (params.onNoteCancelled) {
          params.onNoteCancelled()
        } else {
          $noteEditor.remove()
        }
      })

      var saveNote = function (note) {
        // apply any 'value-copied' fields
        note = getCopiedValues(note, invitation.reply)
        Webfield.post('/notes', note, { handleErrors: false }).then(
          function (result) {
            clearAutosaveData(autosaveStorageKeys)
            $noteEditor.remove()
            if (params.onNoteCreated) {
              params.onNoteCreated(result)
            }
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
        '<h2 class="note_content_title">New ' + prettyInvitationId(invitation.id) + '</h2>',
        '<div class="required_field">* denotes a required field</div>',
        '<hr class="small">',
        _.values($contentMap),
        readers,
        signatures,
        !params.isPreview && $('<div>', { class: 'row' }).append($submitButton, $cancelButton)
      )
      $noteEditor.data('invitationId', invitation.id)

      autolinkFieldDescriptions($noteEditor)
      var autosaveStorageKeys = setupAutosaveHandlers(
        $noteEditor,
        user,
        replyto + '|new',
        invitation.id
      )

      if (params.onCompleted) {
        if (params.isPreview && $noteEditor.children('div.alert.alert-danger').length) {
          params.onCompleted($('<ul>').append($noteEditor.children('div.alert.alert-danger')))
          return
        }
        params.onCompleted($noteEditor)
      }
    }

    var parentId = forum === replyto ? null : replyto
    var handleError = function (error) {
      if (params.onError) {
        params.onError([error])
      } else {
        promptError(error)
      }
    }

    buildReaders(
      invitation.reply.readers,
      [],
      parentId,
      function (readers, error) {
        if (error && !params.isPreview) {
          return handleError(error)
        }
        buildSignatures(
          invitation.reply.signatures,
          invitation.reply.signatures?.default || [],
          user,
          'signatures',
          params
        )
          .then(function (signatures) {
            buildEditor(readers, signatures)
          })
          .fail(function (error) {
            error =
              error === 'no_results' ? 'You do not have permission to create a note' : error
            handleError(error)
          })
      },
      params
    )
  }

  function buildReaders(fieldDescription, fieldValue, replyto, done, params = {}) {
    if (!fieldDescription) {
      done(undefined, 'Invitation is missing readers')
      return
    }

    var requiredText = $('<span>', { text: '*', class: 'required_field' })
    var setParentReaders = function (parent, fieldDescription, fieldType, done) {
      if (parent) {
        Webfield.get('/notes', { id: parent }).then(function (result) {
          var newFieldDescription = fieldDescription
          if (result.notes.length) {
            var parentReaders = result.notes[0].readers
            if (!_.includes(parentReaders, 'everyone')) {
              newFieldDescription = {
                description: fieldDescription.description,
                default: fieldDescription.default,
              }
              newFieldDescription[fieldType] = parentReaders
              if (!fieldValue.length) {
                fieldValue = newFieldDescription[fieldType]
              }
            }
          }
          done(newFieldDescription)
        })
      } else {
        done(fieldDescription)
      }
    }

    if (_.has(fieldDescription, 'values-regex')) {
      Webfield.get(
        '/groups',
        { regex: fieldDescription['values-regex'] },
        { handleErrors: false }
      ).then(
        function (result) {
          if (_.isEmpty(result.groups)) {
            done(undefined, 'no_results')
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

            var $readers = mkComposerInput('readers', fieldDescription, fieldValue, {
              groups: everyoneList.concat(restOfList),
            })
            $readers.find('.small_heading').prepend(requiredText)
            done($readers)
          }
        },
        function (jqXhr, textStatus) {
          var errorText = Webfield.getErrorFromJqXhr(jqXhr, textStatus)
          done(undefined, errorText)
        }
      )
    } else if (_.has(fieldDescription, 'values-dropdown')) {
      var values = fieldDescription['values-dropdown']
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
            fieldDescription['values-dropdown'] = values
              .slice(0, regexIndex)
              .concat(groups, values.slice(regexIndex + 1))
          } else {
            fieldDescription['values-dropdown'].splice(regexIndex, 1)
          }
          return result.groups
        })
      }
      extraGroupsP.then(function (groups) {
        setParentReaders(
          replyto,
          fieldDescription,
          'values-dropdown',
          function (newFieldDescription) {
            // when replying to a note with different invitation, parent readers may not
            // be in reply's invitation's readers
            var replyValues = _.intersection(
              newFieldDescription['values-dropdown'],
              fieldDescription['values-dropdown']
            )

            // Make sure AnonReviewers are in the dropdown options where '/Reviewers' is in the parent note
            var hasReviewers = _.find(replyValues, function (v) {
              return v.endsWith('/Reviewers')
            })
            var hasAnonReviewers = _.find(replyValues, function (v) {
              return v.includes('/AnonReviewer') || v.includes('/Reviewer_')
            })
            if (hasReviewers && !hasAnonReviewers) {
              fieldDescription['values-dropdown'].forEach(function (value) {
                if (value.includes('AnonReviewer') || value.includes('Reviewer_')) {
                  replyValues.push(value)
                }
              })
            }

            newFieldDescription['values-dropdown'] = replyValues
            if (
              _.difference(newFieldDescription.default, newFieldDescription['values-dropdown'])
                .length !== 0
            ) {
              // invitation default is not in list of possible values
              done(undefined, 'Default reader is not in the list of readers')
            }
            var $readers = mkComposerInput('readers', newFieldDescription, fieldValue)
            $readers.find('.small_heading').prepend(requiredText)
            done($readers)
          }
        )
      })
    } else if (_.has(fieldDescription, 'value-dropdown-hierarchy')) {
      setParentReaders(
        replyto,
        fieldDescription,
        'value-dropdown-hierarchy',
        function (newFieldDescription) {
          var $readers = mkComposerInput('readers', newFieldDescription, fieldValue)
          $readers.find('.small_heading').prepend(requiredText)
          done($readers)
        }
      )
    } else if (_.has(fieldDescription, 'values')) {
      setParentReaders(replyto, fieldDescription, 'values', function (newFieldDescription) {
        var subsetReaders = fieldDescription.values.every(function (val) {
          var found = newFieldDescription.values.indexOf(val) !== -1
          if (!found && val.includes('/Reviewer_')) {
            var hasReviewers = _.find(newFieldDescription.values, function (v) {
              return v.includes('/Reviewers')
            })
            return hasReviewers
          }
          return found
        })
        if (_.isEqual(newFieldDescription.values, fieldDescription.values) || subsetReaders) {
          // for values, readers must match with invitation instead of parent invitation
          var $readers = mkComposerInput('readers', fieldDescription, fieldValue)
          $readers.find('.small_heading').prepend(requiredText)
          done($readers)
        } else {
          done(undefined, 'Can not create note, readers must match parent note')
        }
      })
    } else if (_.has(fieldDescription, 'values-checkbox')) {
      var initialValues = fieldDescription['values-checkbox']
      var promise = $.Deferred().resolve()
      var index = _.findIndex(initialValues, function (g) {
        return g.indexOf('.*') >= 0
      })
      if (index >= 0) {
        var regexGroup = initialValues[index]
        promise = Webfield.get('/groups', { regex: regexGroup }).then(function (result) {
          if (result.groups && result.groups.length) {
            var groups = result.groups.map(function (g) {
              return g.id
            })
            fieldDescription['values-checkbox'] = initialValues
              .slice(0, index)
              .concat(groups, initialValues.slice(index + 1))
          } else {
            fieldDescription['values-checkbox'].splice(index, 1)
          }
        })
      }
      promise.then(function () {
        setParentReaders(
          replyto,
          fieldDescription,
          'values-checkbox',
          function (newFieldDescription) {
            // When replying to a note with different invitation, parent readers may not be
            // in reply's invitation's readers
            var replyValues = _.intersection(
              newFieldDescription['values-checkbox'],
              fieldDescription['values-checkbox']
            )

            // Make sure AnonReviewers are in the dropdown options where '/Reviewers' is in the parent note
            var hasReviewers = _.find(replyValues, function (v) {
              return v.endsWith('/Reviewers')
            })
            var hasAnonReviewers = _.find(replyValues, function (v) {
              return v.includes('/AnonReviewer') || v.includes('/Reviewer_')
            })
            if (hasReviewers && !hasAnonReviewers) {
              fieldDescription['values-checkbox'].forEach(function (value) {
                if (value.includes('AnonReviewer') || value.includes('/Reviewer_')) {
                  replyValues.push(value)
                }
              })
            }

            newFieldDescription['values-checkbox'] = replyValues
            if (
              _.difference(newFieldDescription.default, newFieldDescription['values-checkbox'])
                .length !== 0
            ) {
              // invitation default is not in list of possible values
              done(undefined, 'Default reader is not in the list of readers')
            }
            var $readers = mkComposerInput(
              'readers',
              newFieldDescription,
              fieldValue.length ? fieldValue : newFieldDescription.default,
              { prettyId: true }
            )
            $readers.find('.small_heading').prepend(requiredText)
            done($readers)
          }
        )
      })
    } else {
      var $readers = mkComposerInput('readers', fieldDescription, fieldValue, {
        isPreview: params.isPreview,
      })
      $readers.find('.small_heading').prepend(requiredText)
      done($readers)
    }
  }

  function buildSignatures(
    fieldDescription,
    fieldValue,
    user,
    headingText = 'signatures',
    params = {}
  ) {
    var $signatures
    if (_.has(fieldDescription, 'values-regex')) {
      var currentVal = fieldValue && fieldValue[0]

      if (fieldDescription['values-regex'] === '~.*') {
        if (user && user.profile) {
          var prefId = user.profile.preferredId || user.profile.id
          $signatures = mkDropdownList(
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
            regex: fieldDescription['values-regex'],
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
              var prettyGroupId = prettyId(group.id)
              if (!(prettyGroupId in uniquePrettyIds)) {
                dropdownListOptions.push({
                  id: group.id,
                  description:
                    prettyGroupId +
                    (!singleOption &&
                    !group.id.startsWith('~') &&
                    group.members &&
                    group.members.length === 1
                      ? ' (' + prettyId(group.members[0]) + ')'
                      : ''),
                })
                uniquePrettyIds[prettyGroupId] = group.id
              }
            })
            $signatures = mkDropdownList(
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
      $signatures = mkComposerInput(headingText, fieldDescription, fieldValue, {
        isPreview: params.isPreview,
      })
      return $.Deferred().resolve($signatures)
    }
  }

  var mkNoteEditor = function (note, invitation, user, options) {
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
      return false
    }

    var contentOrder = order(invitation.reply.content, invitation.id)
    var $contentMap = _.reduce(
      contentOrder,
      function (map, fieldName) {
        var fieldContent = _.get(note, ['content', fieldName], '')
        map[fieldName] = mkComposerInput(
          fieldName,
          invitation.reply.content[fieldName],
          fieldContent,
          { note: note, useDefaults: true }
        )
        return map
      },
      {}
    )
    var uploadInProgressFields = []

    function buildEditor(readers, signatures) {
      var $submitButton = $('<button class="btn btn-sm">Submit</button>')
      var $cancelButton = $('<button class="btn btn-sm">Cancel</button>')

      $submitButton.click(function () {
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

        var latestNotePath = params.isReference ? 'references' : 'notes'
        var latestNotePromise = note.id
          ? Webfield.get(
              `/${latestNotePath}`,
              {
                id: note.id,
              },
              {
                handleErrors: false,
              }
            ).then(
              function (result) {
                return result[latestNotePath][0]
              },
              function () {
                return $.Deferred().resolve(note)
              }
            )
          : $.Deferred().resolve(note)
        var noteLatestNoteErrorMessage = `This ${latestNotePath.slice(
          0,
          -1
        )} has been edited since you opened it. Please refresh the page and try again.`

        latestNotePromise.then(function (latestNote) {
          if (note.tmdate && latestNote.tmdate && latestNote.tmdate !== note.tmdate) {
            if (params.onError) {
              params.onError([noteLatestNoteErrorMessage])
            } else {
              promptError(noteLatestNoteErrorMessage)
            }
            $submitButton.prop({ disabled: false }).find('.spinner-small').remove()
            $cancelButton.prop({ disabled: false })
            return
          }
          var content = getContent(invitation, $contentMap)

          var signatureInputValues = idsFromListAdder(signatures, invitation.reply.signatures)
          var readerValues = getReaders(readers, invitation, signatureInputValues)
          var nonreaderValues = null
          if (_.has(invitation, 'reply.nonreaders.values')) {
            nonreaderValues = invitation.reply.nonreaders.values
          }
          var writerValues = getWriters(invitation, signatureInputValues, user)

          var errorList = content[2].concat(validate(invitation, content[0], readers))
          if (params.onValidate) {
            errorList = errorList.concat(params.onValidate(invitation, content[0], note))
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

          var editNote = {
            content: content[0],
            readers: readerValues,
            nonreaders: nonreaderValues,
            signatures: signatureInputValues,
            writers: writerValues,
            invitation: invitation.id,
            forum: note.forum || invitation.reply.forum,
            // For some reason invitation.reply.replyto is null, see scripts
            replyto: note.replyto || invitation.reply.replyto || invitation.reply.forum,
          }

          if (invitation.reply.referent || invitation.reply.referentInvitation) {
            editNote.referent = invitation.reply.referent || note.id
            if (note.updateId) {
              editNote.id = note.updateId
            }
          } else {
            editNote.id = note.id
          }

          if (_.isEmpty(files)) {
            return saveNote(editNote)
          }

          var onError = function (e) {
            var errorMsg
            if (e.responseJSON && e.responseJSON.message) {
              errorMsg = e.responseJSON.message
            } else if (e.readyState === 0) {
              errorMsg =
                'There is an error with the network and the file could not be uploaded'
            } else if (e.message) {
              errorMsg = e.message
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
            // #region parallel upload
            var uploadInProgressField = uploadInProgressFields.find(
              (p) => p.fieldName === fieldName
            )
            if (uploadInProgressField) {
              uploadInProgressField.noteRef = editNote
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
              return Webfield.sendFileChunk(data, $progressBar).then(
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
                      uploadInProgressField.noteRef.content[fieldName] = result.url
                      updateFileSection(
                        $contentMap[fieldName],
                        fieldName,
                        invitation.reply.content[fieldName],
                        uploadInProgressField.noteRef.content[fieldName]
                      )
                    } else {
                      editNote.content[fieldName] = result.url
                      updateFileSection(
                        $contentMap[fieldName],
                        fieldName,
                        invitation.reply.content[fieldName],
                        editNote.content[fieldName]
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
              noteRef: editNote,
              promiseRef: sendChunksPromiseRef,
            })
            return sendChunksPromiseRef
            // #endregion
          })
          Promise.all(promises).then(
            function () {
              saveNote(editNote)
            },
            function (e) {
              if (e) onError(e)
            }
          )
        })
      })

      $cancelButton.click(function () {
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
        clearAutosaveData(autosaveStorageKeys)
      })

      var saveNote = function (note) {
        // apply any 'value-copied' fields
        note = getCopiedValues(note, invitation.reply)

        Webfield.post('/notes', note, { handleErrors: false }).then(
          function (result) {
            if (params.onNoteEdited) {
              params.onNoteEdited(result)
            }
            $noteEditor.remove()
            clearAutosaveData(autosaveStorageKeys)
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

      // For reference invitations show that a new reference is being created
      var editorAction = invitation.reply.referent === note.id ? 'New' : 'Edit'
      var $noteEditor = $('<div>', { class: 'note_editor existing panel' }).append(
        '<h2 class="note_content_title">' +
          editorAction +
          ' ' +
          prettyInvitationId(invitation.id) +
          '</h2>',
        '<div class="required_field">* denotes a required field</div>',
        '<hr class="small">',
        _.values($contentMap),
        readers,
        signatures,
        $('<div>', { class: 'row' }).append($submitButton, $cancelButton)
      )
      $noteEditor.data('invitationId', invitation.id)

      autolinkFieldDescriptions($noteEditor)
      var autosaveStorageKeys = setupAutosaveHandlers(
        $noteEditor,
        user,
        note.id,
        invitation.id
      )

      if (params.onCompleted) {
        params.onCompleted($noteEditor)
      }
    }

    var parentId = note.forum === note.replyto ? null : note.replyto
    var handleError = function (error) {
      if (params.onError) {
        params.onError([error])
      } else {
        promptError(error)
      }
    }
    buildReaders(invitation.reply.readers, note.readers, parentId, function (readers, error) {
      if (error) {
        return handleError(error)
      }
      buildSignatures(invitation.reply.signatures, note.signatures, user)
        .then(function (signatures) {
          buildEditor(readers, signatures)
        })
        .fail(function (error) {
          error =
            error === 'no_results' ? 'You do not have permission to create a note' : error
          handleError(error)
        })
    })
  }

  // Hide fields from note editor form. Does not entirely remove them from the DOM
  var hideNoteEditorFields = function (container, fieldNames) {
    if (!(container && fieldNames && fieldNames.length)) {
      return
    }

    var $container = container instanceof jQuery ? container : $(container)
    fieldNames.forEach(function (fieldName) {
      $container
        .find('[name="' + fieldName + '"]')
        .closest('.row')
        .hide()
    })
  }

  var setupAutosaveHandlers = function ($noteEditor, user, noteId, invitationId) {
    var autosaveStorageKeys = []
    var userIdForKey = !user || _.startsWith(user.id, 'guest_') ? 'guest' : user.id
    var keyPrefix = [userIdForKey, noteId, invitationId].join('|')

    $noteEditor.find('input.autosave-enabled, textarea.autosave-enabled').each(function () {
      var uniqueKey = keyPrefix + '|' + $(this).attr('name')
      autosaveStorageKeys.push(uniqueKey)

      var savedVal = localStorage.getItem(uniqueKey)
      if (savedVal) {
        $(this).val(savedVal).trigger('keyup')
      }

      $(this).on(
        'keyup',
        _.throttle(function () {
          try {
            localStorage.setItem(uniqueKey, $(this).val())
            $noteEditor.data('hasUnsavedData', true)
          } catch (error) {
            // eslint-disable-next-line no-console
            console.warn(error)
          }
        }, 2000)
      )
    })

    return autosaveStorageKeys
  }

  var clearAutosaveData = function (autosaveStorageKeys) {
    autosaveStorageKeys.forEach(function (storageKey) {
      localStorage.removeItem(storageKey)
    })
  }

  var paginationLinks = function (totalNotes, notesPerPage, pageNum, baseUrl, displayOptions) {
    if (totalNotes <= notesPerPage) {
      return ''
    }

    var overflow = totalNotes % notesPerPage === 0 ? 0 : 1
    var pageCount = Math.floor(totalNotes / notesPerPage) + overflow
    pageNum = pageNum || 1
    if (pageNum < 0) {
      pageNum = pageCount + pageNum + 1
    }
    var pageListLength = Math.min(14, pageCount + 4)
    var pageList = Array(pageListLength)

    // Create entries for Next, Previous, First and Last links
    pageList[0] = {
      disabled: pageNum === 1,
      label: '&laquo;',
      number: 1,
      extraClasses: 'left-arrow',
    }
    pageList[1] = {
      disabled: pageNum === 1,
      label: '&lsaquo;',
      number: pageNum - 1,
      extraClasses: 'left-arrow',
    }
    pageList[pageListLength - 2] = {
      disabled: pageNum === pageCount,
      label: '&rsaquo;',
      number: pageNum + 1,
      extraClasses: 'right-arrow',
    }
    pageList[pageListLength - 1] = {
      disabled: pageNum === pageCount,
      label: '&raquo;',
      number: pageCount,
      extraClasses: 'right-arrow',
    }

    // Create entries for numbered page links, try to display an equal number of
    // pages on either side of the current page
    var counter = Math.min(Math.max(pageNum - 5, 1), Math.max(pageCount - 9, 1))
    for (var i = 2; i < pageListLength - 2; i++) {
      pageList[i] = { active: counter === pageNum, label: counter, number: counter }
      counter++
    }

    var templateParams = {
      pageList: pageList,
      baseUrl: baseUrl,
      options: displayOptions,
    }

    if (displayOptions?.showCount) {
      var startCount = (pageNum - 1) * notesPerPage + 1
      var endCount = (pageNum - 1) * notesPerPage + notesPerPage
      if (endCount > totalNotes) endCount = totalNotes
      templateParams.countText = `Showing ${startCount}${
        notesPerPage === 1 ? '' : `-${endCount}`
      } of ${totalNotes}`
    }
    return Handlebars.templates['partials/paginationLinks'](templateParams)
  }

  var mkInvitationButton = function (invitation, onClick, options) {
    var defaults = {
      largeLabel: false,
    }

    options = _.assign(defaults, options)
    if (!invitation) {
      return null
    }

    var $buttonPanel = $(
      Handlebars.templates.invitationButton({
        invitationId: invitation.id,
        options: options,
      })
    )
    $buttonPanel.find('button').on('click', onClick)

    return $buttonPanel
  }

  var mkDownloadLink = function (noteId, fieldName, fieldValue, options) {
    var defaults = {
      isReference: false,
    }
    options = _.defaults(options, defaults)

    var fileExtension = fieldValue.split('.').pop()
    var urlPath = options.isReference ? '/references/attachment' : '/attachment'
    var href = urlPath + '?id=' + noteId + '&name=' + fieldName
    return (
      '<a href="' +
      href +
      '" class="attachment-download-link" title="Download ' +
      prettyField(fieldName) +
      '" target="_blank">' +
      '<span class="glyphicon glyphicon-download-alt" aria-hidden="true"></span> &nbsp;' +
      fileExtension +
      '</a>'
    )
  }

  var mkSmallHeading = function (text) {
    return $('<div>', { class: 'small_heading', text: text })
  }

  var iTerm = function (text) {
    return $('<span>', { class: 'important_term' }).text(text)
  }

  var iMess = function (text) {
    return $('<span>', { class: 'important_message' }).text(text)
  }

  // Temporarily duplicated from forum-utils.js
  // TODO: remove this function when new forum launches
  var getInvitationColors = function (prettyId) {
    const styleMap = {
      Comment: { backgroundColor: '#bfb', color: '#2c3a4a' },
      'Public Comment': { backgroundColor: '#bfb', color: '#2c3a4a' }, // Same as Comment
      'Official Comment': { backgroundColor: '#bbf', color: '#2c3a4a' },
      Review: { backgroundColor: '#fbb', color: '#2c3a4a' },
      'Official Review': { backgroundColor: '#fbb', color: '#2c3a4a' }, // Same as Review
      'Meta Review': { backgroundColor: '#fbf', color: '#2c3a4a' },
      'Secondary Meta Review': { backgroundColor: '#fbf', color: '#2c3a4a' }, // Same as Meta Review
      Decision: { backgroundColor: '#bff', color: '#2c3a4a' },
    }
    if (styleMap[prettyId]) {
      return styleMap[prettyId]
    }

    let sum = 0
    for (let i = 0; i < prettyId.length; i += 1) {
      sum += prettyId.charCodeAt(i)
    }

    const additionalColors = [
      '#8cf',
      '#8fc',
      '#8ff',
      '#8cc',
      '#fc8',
      '#f8c',
      '#cf8',
      '#c8f',
      '#cc8',
      '#ccf',
    ]
    const selectedColor = additionalColors[sum % additionalColors.length]
    return { backgroundColor: selectedColor, color: '#2c3a4a' }
  }

  var getNoteCreationDate = function (note) {
    // Priority order
    // note.cdate
    // note.tcdate

    if (note.cdate) {
      return new Date(note.cdate)
    }

    if (note.tcdate) {
      return new Date(note.tcdate)
    }

    return new Date()
  }

  // DEPRECATED: use Webfield.ui.header instead
  var mkHostHeader = function (h1, h2, h3, url, deadline) {
    return $(
      Handlebars.templates.venueHeader({
        title: h1,
        subtitle: h2,
        location: h3,
        website: url,
        deadline: deadline,
        noIcons: true,
      })
    )
  }

  var setupMarked = function () {
    var renderer = new marked.Renderer()

    renderer.image = function ({ href, title, text }) {
      if (href.startsWith('/images/')) {
        var titleAttr = title ? 'title="' + title + '" ' : ''
        var classAttr = href.endsWith('_icon.svg') ? 'class="icon" ' : ''
        return '<img src="' + href + '" alt="' + text + '" ' + titleAttr + classAttr + '/>'
      }
      return $('<div />')
        .text('<img src="' + href + '" alt="' + text + '" title="' + title + '">')
        .html()
    }
    renderer.checkbox = function (checked) {
      if (checked) return '[x]'
      return '[ ]'
    }
    renderer.html = function (html) {
      return $('<div />').text(html).html()
    }

    // For details on options see https://marked.js.org/#/USING_ADVANCED.md#options
    marked.setOptions({
      baseUrl: null,
      breaks: false,
      gfm: true,
      headerIds: false,
      langPrefix: 'language-',
      mangle: false,
      renderer: renderer,
    })
  }

  return {
    mkDropdown: mkDropdown,
    mkMapAdder: mkMapAdder,
    mapFromMapAdder: mapFromMapAdder,
    mkInputSection: mkInputSection,
    mkTagInput: mkTagInput,
    valFromInputSection: valFromInputSection,
    mkComposerInput: mkComposerInput,
    mkComposerContentInput: mkComposerContentInput,
    mkNewNoteEditor: mkNewNoteEditor,
    mkNoteEditor: mkNoteEditor,
    mkNotePanel: mkNotePanel,
    mkSection: mkSection,
    mkBlockItem: mkBlockItem,
    mkItem: mkItem,
    mkListItems: mkListItems,
    mkSmallHeading: mkSmallHeading,
    mkInvitationButton: mkInvitationButton,
    mkDownloadLink: mkDownloadLink,
    hideNoteEditorFields: hideNoteEditorFields,
    deleteOrRestoreNote: deleteOrRestoreNote,
    isValidEmail: isValidEmail,
    formatProfileContent: formatProfileContent,
    prettyId: prettyId,
    prettyInvitationId: prettyInvitationId,
    prettyContentValue: prettyContentValue,
    prettyField: prettyField,
    prettyReadersList: prettyReadersList,
    forumDate: forumDate,
    generateNoteTitle: generateNoteTitle,
    truncateTitle: truncateTitle,
    autolinkHtml: autolinkHtml,
    paginationLinks: paginationLinks,
    mkHostHeader: mkHostHeader,
    iTerm: iTerm,
    iMess: iMess,
    getCopiedValues: getCopiedValues,
    freeTextTagWidgetLabel: freeTextTagWidgetLabel,
    setupMarked: setupMarked,
    getInvitationColors: getInvitationColors,
    mkTitleComponent: mkTitleComponent,
    mkDropdownAdder: mkDropdownAdder,
    buildSignatures: buildSignatures,
    autolinkFieldDescriptions: autolinkFieldDescriptions,
    isTildeIdAllowed: isTildeIdAllowed,
    mkSearchProfile: mkSearchProfile,
    mkFileInput: mkFileInput,
    idsFromListAdder: idsFromListAdder,
    getReaders: getReaders,
    getWriters: getWriters,
    showConfirmDeleteModal: showConfirmDeleteModal,
    setupAutosaveHandlers: setupAutosaveHandlers,
    clearAutosaveData: clearAutosaveData,
    updateFileSection: updateFileSection,
    updatePdfSection: updatePdfSection,
    mkDropdownList: mkDropdownList,
  }
})()
