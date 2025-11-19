/* globals $, _: false */
/* globals view: false */
/* globals translateErrorMessage: false */

// Global helper functions (main.js)
window.serializeUrlParams = function (obj) {
  return decodeURIComponent($.param(_.omitBy(obj, _.isNil)))
}

window.parseUrlParams = function (urlStr) {
  if (typeof urlStr !== 'string') {
    return {}
  }

  urlStr = urlStr.trim().replace(/^\?/, '')
  if (!urlStr) {
    return {}
  }

  return urlStr
    .trim()
    .split('&')
    .reduce(function (ret, param) {
      var parts = param.replace(/\+/g, ' ').split('=')
      ret[parts[0]] = parts[1] === undefined ? null : decodeURIComponent(parts[1])
      return ret
    }, {})
}

window.translateErrorMessage = function (error) {
  var topic = error && error.path ? [view.iTerm(error.path)] : ''
  var buildFeebackModalLink = function (linkText, formFields) {
    // to remove when profile edit pr is ok
    return $('<a>', {
      href: '#',
      class: 'action-link',
      'data-toggle': 'modal',
      'data-target': '#feedback-modal',
    })
      .text(linkText)
      .click(function () {
        $('#feedback-modal').find('[name="from"]').val(formFields.from)
        $('#feedback-modal').find('[name="subject"]').val(formFields.subject)
        $('#feedback-modal').find('[name="message"]').val(formFields.message)
      })
  }

  var type2Message = {
    expired: [view.iMess(' has expired')],
    notString: [view.iMess(' is not a string')],
    notEmail: [view.iMess(' is not a valid email address')],
    notValidSyntax: [view.iMess(' does not meet syntax requirements')],
    notArray: [view.iMess(' is not an array')],
    notObject: [view.iMess(' is not an object')],
    forbidden: [
      view.iMess(' ' + error.value + ' is not accessible by user '),
      view.iTerm(error.user),
    ],
    notSignatory: _.isEmpty(error.value)
      ? [view.iMess(' is missing')]
      : [
          view.iMess(' ' + error.value[0] + ' is not permitted for user '),
          view.iTerm(error.user),
        ],
    notForum: [
      view.iMess(' is not a forum of '),
      view.iTerm(error.value2),
      view.iMess(' in '),
      view.iMess(error.path2),
    ],
    notMatch: [view.iMess(' does not meet requirements')],
    missing: [view.iMess(' is missing')],
    fileTooLarge: [view.iMess(' file is too large')],
    invalidFileType: [view.iMess(' is the wrong file type')],
    invalidInvitation: [view.iMess(' is not a valid invitation')],
    alreadyConfirmed: [
      view.iMess(' is already associated with another OpenReview profile, '),
      $('<a>', {
        href: '/profile?id=' + error.value,
        title: 'View profile',
        target: '_blank',
        class: 'action-link',
      }).text(error.value),
      view.iMess(
        '. To merge this profile with your account, please click here to submit a support request: '
      ),
      buildFeebackModalLink('Merge Profiles', {
        from: error.user,
        subject: 'Merge Profiles',
        message:
          'Hi OpenReview Support,\n\nPlease merge the profiles with the following usernames:\n' +
          error.value2 +
          '\n' +
          error.value +
          '\n\nThank you.',
      }),
    ],
    'Invalid Field': [view.iMess(' is invalid')],
    'Not Found': [view.iMess(' could not be found')],
    'cannot override final field': [view.iMess(' is a final field and cannot be edited')],
    'missing required fields': [view.iMess(' is missing')],
    tooMany: [view.iMess(': too many replies')],
  }

  if (_.has(type2Message, error.type)) {
    return _.flatten([topic, type2Message[error.type]])
  } else if (_.isString(error)) {
    return view.iMess(error)
  } else if (error.name && error.name === 'error') {
    return view.iMess(error.errors[0])
  } else {
    return view.iMess('Something went wrong :(')
  }
}

// Dropdowns
$(document).on('click', function (event) {
  if (!$(event.target).closest('.dropdown').length) {
    $('.dropdown .dropdown_content').hide()
  }
})

$('#content').on('focusout', '.dropdown_content', (e) => {
  if (
    e.target.nextSibling === null &&
    !$(e.relatedTarget?.parentElement).hasClass('dropdown_content')
  ) {
    $('.dropdown .dropdown_content').hide()
  }
})

// Show/hide details link
$('#content').on('show.bs.collapse', function (e) {
  var $div = $(e.target)
  var $a
  if ($div.hasClass('note-tags-overflow')) {
    $a = $div.next().children('a').eq(0)
    $a.text('Hide tags')
  } else if ($div.attr('id') === 'child-groups-overflow') {
    $a = $div.parent().next().children('a').eq(0)
    $a.text('Hide child groups')
  } else if ($div.attr('id') === 'related-invitations-overflow') {
    $a = $div.parent().next().children('a').eq(0)
    $a.text('Hide related invitations')
  } else if ($div.attr('id') === 'signed-notes-overflow') {
    $a = $div.parent().next().children('a').eq(0)
    $a.text('Hide signed notes')
  } else {
    $a = $div.prev()
    if ($a.hasClass('note-contents-toggle')) {
      $a.text('Hide details')
    }
  }
})

$('#content').on('hide.bs.collapse', function (e) {
  var $div = $(e.target)
  var $a
  if ($div.hasClass('note-tags-overflow')) {
    $a = $div.next().children('a').eq(0)
    $a.text('Show ' + $div.find('.tag-widget').length + ' more...')
  } else if ($div.attr('id') === 'child-groups-overflow') {
    $a = $div.parent().next().children('a').eq(0)
    $a.text('Show all child groups...')
  } else if ($div.attr('id') === 'related-invitations-overflow') {
    $a = $div.parent().next().children('a').eq(0)
    $a.text('Show all related invitations...')
  } else if ($div.attr('id') === 'signed-notes-overflow') {
    $a = $div.parent().next().children('a').eq(0)
    $a.text('Show all signed notes...')
  } else {
    $a = $div.prev()
    if ($a.hasClass('note-contents-toggle')) {
      $a.text('Show details')
    }
  }
})
