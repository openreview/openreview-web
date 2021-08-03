var tokenize = function(text) {
  return text
    .toLowerCase()
    .replace(/'\"/g, '')
    .replace(/\W/g, ' ')
    .replace(/\s\s+/g, ' ')
    .split(' ');
};
var isTermSearched = false;

var truncate = function(label, boldTerm) {
  var emphasisRegex = new RegExp(boldTerm + '.*', 'i');
  var m = label.match(emphasisRegex);
  var maxCharLength = 85;
  var newLabel;

  if (m && m.index && label.length > maxCharLength) {

    var beforeTerm = label.split(boldTerm)[0]; // the words in the label before the bold term
    var afterTerm = label.split(boldTerm)[1]; // the words in the label after the bold term

    var beforeWords = beforeTerm.split(' ');
    var ellipses = beforeWords.length === 1 ? '' : '&hellip;';
    var boldChars = '<strong></strong>';

    var prefix = ellipses + beforeWords[beforeWords.length - 1];
    var suffix = afterTerm.slice(0, maxCharLength - (boldTerm.length - boldChars.length) - prefix.length);

    var t = beforeWords.length - 2;
    while ((prefix + boldTerm + suffix).length < maxCharLength) {
      prefix = ellipses + beforeWords.slice(t, beforeWords.length - 1).join(' ') + ' ';
      t = t - 1;
    }

    newLabel = prefix + boldTerm + suffix;
  } else {
    newLabel = label;
  }
  return newLabel;
};

var emphasize = function(label, searchTerm) {
  var termRegex = new RegExp(searchTerm + '.*', 'i');
  var m = label.match(termRegex);
  var boldTerm = m ? '<strong>' + m.input.slice(m.index, m.index + searchTerm.length) + '</strong>' : '<strong>' + searchTerm + '</strong>';
  var newLabel;

  if (m && m.index !== undefined) {
    newLabel = label.slice(0, m.index) + boldTerm + label.slice(m.index + searchTerm.length, label.length);
  } else {
    newLabel = label;
  }
  return truncate(newLabel, boldTerm);
};

// Input: an array containing the content objects in the response (result.notes)
// Output: a list of unique tokens that match the termRegex
var getTokenObjects = function(docArray, searchTerm) {
  var contentArray = _.map(docArray, function(docObj) {
    return { content: docObj.content, version: docObj.version };
  });
  var termRegex = new RegExp(searchTerm + '.*', 'i');

  var tokens = _.uniq(_.filter(_.flattenDeep(_.map(contentArray, function(contentObj) {
    return _.without(_.map(contentObj.content, function(val) {
      if (contentObj.version) val = val?.value
      if (_.isArray(val)) {
        return val;
      } else if (typeof val === 'string') {
        return tokenize(val);
      } else {
        return null;
      }
    }), null);
  })), function(token) {
    try {
      return token.match(termRegex);
    } catch (e) {
      // TODO: objects should be filtered out already
      return false;
    }
  }));

  var autocompleteObjects = _.map(tokens, function(token) {
    return {
      value: token,
      label: emphasize(token, searchTerm),
      section: 'tokens'
    };
  });

  return autocompleteObjects;
};

var contentToString = function(stringOrArray) {
  if (_.isArray(stringOrArray)) {
    return stringOrArray.join(', ');
  } else if (_.isString(stringOrArray)) {
    return stringOrArray;
  } else {
    return '';
  }
};

var getTitleObjects = function(docArray, searchTerm) {
  var termRegex = new RegExp(_.escapeRegExp(searchTerm) + '.*', 'i');
  return _.filter(_.map(docArray, function(docObj) {
    var contentObj = docObj.content;
    var title = docObj.version ? contentObj.title?.value : contentObj.title;
    var authors = docObj.version ? contentObj.authors?.value : contentObj.authors;
    return {
      value: _.isEmpty(title) ? '' : title,
      forum: _.has(docObj, 'forum') ? docObj.forum : '',
      id: docObj.id,
      label: _.isEmpty(title) ? '' : emphasize(title, searchTerm),
      subtitle: _.isEmpty(authors) ? '' : emphasize(contentToString(authors), searchTerm),
      authors: _.isEmpty(authors) ? '' : authors,
      section: 'titles'
    };
  }), function(titleObj) {
    return (!_.isEmpty(titleObj.value) && titleObj.value.match(termRegex)) || (!_.isEmpty(titleObj.authors) && contentToString(titleObj.authors).match(termRegex));
  });
};

module.exports = {
  getTokenObjects: getTokenObjects,
  getTitleObjects: getTitleObjects,
};
