/**
 * Changes: none
 */
Handlebars.registerHelper('truncate', function(str, len) {
  str = Handlebars.Utils.escapeExpression(str);

  if (typeof str === 'string' && str.length > len && len > 0) {
    str += ' ';

    var newStr = str.substr(0, len);
    var lastSpace = newStr.lastIndexOf(' ');
    if (lastSpace !== -1 && lastSpace > Math.floor(len * 0.75)) {
      newStr = str.substr(0, lastSpace);
    }

    return new Handlebars.SafeString(newStr + '&hellip;');
  }
  return new Handlebars.SafeString(str);
});

Handlebars.registerHelper('toLowerCase', function(value) {
  return (value && _.isString(value)) ? value.toLowerCase() : '';
});

Handlebars.registerHelper('encodeURI', function(value) {
  return (value && _.isString(value)) ? encodeURIComponent(value) : '';
});

Handlebars.registerHelper('upperFirst', function(value) {
  return (value && _.isString(value)) ? _.upperFirst(value) : '';
});

Handlebars.registerHelper('kebabCase', function(value) {
  return (value && _.isString(value)) ? _.kebabCase(value) : '';
});

Handlebars.registerHelper('round', function(value, precision) {
  return (value && _.isFinite(value)) ? _.round(value, precision) : '';
});

Handlebars.registerHelper('startsWith', function(string, val) {
  return _.startsWith(string, val);
});

Handlebars.registerHelper('isEqual', function(a, b) {
  return _.isEqual(a, b);
});

Handlebars.registerHelper('isEmpty', function(obj) {
  return _.isEmpty(obj);
});

Handlebars.registerHelper('isString', function(value) {
  return _.isString(value);
});

Handlebars.registerHelper('join', function(val, delimiter, start, end) {
  var arr = [].concat(val);
  delimiter = typeof delimiter === 'string' ? delimiter : ', ';
  start = start || 0;
  end = end || arr.length;

  return arr.map(_.trim).slice(start, end).join(delimiter);
});

Handlebars.registerHelper('prettyId', function(idStr) {
  return typeof idStr === 'string' ? view.prettyId(idStr) : '';
});

Handlebars.registerHelper('prettyInvitationId', function(invitationId, options) {
  if (typeof invitationId !== 'string') {
    return '';
  }

  var paperStr = '';
  if (_.get(options, 'hash.includePaperNum')) {
    var invMatches = invitationId.match(/\/(Paper\d+)\//);
    if (invMatches) {
      paperStr = invMatches[1] + ' ';
      var anonReviewerMatches = invitationId.match(/\/(AnonReviewer\d+|Reviewer_\w+)\//);
      if (anonReviewerMatches) {
        paperStr = paperStr + anonReviewerMatches[1].replace('_', ' ') + ' ';
      }
    }
  }

  var entityStr = '';
  var entities = ['Reviewers', 'Authors', 'Area_Chairs', 'Program_Chairs', 'Emergency_Reviewers', 'Senior_Area_Chairs', 'Action_Editors'];
  var groupSpecifier = invitationId.split('/-/')[0].split('/').pop();
  if (_.includes(entities, groupSpecifier)) {
    entityStr = groupSpecifier.replace(/_/g, ' ').slice(0, -1) + ' ';
  }

  return paperStr + entityStr + view.prettyInvitationId(invitationId);
});

Handlebars.registerHelper('prettyField', function(fieldNameStr) {
  return view.prettyField(fieldNameStr);
});

Handlebars.registerHelper('prettyContentValue', view.prettyContentValue);

Handlebars.registerHelper('prettyScoreName', function(fieldNameStr) {
  if (typeof fieldNameStr !== 'string') {
    return '';
  }

  var prettyStr = fieldNameStr.split('_').join(' ');
  if (prettyStr === 'tpms score') {
    return 'TPMS score';
  }
  return prettyStr.charAt(0).toUpperCase() + prettyStr.substring(1);
});

Handlebars.registerHelper('prettyList', function(idArr) {
  if (!_.isArray(idArr) || !idArr.length) {
    return '';
  }

  var prettyArr = idArr.map(function(id) { return view.prettyId(id); });
  if (prettyArr.length === 1) {
    return prettyArr[0];
  } else {
    return prettyArr.slice(0, -1).join(',') + ' and ' + prettyArr.slice(-1);
  }
});

Handlebars.registerHelper('pdfUrl', function(note, isReference) {
  if (!note.content) {
    return '';
  }

  var urlPath = isReference ? `${note.version === 2 ? '/notes/edits/pdf' : '/references/pdf'}` : '/pdf';
  var pdfValue = note.version === 2 ? note.content.pdf?.value : note.content.pdf
  return _.startsWith(pdfValue, '/pdf') ? urlPath + '?id=' + note.id : pdfValue;
});

Handlebars.registerHelper('forumDate', view.forumDate);

Handlebars.registerHelper('formattedDate', function(modifiedDate, trueModifiedDate, options) {
  if (_.isEmpty(options)) {
    options = trueModifiedDate;
    trueModifiedDate = null;
  }
  var hash = options.hash ? options.hash : {};
  var dateToDisplay = modifiedDate || trueModifiedDate;
  var defaultDisplay = hash.default || '';

  if (!dateToDisplay) {
    return defaultDisplay;
  }

  return new Date(dateToDisplay).toLocaleDateString('en-US', {
    hour: 'numeric',
    minute: 'numeric',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    timeZoneName: 'short',
  });
});

Handlebars.registerHelper('noteTitle', function(invitation, signatures) {
  return view.generateNoteTitle(invitation, signatures);
});

Handlebars.registerHelper('standardDate', function(timestamp) {
  var dateSettings = {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  };

  return new Date(timestamp).toLocaleDateString('en-GB', dateSettings);
});

Handlebars.registerHelper('dateTime', function(timestamp) {
  var dateSettings = {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit'
  };

  // Temporarily use en-US localization so client and server dates match
  return new Date(timestamp).toLocaleDateString('en-US', dateSettings);
});

Handlebars.registerHelper('timeAgo', function(modifiedDate) {

  var oneSecond = 1000;
  var oneMinute = 60 * oneSecond;
  var oneHour = 60 * oneMinute;
  var oneDay = 24 * oneHour;
  var oneMonth = 30 * oneDay;
  var oneYear = 365 * oneDay;

  var now = new Date();
  var mDate = new Date(modifiedDate);
  var difference = Math.abs((now.getTime() - mDate.getTime()));

  var diffYears = Math.round(difference/(oneYear));
  if (diffYears > 0) {
    return diffYears + (diffYears === 1 ? ' year' : ' years');
  }

  var diffMonths = Math.round(difference/(oneMonth));
  if (diffMonths > 0) {
    return diffMonths + (diffMonths === 1 ? ' month' : ' months');
  }

  var diffDays = Math.round(difference/(oneDay));
  if (diffDays > 0) {
    return diffDays + (diffDays === 1 ? ' day' : ' days');
  }

  var diffHours = Math.round(difference/(oneHour));
  if (diffHours > 0) {
    return diffHours + (diffHours === 1 ? ' hr' : ' hrs');
  }

  var diffMinutes = Math.round(difference/(oneMinute));
  if (diffMinutes > 0) {
    return diffMinutes + (diffMinutes === 1 ? ' min' : ' mins');
  }

  var diffSeconds = Math.round(difference/(oneSecond));
  if (diffSeconds > 0) {
    return diffSeconds + (diffSeconds === 1 ? ' second' : ' seconds');
  } else if (diffSeconds === 0) {
    return ' 1 second';
  }

  return '';
});

Handlebars.registerHelper('noteAuthors', function(content, signatures, details) {
  var html = '';
  var privateLabel = false;

  if (details && details.original && !_.isEqual(details.original.content.authors, content.authors)) {
    content = details.original.content;
    privateLabel = true;
  }

  var authors = content && content.authors;
  var authorids = content && content.authorids;

  if (_.isArray(authors) && authors.length) {
    if (_.isArray(authorids) && authorids.length) {
      html = authors.map(function(author, i) {
        var authorId;

        author = Handlebars.Utils.escapeExpression(author);
        authorId = Handlebars.Utils.escapeExpression(authorids[i]);
        if (authorId && authorId.indexOf('~') === 0) {
          return '<a href="/profile?id='+ encodeURIComponent(authorId) +
            '" class="profile-link" data-toggle="tooltip" data-placement="top" title="'+ authorId +
            '">'+ author +'</a>';
        } else if (authorId && authorId.indexOf('@') !== -1) {
          return '<a href="/profile?email='+ encodeURIComponent(authorId) +
            '" class="profile-link" data-toggle="tooltip" data-placement="top" title="'+ authorId +
            '">'+ author +'</a>';
        } else if (authorId && authorId.indexOf('http') === 0) {
          return '<a href="'+ authorId +
            '" class="profile-link" data-toggle="tooltip" data-placement="top" title="'+ authorId +
            '">'+ author +'</a>';
        } else {
          return author;
        }
      }).join(', ');

    } else {
      html = authors.map(function(author, i) {
        return Handlebars.Utils.escapeExpression(author);
      }).join(', ');
    }
  } else {
    if ((_.isArray(signatures) && signatures.length)) {
      html = signatures.map(function(authorId, i) {

        var author = view.prettyId(authorId);
        if (authorId && authorId.indexOf('~') === 0) {
          return '<a href="/profile?id='+ encodeURIComponent(authorId) +
            '" class="profile-link" data-toggle="tooltip" data-placement="bottom" title="'+ authorId +
            '">'+ author +'</a>';
        } else if (authorId && authorId.indexOf('@') !== -1) {
          return '<a href="/profile?email='+ encodeURIComponent(authorId) +
            '" class="profile-link" data-toggle="tooltip" data-placement="bottom" title="'+ authorId +
            '">'+ author +'</a>';
        } else {
          return author;
        }
      }).join(', ');
    }
  }

  if (privateLabel) {
    html = html + ' <span class="private-author-label">(privately revealed to you)</span>';
  }

  return new Handlebars.SafeString(html);
});

Handlebars.registerHelper('noteAuthorsV2', function (readers, content, signatures) {
  var html = '';
  var privateLabel = false;

  if (
    content?.authorids?.readers &&
    !content.authorids.readers.includes('everyone') &&
    !_.isEqual(readers?.sort(), content.authorids.readers.sort())
  ) {
    // note reader and author reader are not the same
    privateLabel = true
  }

  var authors = content?.authors?.value;
  var authorids = content?.authorids?.value;

  if (_.isArray(authors) && authors.length) {
    if (_.isArray(authorids) && authorids.length) {
      html = authors.map(function(author, i) {
        var authorId;

        author = Handlebars.Utils.escapeExpression(author);
        authorId = Handlebars.Utils.escapeExpression(authorids[i]);
        if (authorId && authorId.indexOf('~') === 0) {
          return '<a href="/profile?id='+ encodeURIComponent(authorId) +
            '" class="profile-link" data-toggle="tooltip" data-placement="top" title="'+ authorId +
            '">'+ author +'</a>';
        } else if (authorId && authorId.indexOf('@') !== -1) {
          return '<a href="/profile?email='+ encodeURIComponent(authorId) +
            '" class="profile-link" data-toggle="tooltip" data-placement="top" title="'+ authorId +
            '">'+ author +'</a>';
        } else if (authorId && authorId.indexOf('http') === 0) {
          return '<a href="'+ authorId +
            '" class="profile-link" data-toggle="tooltip" data-placement="top" title="'+ authorId +
            '">'+ author +'</a>';
        } else {
          return author;
        }
      }).join(', ');

    } else {
      html = authors.map(function(author, i) {
        return Handlebars.Utils.escapeExpression(author);
      }).join(', ');
    }
  } else {
    if ((_.isArray(signatures) && signatures.length)) {
      html = signatures.map(function(authorId, i) {

        var author = view.prettyId(authorId);
        if (authorId && authorId.indexOf('~') === 0) {
          return '<a href="/profile?id='+ encodeURIComponent(authorId) +
            '" class="profile-link" data-toggle="tooltip" data-placement="bottom" title="'+ authorId +
            '">'+ author +'</a>';
        } else if (authorId && authorId.indexOf('@') !== -1) {
          return '<a href="/profile?email='+ encodeURIComponent(authorId) +
            '" class="profile-link" data-toggle="tooltip" data-placement="bottom" title="'+ authorId +
            '">'+ author +'</a>';
        } else {
          return author;
        }
      }).join(', ');
    }
  }

  if (privateLabel) {
    html = html + ' <span class="private-author-label">(privately revealed to you)</span>';
  }

  return new Handlebars.SafeString(html);
});

Handlebars.registerHelper('noteContentCollapsible', function(noteObj, options) {
  if (_.isEmpty(noteObj)) {
    return '';
  }

  // Get order of content fields from invitation. If no invitation is provided,
  // use default ordering of content object.
  var invitation;
  if (noteObj.details) {
    if (!_.isEmpty(noteObj.details.originalInvitation)) {
      invitation = noteObj.details.originalInvitation;
    } else if (!_.isEmpty(noteObj.details.invitation)) {
      invitation = noteObj.details.invitation;
    }
  } else if (!_.isEmpty(options.hash.invitation)) {
    invitation = options.hash.invitation;
  }

  var contentKeys = Object.keys(noteObj.content);
  var contentOrder = [];
  if (noteObj.version === 2) {
    contentOrder = noteObj.details?.presentation
      ? Object.values(noteObj.details.presentation).sort((a, b) => a?.order - b?.order).map(p => p.name)
      : contentKeys
  } else {
    contentOrder = invitation
      ? _.union(order(invitation.reply.content, invitation.id), contentKeys)
      : contentKeys;
  }

  var omittedContentFields = [
    'title', 'authors', 'author_emails', 'authorids', 'pdf',
    'verdict', 'paperhash', 'ee', 'html', 'year', 'venue', 'venueid'
  ].concat(options.hash.additionalOmittedFields || []);

  var contents = [];
  contentOrder.forEach(function(fieldName) {
    if (omittedContentFields.includes(fieldName) || fieldName.startsWith('_')) {
      return;
    }

    var valueString = view.prettyContentValue(noteObj.version === 2 ? noteObj.content[fieldName]?.value : noteObj.content[fieldName]);
    if (!valueString) {
      return;
    }

    var renderMarkdown;
    var renderMarkdownInline;
    if (noteObj.version === 2) {
      var presentationDetails = noteObj.details?.presentation?.find(p => p.name === fieldName) ?? {};
      renderMarkdown = presentationDetails.markdown || presentationDetails.markdownInline;
      renderMarkdownInline = presentationDetails.markdownInline;
    } else {
      var invitationField = invitation?.reply?.content?.[fieldName] ?? {};
      renderMarkdown = invitationField?.markdown;
      var re = new RegExp('^' + (invitationField['value-regex'] ?? '').replace(/\{\d+,\d+\}$/, '') + '$');
      var newlineAllowed = re.test('\n');
      renderMarkdownInline = !newlineAllowed;
    }

    var urlRegex = /^(?:(?:https?):\/\/)(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,}))\.?)(?::\d{2,5})?(?:[/?#]\S*)?$/i;
    var profileRegex = /\B~[^\d\s]+\_[^\d\s]+[0-9]+/ig;
    // Build download links or render markdown if enabled
    if (valueString.indexOf('/attachment/') === 0) {
      valueString = view.mkDownloadLink(noteObj.id, fieldName, valueString);
    } else if (renderMarkdown) {
      valueString = DOMPurify.sanitize(renderMarkdownInline ? marked.parseInline(valueString) : marked(valueString));
    } else if (urlRegex.test(valueString)) {
      var url = valueString.startsWith('https://openreview.net') ? valueString.replace('https://openreview.net', '') : valueString
      valueString = `<a href="${url}" target="_blank" rel="nofollow noreferrer">${url}</a>`;
    } else if (profileRegex.test(valueString)){
      valueString = valueString.replaceAll(profileRegex, p=>`<a href="/profile?id=${p}" target="_blank">${view.prettyId(p)}</a>`);
    } else {
      valueString = Handlebars.Utils.escapeExpression(valueString);
    }

    if (
      noteObj.version === 2 &&
      noteObj.content[fieldName]?.readers &&
      !noteObj.content[fieldName].readers.includes('everyone') &&
      !_.isEqual(noteObj.readers?.sort(), noteObj.content[fieldName].readers.sort())
    ) {
      var tooltip = `privately revealed to ${noteObj.content[fieldName].readers.map(p =>view.prettyId(p)).join(', ')}`
      var privateLabel = `<span class="private-contents-icon glyphicon glyphicon-eye-open" title="${tooltip}" data-toggle="tooltip" data-placement="bottom"/>`
      valueString = `${privateLabel} ${valueString}`
    }

    contents.push({
      fieldName: fieldName,
      fieldValue: new Handlebars.SafeString(valueString),
      markdownRendered: renderMarkdown
    });
  });
  if (!contents.length) {
    return '';
  }

  // Render to HTML
  var contentHtml = Handlebars.templates['partials/noteContent'](contents);
  var html;
  if (options.hash.noCollapse) {
    html = '<div class="note-contents-collapse">' + contentHtml + '</div>';
  } else {
    // Need a random id to prevent collisions if there are 2 of the same note displayed
    var collapseId = noteObj.id.replace('~', '') + '-details-' + Math.floor(Math.random() * 1000);
    html = '<a href="#' + collapseId + '" class="note-contents-toggle" role="button" data-toggle="collapse" aria-expanded="false">Show details</a>' +
      '<div class="collapse" id="' + collapseId + '">' +
        '<div class="note-contents-collapse">' + contentHtml + '</div>' +
      '</div>';
  }

  return new Handlebars.SafeString(html);
});

var orderCache =  {};
var order = function(replyContent, invitationId) {
  if (invitationId && orderCache[invitationId]) {
    return orderCache[invitationId];
  }

  var orderedFields = _.map(
    _.sortBy(
      _.map(replyContent, function(fieldProps, fieldName) {
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

Handlebars.registerHelper('tagWidget', function(tagInvitation, noteTags) {
  noteTags = noteTags || [];

  var userTag = _.find(noteTags, function(t) {
    return t.invitation === tagInvitation.id;
  });

  var html = singleTagWidget(userTag, tagInvitation);
  return new Handlebars.SafeString(html);
});

Handlebars.registerHelper('tagWidgets', function(noteTags, noteTagInvitations, tagInvitations) {
  noteTags = _.isArray(noteTags) ? noteTags.slice() : [];
  tagInvitations = _.compact(_.concat(noteTagInvitations, tagInvitations));

  var tagsWithoutInvitations = [];
  var tagsWithInvitations = [];
  var invitationsWithoutTags = [];
  var addPairToCollection = function(collection, pair) {
    var tags = pair[0];
    var idx = _.findIndex(collection, function(element) {
      var currentTags = element[0];
      return (tags[0].invitation === currentTags[0].invitation && tags[0].signatures[0] === currentTags[0].signatures[0]);
    });

    if (idx >= 0) {
      collection[idx][0] = _.union(collection[idx][0], tags);
    } else {
      collection.push(pair);
    }
  };

  noteTags.forEach(function(tag) {
    var idx = _.findIndex(tagInvitations, function(inv) {
      return inv.id === tag.invitation;
    });
    if (tag.tauthor && idx > -1) {
      addPairToCollection(tagsWithInvitations, [[tag], tagInvitations[idx]]);
    } else {
      addPairToCollection(tagsWithoutInvitations, [[tag], null]);
    }
  });
  tagInvitations = _.difference(tagInvitations, tagsWithInvitations.map(function(t) { return t[1]; }));
  if (tagInvitations.length) {
    invitationsWithoutTags = _.map(tagInvitations, function(inv) {
      return [[], inv];
    });
  }

  var tagPairs = invitationsWithoutTags.concat(tagsWithInvitations, tagsWithoutInvitations);
  var renderedWidgetArr = _.map(tagPairs, function(tagPair) {
    return singleTagWidget(tagPair[0], tagPair[1]);
  });

  // Only show first 3 tags in list and hide rest in collapsible div
  var widgetHtml;
  var maxTagsToShow = 3;
  if (renderedWidgetArr.length <= maxTagsToShow) {
    widgetHtml = renderedWidgetArr.join('\n');
  } else {
    var randomId = 'note-' + Math.floor(Math.random() * 1000) + '-tags';
    var numHiddenTags = renderedWidgetArr.length - maxTagsToShow;
    widgetHtml = renderedWidgetArr.slice(0, maxTagsToShow).join('\n') +
      '<div id="' + randomId + '" class="collapse note-tags-overflow">' +
        renderedWidgetArr.slice(maxTagsToShow).join('\n') +
      '</div>' +
      '<div>' +
        '<a href="#' + randomId + '" class="note-tags-toggle" role="button" ' +
        'data-toggle="collapse" aria-expanded="false">Show ' + numHiddenTags + ' more...</a>' +
      '</div>';
  }
  return new Handlebars.SafeString(widgetHtml);
});

Handlebars.registerHelper('recommendWidget', function(tagInvitation, userTag) {
  tagInvitation = tagInvitation || {};
  userTag = userTag || {};

  var tagObj = {
    id: userTag.id || null,
    invitationId: tagInvitation.id || null,
    value: userTag.tag || null,
    signatures: userTag.signatures || [],
    options: ['-2', '-1', '0', '+1', '+2'] // TODO: specify these in the invitation
  };
  var label = tagInvitation.reply.content.tag.description || view.prettyInvitationId(tagInvitation.id);

  var html = Handlebars.templates.tagWidget_radio({  // jshint ignore:line
    tag: tagObj,
    options: {
      label: label
    }
  });

  return new Handlebars.SafeString(html);
});

function singleTagWidget(userTags, tagInvitation) {
  var userTag = (userTags && userTags.length && userTags[0]) || {};
  tagInvitation = tagInvitation || {};

  var displayOptions;
  var html;
  var label;

  var tagObj = {
    id: userTag.id || null,
    invitationId: tagInvitation.id || userTag.invitation || null,
    value: userTag.tag || userTag.label || null,
    weight: userTag.weight || null,
    signatures: userTag.signatures || []
  };

  if (!_.isEmpty(tagInvitation)) {
    if (_.has(tagInvitation, 'reply.content.tag.value-dropdown')) {
      // Tags that are dropdowns (for example reviewer bids)
      displayOptions = {
        label: view.prettyInvitationId(tagInvitation.id),
        placeholder: tagInvitation.reply.content.tag.default || tagInvitation.reply.content.tag.description || 'Select value',
        readOnly: false
      };
      html = Handlebars.templates.tagWidget_bid({  // jshint ignore:line
        tag: _.assign({}, tagObj, { options: tagInvitation.reply.content.tag['value-dropdown'] }),
        options: displayOptions
      });

    } else if (_.has(tagInvitation, 'reply.content.tag.value-radio')) {
      // Tags that are toggle-able radio buttons groups (also used for bids)
      displayOptions = {
        label: tagInvitation.reply.content.tag.description || view.prettyInvitationId(tagInvitation.id),
        placeholder: null,
      };
      html = Handlebars.templates.tagWidget_radio({  // jshint ignore:line
        tag: _.assign({}, tagObj, { options: tagInvitation.reply.content.tag['value-radio'] }),
        options: displayOptions,
        isTagWidget: true
      });

    } else if (_.has(tagInvitation, 'reply.content.tag.value-regex')) {
      // Tags that are free text tags (currently only non-editable are supported)
      label = view.freeTextTagWidgetLabel(tagObj.invitationId, tagObj.signatures);

      displayOptions = {
        label: label,
        placeholder: '',
        extraClasses: '',
        readOnly: true
      };
      if (displayOptions.readOnly && !userTag) {
        // Don't display read only tags that only have an invitation and no value
        html = '';
      } else {
        html = Handlebars.templates.tagWidget_text({  // jshint ignore:line
          tag: tagObj,
          options: displayOptions
        });
      }
    } else if (_.has(tagInvitation, 'reply.content.tag.values-dropdown')) {

      tagObj = {
        id: null,
        invitationId: tagInvitation.id || userTag.invitation || null,
        value: _.map(userTags, function(value) { return { id: value.id, tag: value.tag, name: value.tag }; }),
        signatures: userTag.signatures || []
      };

      // Tags that are dropdown with multiselection enabled
      displayOptions = {
        placeholder: view.prettyId(tagInvitation.id),
        readOnly: false,
        onChange: null
      };
      html = Handlebars.templates.tagWidget_recommend({  // jshint ignore:line
        tag: _.assign({}, tagObj, { options: tagInvitation.reply.content.tag['values-dropdown'] }),
        options: displayOptions
      });
    } else if (_.has(tagInvitation, 'reply.content.label.value-radio')) {
      // Edges that are toggle-able radio buttons groups (used for bids)
      displayOptions = {
        label: tagInvitation.reply.content.label.description || view.prettyInvitationId(tagInvitation.id),
        placeholder: null,
      };
      html = Handlebars.templates.tagWidget_radio({  // jshint ignore:line
        tag: _.assign({}, tagObj, { options: tagInvitation.reply.content.label['value-radio'] }),
        options: displayOptions,
        extraClasses: 'edge-widget',
        isTagWidget: false
      });
    }
  } else if (!_.isEmpty(userTag)) {
    // Read-Only Free Text Tag
    label = view.freeTextTagWidgetLabel(tagObj.invitationId, tagObj.signatures);

    displayOptions = {
      label: label,
      placeholder: '',
      extraClasses: '',
      readOnly: true
    };
    tagObj.value = _.map(userTags, function(value) { return view.prettyId(value.tag) || value.label || value.weight; }).join(', ');
    html = Handlebars.templates.tagWidget_text({  // jshint ignore:line
      tag: tagObj,
      options: displayOptions
    });
  }

  return html;
}

Handlebars.registerHelper('forumReaders', function(readersArr) {
  if (!_.isArray(readersArr)) {
    return '';
  }

  var readersHtml = view.prettyReadersList(readersArr);
  return new Handlebars.SafeString(readersHtml);
});

Handlebars.registerHelper('forumReadersIcon', function(readersArr) {
  if (!_.isArray(readersArr)) {
    return '';
  }

  var readersHtml;
  if (_.includes(readersArr, 'everyone')) {
    readersHtml = '<span class="readers-icon glyphicon glyphicon-globe" data-toggle="tooltip" data-placement="top" title="Readers: Everyone"></span>';
  } else {
    var readersArrFiltered = _.without(readersArr.map(function(id) {
      return view.prettyId(id);
    }), 'Super User', '', null, undefined);
    readersHtml = '<span class="readers-icon glyphicon glyphicon-user" data-toggle="tooltip" ' +
      'data-placement="top" title="Readers: ' + readersArrFiltered.join(', ') + '"></span>';
    if (readersArrFiltered.length > 1) {
      readersHtml += ' &times; ' + readersArrFiltered.length;
    }
  }
  return new Handlebars.SafeString(readersHtml);
});

var urlFromGroupId = function(groupId, editMode) {
  var commonGroups = ['everyone', '(anonymous)', '(guest)'];
  if (!groupId || commonGroups.indexOf(groupId) !== -1) {
    return '';
  } else if (groupId.indexOf('~') === 0) {
    return '/profile?id=' + groupId;
  } else if (groupId.indexOf('@') !== -1) {
    return '/profile?email=' + groupId;
  }
  return '/group' + (editMode ? '/edit' : '') + '?id=' + groupId;
};

Handlebars.registerHelper('groupUrl', urlFromGroupId);

Handlebars.registerHelper('groupIdList', function(groupIds) {
  if (!_.isArray(groupIds)) {
    return '';
  }

  var commonGroups = ['everyone', '(anonymous)', '(guest)', '~', '~Super_User1'];
  var linksHtml = groupIds.map(function(groupId) {
    return commonGroups.indexOf(groupId) === -1 ?
      '<a href="' + urlFromGroupId(groupId) + '" target="_blank">' + view.prettyId(groupId) + '</a>' :
      view.prettyId(groupId);
  }).join(', ');

  return new Handlebars.SafeString(linksHtml);
});

Handlebars.registerHelper('pagination', function(totalNotes, notesPerPage, pageNum, baseUrl) {
  return new Handlebars.SafeString(view.paginationLinks(
    totalNotes, notesPerPage, pageNum, baseUrl
  ));
});

Handlebars.registerHelper('timezoneDropdown', function(options) {
  var allTimezones = [
    { name: '(GMT -12:00) Eniwetok, Kwajalein', value: 'Etc/GMT+12'},
    { name: '(GMT -11:00) Midway Island, Samoa', value: 'Pacific/Samoa'},
    { name: '(GMT -10:00) Hawaii', value: 'Etc/GMT+10'},
    { name: '(GMT -9:00) Alaska', value: 'Etc/GMT+9'},
    { name: '(GMT -8:00) Pacific Time (US &amp; Canada)', value: 'Etc/GMT+8'},
    { name: '(GMT -7:00) Mountain Time (US &amp; Canada)', value: 'Etc/GMT+7'},
    { name: '(GMT -6:00) Central Time (US &amp; Canada), Mexico City', value: 'Etc/GMT+6'},
    { name: '(GMT -5:00) Eastern Time (US &amp; Canada), Bogota, Lima', value: 'Etc/GMT+5'},
    { name: '(GMT -4:30) Caracas', value: 'America/Caracas'},
    { name: '(GMT -4:00) Atlantic Time (Canada), Puerto Rico, La Paz', value: 'Etc/GMT+4'},
    { name: '(GMT -3:30) Newfoundland', value: 'Canada/Newfoundland'},
    { name: '(GMT -3:00) Brazil, Buenos Aires, Georgetown', value: 'America/Argentina/Buenos_Aires'},
    { name: '(GMT -2:00) Mid-Atlantic', value: 'Etc/GMT+2'},
    { name: '(GMT -1:00) Azores, Cape Verde Islands', value: 'Atlantic/Azores'},
    { name: '(GMT) Western Europe Time, London, Lisbon, Casablanca', value: 'UTC'},
    { name: '(GMT +1:00) Brussels, Copenhagen, Madrid, Paris', value: 'Europe/Paris'},
    { name: '(GMT +2:00) Kaliningrad, South Africa', value: 'Europe/Kaliningrad'},
    { name: '(GMT +3:00) Baghdad, Riyadh, Moscow, St. Petersburg', value: 'Europe/Moscow'},
    { name: '(GMT +3:30) Tehran', value: 'Asia/Tehran'},
    { name: '(GMT +4:00) Abu Dhabi, Muscat, Baku, Tbilisi', value: 'Asia/Muscat'},
    { name: '(GMT +4:30) Kabul', value: 'Asia/Kabul'},
    { name: '(GMT +5:00) Ekaterinburg, Islamabad, Karachi, Tashkent', value: 'Asia/Yekaterinburg'},
    { name: '(GMT +5:30) Bombay, Calcutta, Madras, New Delhi', value: 'Asia/Calcutta'},
    { name: '(GMT +5:45) Kathmandu, Pokhara', value: 'Asia/Kathmandu'},
    { name: '(GMT +6:00) Almaty, Dhaka, Colombo', value: 'Asia/Dhaka'},
    { name: '(GMT +6:30) Yangon, Mandalay', value: 'Asia/Yangon'},
    { name: '(GMT +7:00) Bangkok, Hanoi, Jakarta', value: 'Asia/Bangkok'},
    { name: '(GMT +8:00) Beijing, Perth, Singapore, Hong Kong', value: 'Asia/Hong_Kong'},
    { name: '(GMT +8:45) Eucla', value: 'Australia/Eucla'},
    { name: '(GMT +9:00) Tokyo, Seoul, Osaka, Sapporo, Yakutsk', value: 'Asia/Tokyo'},
    { name: '(GMT +9:30) Adelaide, Darwin', value: 'Australia/Adelaide'},
    { name: '(GMT +10:00) Eastern Australia, Guam, Vladivostok', value: 'Pacific/Guam'},
    { name: '(GMT +10:30) Lord Howe Island', value: 'Australia/Lord_Howe'},
    { name: '(GMT +11:00) Magadan, Solomon Islands, New Caledonia', value: 'Asia/Magadan'},
    { name: '(GMT +11:30) Norfolk Island', value: 'Pacific/Norfolk'},
    { name: '(GMT +12:00) Auckland, Wellington, Fiji, Kamchatka', value: 'Pacific/Fiji'},
    { name: '(GMT +12:45) Chatham Islands', value: 'Pacific/Chatham'},
    { name: '(GMT +13:00) Apia, Nukualofa', value: 'Pacific/Apia'},
    { name: '(GMT +14:00) Line Islands, Tokelau', value: 'Etc/GMT-14'}
  ];

  var offsetMinutes = (new Date()).getTimezoneOffset();
  var sign = offsetMinutes > 0 ? '-' : '+';
  var formattedMinutes = offsetMinutes % 60 ? offsetMinutes % 60 + '' : '00';
  var userOffsetStr = offsetMinutes === 0 ?
    '(GMT)' :
    '(GMT ' + sign + Math.floor(offsetMinutes / 60) + ':' + formattedMinutes + ')';

  var optionsHtml = allTimezones.map(function(tz) {
    var selected = _.startsWith(tz.name, userOffsetStr) ? 'selected data-user-default="true"' : '';
    return '<option value="' + tz.value + '" ' + selected + '>' + tz.name + '</option>';
  }).join('\n');
  var nameAttr = options.hash.name ? ' name="' + options.hash.name + '"' : '';
  var output = '<select' + nameAttr + ' class="form-control ' + options.hash.class + '">' +
    optionsHtml +
    '</select>';

  return new Handlebars.SafeString(output);
});

// Matching Browser
Handlebars.registerHelper('authorsList', function(authors) {
  var output = '';
  if (!authors || !authors.length) {
    return output;
  }

  var name = authors[0];
  output += name;

  if (authors.length > 1) {
    output += (', ' + authors[1]);
  }

  if (authors.length > 2) {
    output += ', <a href="#" class="more-authors">+ '+ (authors.length - 1) +' More</a>';

    var moreNames = [];
    for (var i = 2; i < authors.length; i++) {
      name = authors[i];
      moreNames.push(name);
    }
    output += '<span style="display: none;">'+ moreNames.join(', ') +'</span>';
  }

  return new Handlebars.SafeString(output);
});

Handlebars.registerHelper('edgeBrowserUrl', function(configNoteId, configNoteContent) {
  // For matches utilizing the new edge system
  if (configNoteContent.hasOwnProperty('scores_specification')) {
    var browseInvitations = Object.keys(configNoteContent.scores_specification);
    var referrerText = 'all assignments for ' + view.prettyId(configNoteContent.match_group);
    var referrerUrl = '/assignments?group=' + configNoteContent.match_group;
    var assignmentLabel = encodeURIComponent(configNoteContent.title)

    return '/edges/browse' +
      '?traverse=' + configNoteContent.assignment_invitation + ',label:' + assignmentLabel +
      '&edit=' + configNoteContent.assignment_invitation + ',label:' + assignmentLabel +
      '&browse=' + configNoteContent.aggregate_score_invitation + ',label:' + assignmentLabel +
      ';' + browseInvitations.join(';') +
      ';' + configNoteContent.conflicts_invitation +
      (configNoteContent.custom_max_papers_invitation ? ';' + configNoteContent.custom_max_papers_invitation + ',head:ignore' : '') +
      (configNoteContent.custom_load_invitation ? ';' + configNoteContent.custom_load_invitation + ',head:ignore' : '') +
      '&referrer=' + encodeURIComponent('[' + referrerText + '](' + referrerUrl + ')');
  }

  // For old matches using metadata notes
  return '/assignments/browse?id=' + configNoteId;
});


/**
 * @name .inflect
 * @param {Number} `count`
 * @param {String} `singular` The singular form
 * @param {String} `plural` The plural form
 * @param {String} `include`
 * @return {String}
 */
Handlebars.registerHelper('inflect', function(count, singular, plural, include) {
  count = typeof count === 'number' ? count : 0;
  var word = count === 1 ? singular : plural;
  if (!include) {
    return word;
  }
  return count + ' ' + word;
});

/**
 * Block helper that renders a block if `a` is **equal to** `b`.
 * If an inverse block is specified it will be rendered when falsy.
 *
 * @name .is
 * @param {any} `a`
 * @param {any} `b`
 * @param {Object} `options` Handlebars provided options object
 * @return {String}
 * @block
 * @api public
 */
Handlebars.registerHelper('is', function(a, b, options) {
  if (arguments.length === 2) {
    options = b;
    b = options.hash.compare;
  }
  if (a === b) {
    return options.fn(this);
  }
  return options.inverse(this);
});

/**
 * Block helper that renders a block if `a` is **not equal to** `b`.
 * If an inverse block is specified it will be rendered when falsy.
 *
 * @name .isnt
 * @param {String} `a`
 * @param {String} `b`
 * @param {Object} `options` Handlebars provided options object
 * @return {String}
 * @block
 * @api public
 */
Handlebars.registerHelper('isnt', function(a, b, options) {
  if (arguments.length === 2) {
    options = b;
    b = options.hash.compare;
  }
  if (a !== b) {
    return options.fn(this);
  }
  return options.inverse(this);
});

/**
 * Block helper that renders a block if `a` is **greater than** `b`.
 *
 * If an inverse block is specified it will be rendered when falsy.
 * You may optionally use the `compare=""` hash argument for the
 * second value.
 *
 * @param {String} `a`
 * @param {String} `b`
 * @param {Object} `options` Handlebars provided options object
 * @return {String} Block, or inverse block if specified and falsey.
 */
Handlebars.registerHelper('gt', function(a, b, options) {
  if (arguments.length === 2) {
    options = b;
    b = options.hash.compare;
  }
  if (a > b) {
    return options.fn(this);
  }
  return options.inverse(this);
});

/**
 * Block helper that renders the block if an array has the
 * given `value`. Optionally specify an inverse block to render
 * when the array does not have the given value.
 *
 * Given the array `['a', 'b', 'c']`:
 *
 * ```handlebars
 * {{#inArray array "d"}}
 *   foo
 * {{else}}
 *   bar
 * {{/inArray}}
 * ```
 *
 * @name .inArray
 * @param {Array} `array`
 * @param {any} `value`
 * @param {Object} `options`
 * @return {String}
 * @block
 * @api public
 */
Handlebars.registerHelper('inArray', function(array, value, options) {
  if (_.includes(array, value)) {
    return options.fn(this);
  }
  return options.inverse(this);
});

Handlebars.registerHelper('debug', function(optionalValue) {
  console.log('Current Context');
  console.log('====================');
  console.log(this);

  if (optionalValue) {
    console.log('Value');
    console.log('====================');
    console.log(optionalValue);
  }
});

Handlebars.registerHelper('getAnonId', function(varName,memberId,memberAnonIdMap,options){
  if(!options.data.root){
    options.data.root={}
  }
  options.data.root[varName]=memberAnonIdMap.get(memberId)
})

// Register Handlebars partials
Handlebars.registerPartial('noteContent', Handlebars.templates['partials/noteContent']);

Handlebars.registerPartial('noteBasic', Handlebars.templates['partials/noteBasic']);
Handlebars.registerPartial('noteBasicV2', Handlebars.templates['partials/noteBasicV2']);
Handlebars.registerPartial('noteList', Handlebars.templates['partials/noteList']);

Handlebars.registerPartial('noteActivity', Handlebars.templates['partials/noteActivity']);
Handlebars.registerPartial('noteActivityV2', Handlebars.templates['partials/noteActivityV2']);
Handlebars.registerPartial('activityList', Handlebars.templates['partials/activityList']);

Handlebars.registerPartial('noteTask', Handlebars.templates['partials/noteTask']);
Handlebars.registerPartial('taskList', Handlebars.templates['partials/taskList']);

Handlebars.registerPartial('groupMembersTable', Handlebars.templates['partials/groupMembersTable']);
Handlebars.registerPartial('groupMembersTableRow', Handlebars.templates['partials/groupMembersTableRow']);
Handlebars.registerPartial('groupInfoTable', Handlebars.templates['partials/groupInfoTable']);
Handlebars.registerPartial('invitationInfoTable', Handlebars.templates['partials/invitationInfoTable']);

Handlebars.registerPartial('spinner', Handlebars.templates.spinner);
