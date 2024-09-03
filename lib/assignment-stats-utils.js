import groupBy from 'lodash/groupBy'
import floor from 'lodash/floor'
import ceil from 'lodash/ceil'

// for computing matchlists when loading data from edges
export const getAssignmentMap = (assignments, bids, recommendations, papers, users) => {
  const paperIds = {}
  const userIds = {}
  const bidDict = {}
  const recommendationDict = {}
  const usersWithAssignments = new Set()
  const papersWithAssignments = new Set()

  papers.forEach((note) => {
    paperIds[note.id] = note
  })
  users.forEach((member) => {
    userIds[member] = member
  })
  bids.forEach((groupedEdge) => {
    const paperId = groupedEdge.id.head
    bidDict[paperId] = {}
    groupedEdge.values.forEach((value) => {
      if (paperId in paperIds) {
        bidDict[paperId][value.tail] = value.label
      }
    })
  })

  recommendations.forEach((groupedEdge) => {
    const paperId = groupedEdge.id.head
    recommendationDict[paperId] = {}
    groupedEdge.values.forEach((value) => {
      if (paperId in paperIds) {
        recommendationDict[paperId][value.tail] = value.weight
      }
    })
  })

  const assignmentMap = assignments.flatMap((groupedEdge) => {
    const paperId = groupedEdge.id.head
    const paperBids = bidDict[paperId] || {}

    const paperRecommendations = recommendationDict[paperId] || {}
    const validGroupEdges = groupedEdge.values.filter(
      (value) => paperId in paperIds && value.tail in userIds
    )
    return validGroupEdges.map((value) => {
      const otherScores = { bid: 'No Bid' }
      if (value.tail in paperBids) {
        otherScores.bid = paperBids[value.tail]
      }
      if (value.tail in paperRecommendations) {
        otherScores.recommendation = paperRecommendations[value.tail]
      } else {
        otherScores.recommendation = 0
      }
      papersWithAssignments.add(paperId)
      usersWithAssignments.add(value.tail)
      return {
        groupId: value.tail,
        paperId,
        score: value.weight,
        otherScores,
      }
    })
  })
  return { assignmentMap, usersWithAssignments, papersWithAssignments }
}

export const getUnassignedPapersList = (papers, papersWithAssignments) => {
  const paperIds = {}
  const unassignedPapersList = []

  papers.forEach((note) => {
    paperIds[note.id] = note
  })
  Object.keys(paperIds).forEach((paperId) => {
    if (!papersWithAssignments.has(paperId)) {
      unassignedPapersList.push(paperId)
    }
  })
  return unassignedPapersList
}

export const getUnassignedUsersList = (users, usersWithAssignments) => {
  const userIds = {}
  const unassignedUsersList = []

  users.forEach((member) => {
    userIds[member] = member
  })
  Object.keys(userIds).forEach((user) => {
    if (!usersWithAssignments.has(user)) {
      unassignedUsersList.push(user)
    }
  })
  return unassignedUsersList
}

// for getting scalar values and histogram data
// Number of papers / Number of papers with assignments
export const getPaperCount = (assignmentMap, unassignedPapersList) => {
  const paperMap = groupBy(assignmentMap, (match) => match.paperId) ?? {}
  return `${Object.keys(paperMap).length + unassignedPapersList.length} / ${
    Object.keys(paperMap ?? {}).length
  }`
}

// Number of users / Number of users with assignments
export const getUserCount = (assignmentMap, unassignedUsersList) => {
  const groupMap = groupBy(assignmentMap, (p) => p.groupId)
  return `${Object.keys(groupMap).length + unassignedUsersList.length} / ${
    Object.keys(groupMap ?? {}).length
  }`
}

// Mean Final Score
export const getMeanFinalScore = (assignmentMap) =>
  assignmentMap.length === 0
    ? '-'
    : (
        Math.round(
          (assignmentMap.map((p) => p.score ?? 0).reduce((a, b) => a + b, 0) * 100) /
            assignmentMap.length
        ) / 100
      ).toFixed(2)

// Mean Number of Users per Paper
export const getMeanGroupCountPerPaper = (assignmentMap) => {
  const paperMap = groupBy(assignmentMap, (p) => p.paperId) ?? {}
  return Object.values(paperMap).length === 0
    ? '-'
    : (
        Math.round(
          (Object.values(paperMap ?? {})
            .map((p) => p.length)
            .reduce((a, b) => a + b, 0) *
            100) /
            Object.values(paperMap ?? {}).length
        ) / 100
      ).toFixed(2)
}

// Mean Number of Papers per User
export const getMeanPaperCountPerGroup = (assignmentMap) => {
  const groupMap = groupBy(assignmentMap, (p) => p.groupId) ?? {}
  return Object.values(groupMap).length === 0
    ? '-'
    : (
        Math.round(
          (Object.values(groupMap)
            .map((p) => p.length)
            .reduce((a, b) => a + b, 0) *
            100) /
            Object.values(groupMap).length
        ) / 100
      ).toFixed(2)
}

// Distribution of Papers by Number of Users
export const getDistributionPapersByUserCount = (
  assignmentMap,
  unassignedPapersList,
  headName,
  tailName
) => {
  const paperMap = groupBy(assignmentMap, (p) => p.paperId) ?? {}
  let groupCountPerPaperList = Object.entries(paperMap).map(([paperId, matches]) => ({
    num: matches.length,
    data: paperId,
  }))
  const papersWithoutAssignmentsList = unassignedPapersList.map((paperId) => ({
    num: 0,
    data: paperId,
  }))
  groupCountPerPaperList = groupCountPerPaperList.concat(papersWithoutAssignmentsList)
  const groupCountPerPaperDataList = groupCountPerPaperList.map((p) => p.num)
  return {
    tag: 'discrete',
    data: groupCountPerPaperDataList,
    name: `Distribution of ${headName} by Number of ${tailName}`,
    min: 0,
    max: groupCountPerPaperDataList
      .filter(Number.isFinite)
      .reduce((a, b) => Math.max(a, b), 0),
    xLabel: `Number of ${tailName}`,
    yLabel: `Number of ${headName}`,
    type: 'paper',
    interactiveData: groupCountPerPaperList,
  }
}

// Distribution of Users by Number of Papers
export const getDistributionUsersByPaperCount = (
  assignmentMap,
  unassignedUsersList,
  headName,
  tailName
) => {
  const groupMap = groupBy(assignmentMap, (p) => p.groupId) ?? {}
  let paperCountPerGroupList = Object.entries(groupMap).map(([p, matches]) => ({
    num: matches.length,
    data: p,
  }))
  const usersWithoutAssignmentsList = unassignedUsersList.map((p) => ({
    num: 0,
    data: p,
  }))
  paperCountPerGroupList = paperCountPerGroupList.concat(usersWithoutAssignmentsList)
  const paperCountPerGroupDataList = paperCountPerGroupList.map((p) => p.num)

  return {
    tag: 'discrete',
    data: paperCountPerGroupDataList,
    name: `Distribution of ${tailName} by Number of ${headName}`,
    min: 0,
    max: paperCountPerGroupDataList
      .filter(Number.isFinite)
      .reduce((a, b) => Math.max(a, b), 0),
    xLabel: `Number of ${headName}`,
    yLabel: `Number of ${tailName}`,
    type: 'reviewer',
    interactiveData: paperCountPerGroupList,
  }
}

// Distribution of Assignments by Scores
export const getDistributionAssignmentByScore = (assignmentMap) => {
  const allScoresList = assignmentMap.map((p) => ({
    num: p.score,
    data: p.paperId,
  }))
  const allScoresDataList = allScoresList.map((p) => p.num)

  return {
    tag: 'continuous',
    data: allScoresDataList,
    name: 'Distribution of Assignments by Scores',
    min: floor(
      allScoresDataList.filter(Number.isFinite).reduce((a, b) => Math.min(a, b), 0),
      1
    ),
    max: ceil(
      1.1 * allScoresDataList.filter(Number.isFinite).reduce((a, b) => Math.max(a, b), 0),
      1
    ),
    binCount: 50,
    xLabel: 'Score',
    yLabel: 'Number of Assignments',
    type: 'paper',
    fullWidth: true,
    interactiveData: allScoresList,
  }
}

// Distribution of Number of Papers by Mean Scores
export const getDistributionPapersByMeanScore = (
  assignmentMap,
  unassignedPapersList,
  headName
) => {
  const paperMap = groupBy(assignmentMap, (p) => p.paperId) ?? {}
  const papersWithoutAssignmentsList = unassignedPapersList.map((paperId) => ({
    num: 0,
    data: paperId,
  }))
  let meanScorePerPaperList = Object.entries(paperMap).map(([paperId, matches]) => ({
    num:
      matches
        .map((p) => p.score)
        .filter(Number.isFinite)
        .reduce((a, b) => a + b, 0) / matches.length,
    data: paperId,
  }))
  meanScorePerPaperList = meanScorePerPaperList.concat(papersWithoutAssignmentsList)
  const meanScorePerPaperDataList = meanScorePerPaperList.map((p) => p.num)

  return {
    tag: 'continuous',
    data: meanScorePerPaperDataList,
    name: `Distribution of Number of ${headName} by Mean Scores`,
    min: 0,
    max:
      1.1 *
      meanScorePerPaperDataList.filter(Number.isFinite).reduce((a, b) => Math.max(a, b), 0),
    binCount: 20,
    xLabel: 'Mean Score',
    yLabel: `Number of ${headName}`,
    type: 'paper',
    interactiveData: meanScorePerPaperList,
  }
}

// Distribution of Number of Users by Mean Scores
export const getDistributionUsersByMeanScore = (
  assignmentMap,
  unassignedUsersList,
  tailName
) => {
  const groupMap = groupBy(assignmentMap, (p) => p.groupId) ?? {}
  const usersWithoutAssignmentsList = unassignedUsersList.map((p) => ({
    num: 0,
    data: p,
  }))
  let meanScorePerGroupList = Object.entries(groupMap).map(([p, matches]) => ({
    num:
      matches
        .map((q) => q.score)
        .filter(Number.isFinite)
        .reduce((a, b) => a + b, 0) / matches.length,
    data: p,
  }))
  meanScorePerGroupList = meanScorePerGroupList.concat(usersWithoutAssignmentsList)
  const meanScorePerGroupDataList = meanScorePerGroupList.map((p) => p.num)

  return {
    tag: 'continuous',
    data: meanScorePerGroupDataList,
    name: `Distribution of Number of ${tailName} by Mean Scores`,
    min: 0,
    max:
      1.1 *
      meanScorePerGroupDataList.filter(Number.isFinite).reduce((a, b) => Math.max(a, b), 0),
    binCount: 20,
    xLabel: 'Mean Score',
    yLabel: `Number of ${tailName}`,
    type: 'reviewer',
    interactiveData: meanScorePerGroupList,
  }
}

// Distribution of Number of Recommended Users per Paper
export const getDistributionRecomGroupCountPerPaper = (
  assignmentMap,
  headName,
  singularHeadName
) => {
  const paperMap = groupBy(assignmentMap, (p) => p.paperId) ?? {}
  const recomNumDataPerPaperList = Object.entries(paperMap).map(([paperId, matches]) => ({
    num: matches.filter((p) => p.otherScores.recommendation > 0).length,
    data: paperId,
  }))

  return {
    tag: 'discrete',
    data: recomNumDataPerPaperList.map((p) => p.num),
    interactiveData: recomNumDataPerPaperList,
    name: `Distribution of Number of Recommended Users per ${singularHeadName}`,
    min: 0,
    max: recomNumDataPerPaperList
      .map((p) => p.num)
      .filter(Number.isFinite)
      .reduce((a, b) => Math.max(a, b), 0),
    xLabel: 'Number of Users',
    yLabel: `Number of ${headName}`,
    type: 'paper',
  }
}

// Distribution of Number of Recommendations per value
export const getDistributionRecomGroupCountPerWeight = (assignmentMap) => {
  const recommendationWeights = assignmentMap.map((p) => p.otherScores.recommendation)

  return {
    tag: 'discrete',
    data: recommendationWeights,
    name: 'Distribution of Number of Recommendations per value',
    min: 0,
    max: 10,
    xLabel: 'Recommendation value',
    yLabel: 'Number of Recommendations',
    type: 'recommendation',
  }
}

// Bid Distributions
// Distribution of Number of Papers per User with Bid of bidVal (high, low, neutral ...)
export const getNumDataPerGroupDataByBidScore = (
  assignmentMap,
  headName,
  tailName,
  singularTailName
) => {
  const bidValues = [...new Set(assignmentMap.flatMap((p) => p.otherScores.bid ?? []))].sort()
  const groupMap = groupBy(assignmentMap, (p) => p.groupId) ?? {}

  return Object.fromEntries(
    bidValues.map((bidVal) => {
      const numDataPerGroupList = Object.entries(groupMap).map(([p, matches]) => ({
        num: matches.filter((q) => q.otherScores.bid === bidVal).length,
        data: p,
      }))
      const bidValStr = bidVal.toString().replace('.', '_').replace(' ', '_')
      return [
        `distributionPaperCountPerGroup-bid-${bidValStr}`,
        {
          tag: 'discrete',
          data: numDataPerGroupList.map((p) => p.num),
          name: `Distribution of Number of ${headName} per ${singularTailName} with Bid of ${bidVal}`,
          min: 0,
          max: numDataPerGroupList
            .map((p) => p.num)
            .filter(Number.isFinite)
            .reduce((a, b) => Math.max(a, b), 0),
          xLabel: `Number of ${headName} with Bid = ${bidVal}`,
          yLabel: `Number of ${tailName}`,
          type: 'reviewer',
          interactiveData: numDataPerGroupList,
        },
      ]
    })
  )
}
