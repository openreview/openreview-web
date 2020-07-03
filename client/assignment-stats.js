/**
 * Adapted from public/js/pages/assignmentsStats.js
 *
 * Changes:
 * - removed code that has been converted to react component (set banner content)
 * - removed references to window.assignmentConfigNote
 * - added method runAssignmentsStats to chain method calls
 */

var Discrete = 'discrete';
var Continuous = 'continuous';
var Scalar = 'scalar';

var useEdges = true;
var buildEdgeBrowserUrl;

var loadFromNotes = function(assignmentConfigNote) {
  return Webfield.getAll('/notes', {
    invitation: assignmentConfigNote.assignment_invitation,
    'content.title': assignmentConfigNote.title
  }).then(function(notes) {
    var assignmentMap = _.flatMap(notes, function(note) {
      return _.map(note.content.assignedGroups, function(group) {
        var otherScores = _.fromPairs(_.map(group.scores, function(v, k) {
          return [k, _.toNumber(v) || 0];
        }));

        return {
          groupId: group.userId,
          paperId: note.forum,
          score: _.toNumber(group.finalScore) || 0,
          otherScores: otherScores
        };
      });
    });
    return [assignmentMap, [], []];
  });
};

var loadFromEdges = function(assignmentConfigNote) {
  var paperInvitationElements = assignmentConfigNote.paper_invitation.split('&');
  var getNotesArgs = {invitation: paperInvitationElements[0]};
  paperInvitationElements.slice(1).forEach(function(filter) {
    var filterElements = filter.split('=');
    getNotesArgs[filterElements[0]] = filterElements[1];
  });
  var papersP = Webfield.getAll('/notes', getNotesArgs);
  var usersP = Webfield.get('/groups', {id: assignmentConfigNote.match_group})
  .then(function(result) {
    return _.get(result, 'groups[0].members');
  });

  var assignmentsP = Webfield.getAll('/edges', {
    invitation: assignmentConfigNote.assignment_invitation,
    label: assignmentConfigNote.title,
    groupBy: 'head',
    select: 'tail,weight'
  }, 'groupedEdges');

  var bidInvitation = '';
  var recommendationInvitation = '';
  for (var key in assignmentConfigNote.scores_specification) {
    if (_.endsWith(key, 'Bid')) {
      bidInvitation = key;
    }
    if (_.endsWith(key, 'Recommendation')) {
      recommendationInvitation = key;
    }
  }

  var bidsP = $.Deferred().resolve([]);
  if (bidInvitation.length) {
    bidsP = Webfield.getAll('/edges', {
      invitation: bidInvitation,
      groupBy: 'head',
      select: 'tail,label'
    }, 'groupedEdges');
  }

  var recommendationsP = $.Deferred().resolve([]);
  if (recommendationInvitation.length) {
    recommendationsP = Webfield.getAll('/edges', {
      invitation: recommendationInvitation,
      groupBy: 'head',
      select: 'tail,weight'
    }, 'groupedEdges');
  }

  return $.when(usersP, papersP, assignmentsP, bidsP, recommendationsP)
  .then(function(users, papers, assignments, bids, recommendations) {
    var paperIds = {};
    var userIds = {};
    var bidDict = {};
    papers.forEach(function(note) {
      paperIds[note.id] = note;
    });
    users.forEach(function(member) {
      userIds[member] = member;
    });
    bids.forEach(function(groupedEdge) {
      var paperId = groupedEdge.id.head;
      bidDict[paperId] = {};
      groupedEdge.values.forEach(function(value) {
        if (paperId in paperIds) {
          bidDict[paperId][value.tail] = value.label;
        }
      });
    });

    var recommendationDict = {};
    recommendations.forEach(function(groupedEdge) {
      var paperId = groupedEdge.id.head;
      recommendationDict[paperId] = {};
      groupedEdge.values.forEach(function(value) {
        if (paperId in paperIds) {
          recommendationDict[paperId][value.tail] = value.weight;
        }
      });
    });

    var usersWithAssignments = new Set();
    var papersWithAssignments = new Set();
    var assignmentMap = _.flatMap(assignments, function(groupedEdge) {
      var paperId = groupedEdge.id.head;
      var paperBids = bidDict[paperId] || {};
      var paperRecommendations = recommendationDict[paperId] || {};
      var validGroupedEdges = _.filter(groupedEdge.values, function(value) {
        return (paperId in paperIds) && (value.tail in userIds);
      });
      return _.map(validGroupedEdges, function(value) {
        var otherScores = {};
        if (value.tail in paperBids) {
          otherScores.bid  = paperBids[value.tail];
        }
        if (value.tail in paperRecommendations) {
          otherScores.recommendation = paperRecommendations[value.tail];
        } else {
          otherScores.recommendation = 0;
        }
        papersWithAssignments.add(paperId);
        usersWithAssignments.add(value.tail);
        return {
          groupId: value.tail,
          paperId: paperId,
          score: value.weight,
          otherScores: otherScores
        };
      });
    });

    var unassignedPapersList = [];
    Object.keys(paperIds).forEach(function(paperId) {
      if (!papersWithAssignments.has(paperId)) {
        unassignedPapersList.push(paperId);
      }
    });

    var unassignedUsersList = [];
    Object.keys(userIds).forEach(function(user) {
      if (!usersWithAssignments.has(user)) {
        unassignedUsersList.push(user);
      }
    });

    return [assignmentMap, unassignedPapersList, unassignedUsersList];

  });
};

var loadMatchingData = function(assignmentConfigNote) {
  if (useEdges) {
    return loadFromEdges(assignmentConfigNote);
  }
  return loadFromNotes(assignmentConfigNote);
};

var computeStats = function(matchLists) {
  var matchList = matchLists[0];
  var papersWithoutAssignments = matchLists[1];
  var usersWithoutAssignments = matchLists[2];

  var allScoresList = _.map(matchList, function(match) { return { num: match.score, data: match.paperId }; });
  var allScoresDataList = _.map(allScoresList, 'num');

  var paperMap = _.groupBy(matchList, function(match) { return match.paperId; });
  var groupMap = _.groupBy(matchList, function(match) { return match.groupId; });

  function meanTitle(key) {
    return 'Mean ' + _.join(_.map(_.split(_.snakeCase(key), '_'), _.capitalize), ' ');
  }

  function meanId(key) {
    return 'mean-' + _.join(_.map(_.split(_.snakeCase(key), '_'), _.capitalize), '-');
  }

  var otherScoreKeys = _.keys(_.reduce(matchList, function(acc, match) {
    return _.assign(acc, match.otherScores);
  }, {}));

  var meanOtherScores = _.fromPairs(_.without(_.map(otherScoreKeys, function(key) {
    var meanScore = _.round(_.meanBy(matchList, function(match) {
      return match.otherScores[key];
    }), 2);

    if (meanScore) {
      return [meanId(key), { tag: Scalar, data: meanScore, title: meanTitle(key) }];
    } else {
      return null;
    }
  }), null));

  var meanFinalScore = _.round(_.meanBy(matchList, function(match) { return match.score; }), 2);

  var meanPaperCountPerGroup = _.round(_.meanBy(_.values(groupMap), function(matches) { return matches.length; }), 2);
  var meanGroupCountPerPaper = _.round(_.meanBy(_.values(paperMap), function(matches) { return matches.length; }), 2);

  var paperCountPerGroupList = _.map(groupMap, function(matches, groupId) { return { num: matches.length, data: groupId }; });
  var groupCountPerPaperList = _.map(paperMap, function(matches, paperId) { return { num: matches.length, data: paperId }; });

  var papersWithoutAssignmentsList = papersWithoutAssignments.map(function(paperId) { return { num: 0, data: paperId }; });
  var usersWithoutAssignmentsList = usersWithoutAssignments.map(function(groupId) { return { num: 0, data: groupId }; });

  groupCountPerPaperList = groupCountPerPaperList.concat(papersWithoutAssignmentsList);
  var groupCountPerPaperDataList = _.map(groupCountPerPaperList, 'num');

  paperCountPerGroupList = paperCountPerGroupList.concat(usersWithoutAssignmentsList);
  var paperCountPerGroupDataList = _.map(paperCountPerGroupList, 'num');

  var meanScorePerGroupList = _.map(groupMap, function(matches, groupId) { return { num: _.meanBy(matches, function(match) { return match.score; }), data: groupId }; });
  meanScorePerGroupList = meanScorePerGroupList.concat(usersWithoutAssignmentsList);
  var meanScorePerGroupDataList = _.map(meanScorePerGroupList, 'num');

  var meanScorePerPaperList = _.map(paperMap, function(matches, paperId) { return { num: _.meanBy(matches, function(match) { return match.score; }), data: paperId }; });

  meanScorePerPaperList = meanScorePerPaperList.concat(papersWithoutAssignmentsList);
  var meanScorePerPaperDataList = _.map(meanScorePerPaperList, 'num');

  var recommendationData = {};

  var recomNumDataPerPaperList = _.map(paperMap, function(matches, paperId) {
    var fmatches = _.filter(matches, function(match) {
      return match.otherScores.recommendation > 0;
    });
    return {num: _.size(fmatches), data: paperId};
  });
  var recommendationWeights = matchList.map(function(m) { return m.otherScores.recommendation; });

  if (_.sum(recommendationWeights) > 0) {
    recommendationData = {
      'distribution-recom-group-count-per-paper': {
        tag: Discrete,
        data: _.map(recomNumDataPerPaperList, 'num'),
        interactiveData: recomNumDataPerPaperList,
        title: 'Distribution of Number of Recommended Users per Paper',
        min: 0, max: _.max(_.map(recomNumDataPerPaperList, 'num')),
        xLabel: 'Number of Users', yLabel: 'Number of Papers',
        section: 'recommendation-dist', type: 'paper'
      },
      'distribution-recom-group-count-per-weight': {
        tag: Discrete,
        data: recommendationWeights,
        title: 'Distribution of Number of Recommendations per value',
        min: 0, max: 10,
        xLabel: 'Recommendation value', yLabel: 'Number of Recommendations',
        section: 'recommendation-dist', type: 'recommendation'
      }
    };
  }

  var bidValues = _.reduce(matchList, function(acc, match) {
    return _.uniq(_.concat(acc, match.otherScores.bid || []));
  }, []).sort();

  var numDataPerGroupDataByBidScore = _.fromPairs(_.map(bidValues, function(bidVal) {
    var numDataPerGroupList = _.map(groupMap, function(matches, groupId) {
      var bidMatches = _.filter(matches, function(match) {
        return match.otherScores.bid === bidVal;
      });
      return {num: _.size(bidMatches), data: groupId};
    });

    return [
      'distribution-paper-count-per-group-with-bid-of-' + bidVal.toString().replace('.', '_').replace(' ', '_'),
      {
        tag: Discrete,
        data: _.map(numDataPerGroupList, 'num'),
        title: 'Distribution of Number of Papers per User with Bid of ' + bidVal,
        min: 0, max: _.max(_.map(numDataPerGroupList, 'num')),
        xLabel: 'Number of Papers with Bid = ' + bidVal, yLabel: 'Number of Users',
        type: 'reviewer',
        interactiveData: numDataPerGroupList,
        section: 'bid-dist'
      }
    ];
  }));

  return _.assign(
    {
      'paper-count': {
        tag: Scalar,
        data: (_.keys(paperMap).length + papersWithoutAssignments.length) + ' / ' + _.keys(paperMap).length,
        title: 'Number of papers / Number of papers with assignments'
      },
      'user-count': {
        tag: Scalar,
        data: (_.keys(groupMap).length + usersWithoutAssignments.length) + ' / ' + _.keys(groupMap).length,
        title: 'Number of users / Number of users with assignments'
      }
    },
    meanOtherScores,
    {
      'mean-final-score': {
        tag: Scalar,
        data: meanFinalScore,
        title: 'Mean Final Score'
      },

      'mean-user-count-per-paper': {
        tag: Scalar,
        data: meanGroupCountPerPaper,
        title: 'Mean Number of Users per Paper',
        section: 'basic'
      },

      'mean-paper-count-per-group': {
        tag: Scalar,
        data: meanPaperCountPerGroup,
        title: 'Mean Number of Papers per User',
        section: 'basic'
      },

      'distribution-papers-by-user-count': {
        tag: Discrete,
        data: groupCountPerPaperDataList,
        title: 'Distribution of Papers by Number of Users',
        min: 0, max: _.max(groupCountPerPaperDataList),
        xLabel: 'Number of Users', yLabel: 'Number of Papers',
        section: 'assignment-dist', type: 'paper',
        interactiveData: groupCountPerPaperList,
      },

      'distribution-users-by-paper-count': {
        tag: Discrete,
        data: paperCountPerGroupDataList,
        title: 'Distribution of Users by Number of Papers',
        min: 0, max: _.max(paperCountPerGroupDataList),
        xLabel: 'Number of Papers', yLabel: 'Number of Users',
        section: 'assignment-dist', type: 'reviewer',
        interactiveData: paperCountPerGroupList,
      },

      'distribution-assignments-by-score': {
        tag: Continuous,
        data: allScoresDataList,
        title: 'Distribution of Assignments by Scores',
        min: _.floor(_.min(allScoresDataList, 1)), max: _.ceil(1.1 * _.max(allScoresDataList), 1), binCount: 50,
        xLabel: 'Score', yLabel: 'Number of Assignments',
        section: 'assignment-dist', type: 'paper', widthSpan: 'full',
        interactiveData: allScoresList
      },

      'distribution-papers-by-mean-score': {
        tag: Continuous,
        data: meanScorePerPaperDataList,
        title: 'Distribution of Number of Papers by Mean Scores',
        min: 0, max: 1.1 * _.max(meanScorePerPaperDataList), binCount: 20,
        xLabel: 'Mean Score', yLabel: 'Number of Papers',
        section: 'assignment-dist', type: 'paper',
        interactiveData: meanScorePerPaperList
      },

      'distribution-users-by-mean-score': {
        tag: Continuous,
        data: meanScorePerGroupDataList,
        title: 'Distribution of Number of Users by Mean Scores',
        min: 0, max: 1.1 * _.max(meanScorePerGroupDataList), binCount: 20,
        xLabel: 'Mean Score', yLabel: 'Number of Users',
        section: 'assignment-dist', type: 'reviewer',
        interactiveData: meanScorePerGroupList
      }
    }, recommendationData, numDataPerGroupDataByBidScore);
};


var renderStatsMap = function(statsMap) {
  $('#content .spinner-container').remove();

  _.forEach(statsMap, function(stats, divId) {
    if (stats.tag === Scalar) {
      renderScalar(divId, stats);
    } else {
      renderHistogram(divId, stats);
    }
  });
};


var renderHistogram = function(divId, stats) {

  var binCount = stats.binCount || 20;
  var formatCount = d3.format(',.0f');

  var widthClass = (stats.widthSpan && stats.widthSpan === 'full') ? '' : ' col-sm-6';

  var div = d3.select('#stats-container-' + stats.section)
    .append('div')
      .attr('class', 'col-xs-12' + widthClass)
    .append('div')
      .attr('id', divId)
      .attr('class', 'stat-chart');

  $('#stats-container-' + stats.section + ' h3').removeClass('hidden');

  var containerWidth = $('#' + divId).width();
  var svg = div.append('svg')
    .attr('width', containerWidth)
    .attr('height', 500);

  var margin = { top: 40, right: 10, bottom: 40, left: 50 };
  var width = +svg.attr('width') - margin.left - margin.right;
  var height = +svg.attr('height') - margin.top - margin.bottom;

  svg.append('text')
    .attr('class', 'stat-name')
    .attr('x', '55%')
    .attr('y', 15)
    .attr('text-anchor', 'middle')
    .text(stats.title);

  var g = svg.append('g').attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

  stats.min = stats.tag === Continuous && _.min(stats.data) < stats.min ? 2 * _.floor(_.min(stats.data),1) : stats.min;

  var xmax = stats.tag === Discrete ? _.max([stats.max, 10]) + 0.5 : stats.max;
  var xmin = stats.tag === Discrete ? stats.min - 0.5 : stats.min;

  var x = d3.scaleLinear()
    .domain([xmin, xmax])
    .rangeRound([0, width]);

  var thresholds = [];
  if (stats.tag === Continuous) {
    thresholds = _.tail(x.ticks(binCount));
  } else if (stats.tag === Discrete) {
    thresholds = _.range(xmin, xmax);
  }

  var bins = d3.histogram()
    .domain(x.domain())
    .thresholds(thresholds)(stats.data);

  var y = d3.scaleLinear()
    .domain([0, d3.max(bins, function(d) { return d.length; })])
    .range([height, 0]);

  var bar = g.selectAll()
    .data(bins)
    .enter().append('g')
      .attr('transform', function(d) {
        return 'translate(' + x(d.x0) + ',' + y(d.length) + ')';
      });

  var xLeft = 10;
  var barspace = stats.tag === Discrete ? 80 / _.size(thresholds) : 1;

  bar.each(function(d, i) {
    var width = x(d.x1) - x(d.x0);
    if (width <= 0) {
      return;
    }

    var bar = d3.select(this);

    var xAxisBarLabelFontStyle = stats.tag === Continuous ?
    '.50rem sans-serif' :
    '.75rem sans-serif';

    var text = bar.append('text')
      .attr('dy', '-1em')
      .attr('y', 6)
      .attr('x', xLeft + width / 2)
      .attr('text-anchor', 'middle')
      .style('font', xAxisBarLabelFontStyle)
      .style('fill', '#777')
      .text(function(d) { return d.length > 0 ? formatCount(d.length) : null; });

    var rect = bar.append('rect')
      .attr('x', xLeft + (barspace < 2 ? 1 : barspace / 2))
      .attr('width', width - barspace)
      .attr('height', function(d) { return height - y(d.length); })
      .attr('class', 'bar ' + (stats.type || ''));

    if (stats.interactiveData) {
      rect.classed('clickable', true);
      var hoverRect = bar.append('rect')
        .attr('x', xLeft + (barspace < 2 ? 1 : barspace / 2))
        .attr('y', function(d) { return -1 * y(d.length); })
        .attr('width', width - barspace)
        .attr('height', function(d) { return d.length === 0 ? 0 : height; })
        .attr('class', 'hover-bar clickable');

      var num;
      var dataList = [];
      if (stats.tag === Discrete) {
        num = Math.floor(d[0]);
        dataList = _.map(
          _.filter(stats.interactiveData, ['num', num]),
          'data'
        ).sort();
      } else {
        dataList = _.uniq(_.map(
          _.filter(stats.interactiveData, function(dataObj) {
            return dataObj.num >= d.x0 && dataObj.num < d.x1;
          }),
          'data'
        ));
      }

      hoverRect.on('click', function() {
        var key = stats.tag === Discrete ? divId + '-x-' + d[0] : divId + '-x-' + d.x0 + '-to-' + d.x1;
        window.localStorage.setItem(key, JSON.stringify({
          type: stats.type,
          data: dataList
        }));
        if (useEdges) {
          window.location.href = buildEdgeBrowserUrl(key, stats.type);
        }
      });
    }
  });

  // X Axis
  var xAxisTickCount = stats.tag === Discrete ?
    _.range(xmin, xmax).length :
    binCount;

  var xAxisTickFontSize = stats.tag === Continuous ?
    '0.5rem' :
    '';

  g.append('g')
    .attr('class', 'axis axis--x')
    .style('font-size', xAxisTickFontSize)
    .attr('transform', 'translate(' + xLeft + ',' + height + ')')
    .call(d3.axisBottom(x).ticks(xAxisTickCount))
    .append('text')
      .style('font', '.75rem sans-serif')
      .style('fill', '#777')
      .attr('text-anchor', 'middle')
      .attr('transform', 'translate('+ width / 2 +','+ 36 +')')
      .text(stats.xLabel);

  // Y Axis
  g.append('g')
    .attr('class', 'axis axis--y')
    .attr('transform', 'translate(' + xLeft + ',0)')
    .call(d3.axisLeft(y).ticks(10))
    .append('text')
      .style('font', '.75rem sans-serif')
      .style('fill', '#777')
      .attr('text-anchor', 'middle')
      .attr('transform', 'translate('+ -40 +','+ height / 2 +')rotate(-90)')
      .text(stats.yLabel);
};


var renderScalar = function(k, stats) {
  var div = d3.select('#stats-container-basic')
    .append('div')
      .attr('class', 'col-xs-6 col-md-3')
    .append('div')
      .attr('class', 'stat-scalar')
      .attr('id', k);

  var statVal = div.append('div').attr('class', 'stat-val').text(stats.data);
  var statName = div.append('div').attr('class', 'stat-name').text(stats.title);
};


var generateBuildEdgeBrowserUrl = function(configNote) {
  return function(key, type) {
    var browseInvitations = Object.keys(configNote.scores_specification);
    var referrerText = view.prettyId(configNote.title) + ' Statistics';
    var typeParam = type === 'reviewer' ? 'type:tail' : 'type:head';

    return '/edges/browse' +
      '?start=staticList,' + typeParam + ',storageKey:' + key +
      '&traverse=' + configNote.assignment_invitation + ',label:' + configNote.title +
      '&edit=' + configNote.assignment_invitation + ',label:' + configNote.title +
      '&browse=' + configNote.aggregate_score_invitation + ',label:' + configNote.title +
      ';' + browseInvitations.join(';') +
      ';' + configNote.conflicts_invitation +
      (configNote.custom_max_papers_invitation ? ';' + configNote.custom_max_papers_invitation + ',head:ignore' : '') +
      (configNote.custom_load_invitation ? ';' + configNote.custom_load_invitation + ',head:ignore' : '') +
      '&maxColumns=3' +
      '&referrer=' + encodeURIComponent('[' + referrerText + '](' + location.pathname + location.search + ')');
  }
};


var showLoadingError = function(err) {
  var errorMsg = 'There was a problem loading the paper matching data. ' +
    'You may not have permission to access this information. ' +
    'Please contact info@openreview.net.';

  if (_.isString(err)) {
    errorMsg = err;
  } else if (_.has(err, 'message')) {
    errorMsg = err.message;
  }

  var errHTML = '<div class="alert alert-danger"><strong>Error:</strong> &nbsp;' + errorMsg;
  $('#stats-container-scalar').html(errHTML);
};


const runAssignmentStats = (note) => {
  if (!note) {
    console.warn('Must provide assignment configuration note in order to compute stats');
    return;
  }

  useEdges = !!note.content.scores_specification;
  buildEdgeBrowserUrl = generateBuildEdgeBrowserUrl(note.content)

  Webfield.ui.spinner('#stats-container-basic', { inline: true })

  loadMatchingData(note.content)
    .then(computeStats)
    .then(renderStatsMap)
    .fail(showLoadingError);
}

module.exports = runAssignmentStats;
