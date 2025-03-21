/* globals promptError: false */
/* eslint-disable react/destructuring-assignment */

import { useState, useEffect, useContext, useRef } from 'react'
import _ from 'lodash'
import Icon from '../Icon'
import LoadingSpinner from '../LoadingSpinner'
import EdgeBrowserContext from './EdgeBrowserContext'
import EntityList from './EntityList'
import { prettyId, prettyInvitationId, pluralizeString } from '../../lib/utils'
import EditEdgeInviteEmail from './EditEdgeInviteEmail'
import {
  getInvitationPrefix,
  isForBothGroupTypesInvite,
  isNotInGroupInvite,
  transformName,
} from '../../lib/edge-utils'
import api from '../../lib/api-client'
import useUser from '../../hooks/useUser'
import useQuery from '../../hooks/useQuery'
import { filterCollections, getEdgeValue } from '../../lib/webfield-utils'

export default function Column(props) {
  const {
    type, // head/tail
    parentId,
    globalEntityMap,
    altGlobalEntityMap,
    startInvitation,
    parentColumnEntityType,
    entityType, // Note/Profile
    parentContent,
    parentTraverseCount,
    parentCustomLoad,
    parentExistingLoad,
    shouldReloadEntities, // something non traverse changed in another column with same parent
  } = props
  const { traverseInvitation, editInvitations, browseInvitations, hideInvitation, version } =
    useContext(EdgeBrowserContext)
  const parent = parentId ? altGlobalEntityMap[parentId] : null
  const otherType = type === 'head' ? 'tail' : 'head'
  const colBodyEl = useRef(null)
  const entityMap = useRef({ globalEntityMap, altGlobalEntityMap })
  const [entityMapChanged, setEntityMapChanged] = useState(false)
  const { accessToken, user } = useUser()
  const query = useQuery()

  const sortOptions = [
    {
      key: traverseInvitation.id,
      value: 'default',
      text: transformName(prettyInvitationId(traverseInvitation.id)),
    },
  ]
  const editAndBrowserInvitations = [...editInvitations, ...browseInvitations]
  const editAndBrowserInvitationsUnique = _.uniqBy(editAndBrowserInvitations, 'id')
  editAndBrowserInvitations.forEach((p) => {
    if (!sortOptions.map((q) => q.key).includes(p.id)) {
      sortOptions.push({
        key: p.id,
        value: p.id,
        text: transformName(prettyInvitationId(p.id)),
      })
    }
  })

  // State Vars
  const [selectedItemId, setSelectedItemId] = useState(null)
  const [items, setItems] = useState(null)
  const [shouldUpdateItems, setShouldUpdateItems] = useState(true)
  const [filteredItems, setFilteredItems] = useState([])
  const [itemsHeading, setItemsHeading] = useState(null)
  const [numItemsToRender, setNumItemsToRender] = useState(100)
  const [columnSort, setColumnSort] = useState('default')
  const [hideQuotaReached, setHideQuotaReached] = useState(false)
  const [search, setSearch] = useState({ term: '' })

  const showLoadMoreButton = numItemsToRender < filteredItems.length
  const showHideQuotaReachedCheckbox =
    entityType === 'profile' &&
    editAndBrowserInvitations.some((p) => p.id.includes('Custom_Max_Papers'))

  // Helpers
  const formatEdge = (edge, invitation) => ({
    id: edge.id,
    invitation: edge.invitation,
    name: transformName(edge.invitation.split('/').pop().replace(/_/g, ' ')),
    head: edge.head,
    tail: edge.tail,
    label: edge.label,
    weight:
      typeof edge.weight === 'number' ? Math.round(edge.weight * 1000) / 1000 : edge.weight,
    writers: edge.writers || [],
    readers: edge.readers || [],
    signatures: edge.signatures || [],
    ...(invitation?.nonreaders && { nonreaders: edge.nonreaders || [] }),
    creationDate: edge.tcdate,
    modificationDate: edge.tmdate,
    writable: edge.details?.writable ?? false,
  })

  const buildNewEditEdge = (editInvitation, entityId, weight = 0) => {
    if (!editInvitation) return null

    return {
      invitation: editInvitation.id,
      name: transformName(editInvitation.id.split('/').pop().replace(/_/g, ' '), true),
      [type]: entityId,
      [otherType]: parentId,
      label: editInvitation.query.label,
      ...(editInvitation.label && {
        defaultLabel: editInvitation.label.default,
      }),
      ...(editInvitation.weight && { weight, defaultWeight: editInvitation.weight.default }),

      readers: editInvitation.readers, // reader/writer/nonreader/signature are completed in entity
      writers: editInvitation.writers,
      signatures: editInvitation.signatures,
      nonreaders: editInvitation.nonreaders,
    }
  }

  const buildQuery = (invitationId, invQueryObj, shouldSort = true) => {
    if (invQueryObj.head === 'count' || invQueryObj.tail === 'count')
      return {
        apiQuery: {
          invitation: invitationId,
          groupBy: invQueryObj.head ? 'tail' : 'head',
          select: 'count',
        },
        isCountQuery: true,
      }
    const apiQuery = {
      invitation: invitationId,
      sort: shouldSort ? 'weight:desc' : undefined,
    }
    if (parentId) {
      apiQuery[otherType] = parentId
    }

    Object.keys(invQueryObj).forEach((key) => {
      if (['head', 'tail', 'sort'].includes(key) && invQueryObj[key] === 'ignore') {
        if (key === 'sort') {
          delete apiQuery[key]
        } else {
          apiQuery[key] = getInvitationPrefix(invitationId)
        }
      } else {
        apiQuery[key] = invQueryObj[key]
      }
    })

    return { apiQuery }
  }

  const getColumnTitle = () => {
    if (props.title) {
      return (
        <p>
          <strong>{props.title}</strong>
        </p>
      )
    }

    // First column
    if (!parentId && !startInvitation) {
      const columnType = traverseInvitation[type].type
      let entityInvitation = null
      let defautEntityName = null
      switch (columnType) {
        case 'note':
          entityInvitation = traverseInvitation[type].query.invitation
          defautEntityName = 'note'
          break
        case 'profile':
          entityInvitation = traverseInvitation[type].query.group
          defautEntityName = 'user'
          break
        case 'group':
          entityInvitation = traverseInvitation[type].query.group
          defautEntityName = 'group'
          break
        default:
          break
      }
      const entityInvitationName = entityInvitation
        ? prettyId(entityInvitation)
        : pluralizeString(defautEntityName)
      // eslint-disable-next-line react/jsx-one-expression-per-line
      return (
        <p>
          <strong>All {entityInvitationName}</strong>
        </p>
      )
    }

    const invitationName = startInvitation ? startInvitation.name : traverseInvitation.name
    const transformedInvitationName = transformName(invitationName, false, true)
    const invitationNamePlural =
      invitationName === transformedInvitationName
        ? pluralizeString(invitationName) // not a special name
        : transformedInvitationName // special name

    // Notes
    if (parent && parent.forum && parent.content) {
      const paperTitle = _.truncate(parent.content.title, {
        length: 65,
        omission: '...',
        separator: ' ',
      })
      const num = parent.number ? ` (#${parent.number})` : ''
      // eslint-disable-next-line react/jsx-one-expression-per-line
      return (
        <p>
          {invitationNamePlural} for <strong>{paperTitle}</strong>
          {num}
        </p>
      )
    }

    // Profiles
    if (_.has(parent, 'content.name')) {
      const { name } = parent.content
      // eslint-disable-next-line react/jsx-one-expression-per-line
      return (
        <p>
          {invitationNamePlural} for <strong>{name.fullname}</strong>
        </p>
      )
    }

    // Default
    let parentIdToShow =
      parentId ||
      startInvitation.query.tail ||
      startInvitation.query.head ||
      startInvitation.query.storageKey
    if (parentIdToShow === user?.profile?.id) parentIdToShow = user?.profile?.preferredId
    // eslint-disable-next-line react/jsx-one-expression-per-line
    if (parentIdToShow) {
      return (
        <p>
          {invitationNamePlural} for <strong>{prettyId(parentIdToShow)}</strong>
        </p>
      )
    }

    return <p>Items</p>
  }

  const getColumnDescription = () => {
    if (!parentId || !editInvitations.length) {
      return null
    }

    return editInvitations.map((editInvitation) => {
      if (!editInvitation[type].description) return null
      return (
        <p className="description" key={editInvitation.id}>
          <Icon name="info-sign" />
          {`${editInvitation.name} - ${editInvitation[type].description}`}
        </p>
      )
    })
  }

  const getPlaceholderText = (isLoadMoreButton = false) => {
    let entityName = props.entityType
    if (props.entityType === 'note') {
      entityName = prettyInvitationId(traverseInvitation[type].query.invitation)
    } else if (props.entityType === 'profile') {
      entityName = prettyId(traverseInvitation[type].query.group, true)
    }
    if (startInvitation) {
      entityName = prettyInvitationId(startInvitation.id)
    }
    if (isLoadMoreButton) return pluralizeString(entityName).toLowerCase()
    if (entityName === 'staticList') return 'Search list...'
    return `Search all ${pluralizeString(entityName).toLowerCase()}...`
  }

  const getFilterLabel = () => {
    const group = prettyId(traverseInvitation[type].query.group, true).toLowerCase()
    const invitation = prettyId(
      editInvitations?.[0]?.id ?? traverseInvitation.id,
      true
    ).toLowerCase()
    if (query.filter) {
      return (
        <>
          {`Show ${group} available for ${invitation} `}
          <Icon name="info-sign" tooltip={query.filter} />
        </>
      )
    }
    return `Show ${group} with fewer than max assigned papers`
  }

  // Adds either a new browse edge or an edit edge to an item
  const updateColumnItems =
    (fieldName, colItems, isHidden = false) =>
    (edge) => {
      const headOrTailId = edge[type]
      const edgeFormatted = formatEdge(edge)
      const existingItem = _.find(colItems, ['id', headOrTailId])
      const hasConflict = edgeFormatted.name === 'Conflict' && edgeFormatted.weight === -1

      if (existingItem) {
        if (isHidden) {
          existingItem.metadata.isHidden = true
          existingItem.browseEdges = []
        }
        if (hasConflict) {
          existingItem.metadata.hasConflict = true
        }

        if (_.isArray(existingItem[fieldName])) {
          existingItem[fieldName].push(edgeFormatted)
        } else {
          existingItem[fieldName] = edgeFormatted
        }

        return
      }

      let itemToAdd = globalEntityMap[headOrTailId]
      if (!itemToAdd) {
        // This mainly occurs when an affinity edge references a withdrawn paper
        // and isn't usually a problem. Missing profile IDs sometimes occur if
        // profiles get merged and the edges are not updated.
        // eslint-disable-next-line no-console
        console.warn(
          `${headOrTailId} not found in global entity map. From ${edgeFormatted.name}`
        )

        if (fieldName === 'editEdges' && entityType === 'profile') {
          const editInvitation = editInvitations.filter((p) => p.id === edge.invitation)?.[0]
          if (
            isNotInGroupInvite(editInvitation, type) ||
            isForBothGroupTypesInvite(editInvitation, type)
          ) {
            itemToAdd = {
              id: headOrTailId,
              content: {
                name: { fullname: prettyId(headOrTailId) },
                email: headOrTailId,
                title: '',
                expertise: [],
                isInvitedProfile: true,
              },
              searchText: headOrTailId,
              traverseEdgesCount: 0,
            }
          } else {
            return
          }
        } else {
          return
        }
      }
      const columnMetadata =
        type === 'head'
          ? _.get(props.metadataMap, [headOrTailId, parentId], {})
          : _.get(props.metadataMap, [parentId, headOrTailId], {})
      const itemToAddFormatted = {
        ...itemToAdd,
        editEdges: [],
        browseEdges: [],
        metadata: {
          ...columnMetadata,
          isAssigned: false,
          hasConflict,
          isHidden,
        },
      }
      if (_.isArray(itemToAddFormatted[fieldName])) {
        itemToAddFormatted[fieldName].push(edgeFormatted)
      } else {
        itemToAddFormatted[fieldName] = edgeFormatted
      }

      colItems.push(itemToAddFormatted)
    }

  // populate necessary info for items
  const appendEdgesInfo = ({
    item,
    traverseEdges,
    hideEdges,
    browseEdgeGroups,
    editEdgeGroups,
  }) => {
    const metadata = {}
    if (traverseEdges.some((p) => p[type] === item.id)) {
      metadata.isAssigned = true
    }
    if (hideEdges.some((p) => p[type] === item.id)) {
      metadata.isHidden = true
    }
    const allEdges = [
      ...traverseEdges,
      ...hideEdges,
      ...browseEdgeGroups.flat(),
      ...editEdgeGroups.flat(),
    ]
    if (
      allEdges.some((p) => {
        const edgeFormatted = formatEdge(p)
        return edgeFormatted.name === 'Conflict' && edgeFormatted.weight === -1
      })
    ) {
      metadata.hasConflict = true
    }
    const browseEdges = browseEdgeGroups
      .flat()
      .filter((p) => p[type] === item.id)
      .map((q) => formatEdge(q))

    const hasAggregateScoreEdge =
      browseEdges.length && browseEdges[0].name === 'Aggregate_Score'
    const edgeWeight = hasAggregateScoreEdge ? browseEdges[0].weight : 0
    const editEdgeTemplates = editInvitations.map((p) =>
      buildNewEditEdge(p, item.id, edgeWeight)
    )
    return {
      ...item,
      metadata,
      browseEdges,
      editEdges: editEdgeGroups
        .flat()
        .filter((p) => p[type] === item.id)
        .map((p) => formatEdge(p)),
      editEdgeTemplates,
    }
  }

  const loadMoreItems = () => {
    setNumItemsToRender(numItemsToRender + 100)
  }

  // Sorts item list by the weights of the edges specified by columnSort. If an
  // item does not have the specified edge it should go at the bottom of the
  // list below all items that have that edge.
  const sortItems = (colItems) => {
    // the columnsort invitation may come from traverse/edit/browser invitations
    if (columnSort === 'default') {
      return colItems
    }

    const sortInvitation = [...editInvitations, ...browseInvitations].filter(
      (p) => p.id === columnSort
    )?.[0]
    const sortLabels = sortInvitation.label?.['value-radio']

    if (sortLabels) {
      // has no weight; construct label map then sort
      const sortLabelMap = _.fromPairs(_.zip(sortLabels, _.range(sortLabels.length, 0, -1)))
      // eslint-disable-next-line no-param-reassign
      return _.orderBy(
        [...colItems].map((p) => ({
          ...p,
          weight:
            sortLabelMap[
              [...p.browseEdges, ...p.editEdges].find((q) => q.invitation === columnSort)
                ?.label
            ] || 0,
        })),
        ['weight'],
        ['desc']
      )
    }

    return [...colItems].sort((itemA, itemB) => {
      const edgeA = _.find(
        [...itemA.browseEdges, ...itemA.editEdges],
        ['invitation', columnSort]
      )
      const edgeB = _.find(
        [...itemB.browseEdges, ...itemB.editEdges],
        ['invitation', columnSort]
      )

      if (!edgeA && !edgeB) return 0
      if (!edgeA && edgeB) return 1
      if (edgeA && !edgeB) return -1

      const weightA = edgeA.weight || 0
      const weightB = edgeB.weight || 0
      return weightB - weightA
    })
  }

  const sortEditEdges = (editEdges) => {
    const editInvitationIds = editInvitations.map((p) => p.id)
    editEdges.sort(
      (a, b) =>
        editInvitationIds.indexOf(a.invitation) - editInvitationIds.indexOf(b.invitation)
    )
    return editEdges
  }

  // column created by clicking invited reviewer is just globalentitymap
  // need to show entities with traverse invitation first
  const sortItemsByTraverseEdge = (colItems) => {
    if (!colItems?.some((p) => p?.metadata?.isAssigned)) return colItems // no traverse edge
    return colItems.sort((a, b) => {
      if (b?.metadata?.isAssigned && !a?.metadata?.isAssigned) return 1
      if (a?.metadata?.isAssigned && !b?.metadata?.isAssigned) return -1
      return 0
    })
  }

  const addToEdgesPromiseMap = (
    invitation,
    invitationType,
    edgesPromiseMap,
    getWritable = false,
    sort = true
  ) => {
    if (!invitation) return
    const existingIndex = edgesPromiseMap.findIndex(
      // unique by id and param
      (p) =>
        p.id === invitation.id &&
        p.getWritable === getWritable &&
        p.sort === sort &&
        _.isEqual(p.query, invitation.query)
    )
    if (existingIndex >= 0) {
      edgesPromiseMap[existingIndex].invitations.push(invitationType)
    } else {
      // eslint-disable-next-line no-nested-ternary
      const detailsParam = getWritable
        ? invitation.query.details
          ? `${invitation.query.details},writable`
          : 'writable'
        : invitation.query.details
      const { apiQuery, isCountQuery } = buildQuery(
        invitation.id,
        { ...invitation.query, details: detailsParam },
        sort
      )
      edgesPromiseMap.push({
        id: invitation.id,
        query: invitation.query,
        invitations: [invitationType],
        getWritable,
        sort,
        promise: api
          .getAll(
            '/edges',
            { ...apiQuery, ...(version === 2 && { domain: invitation.domain }) },
            {
              accessToken,
              version,
              ...(isCountQuery && { resultsKey: 'groupedEdges' }),
            }
          )
          .then((result) =>
            isCountQuery
              ? result?.map((p) => ({
                  id: p.id[type],
                  [type]: p.id[type],
                  label: p.count,
                  invitation: invitation.id,
                }))
              : result
          )
          .catch((error) => promptError(error.message)),
      })
    }
  }

  const getQuota = (colItem) => {
    const defaultQuota = [...browseInvitations, ...editInvitations].find((p) =>
      p.id.includes('Custom_Max_Papers')
    )?.defaultWeight

    const customLoad =
      [...colItem.browseEdges, ...colItem.editEdges].find((edge) =>
        edge?.invitation?.includes('Custom_Max_Papers')
      )?.weight ?? defaultQuota
    return customLoad
  }

  const filterQuotaReachedItems = (colItems) => {
    if (!hideQuotaReached) return colItems
    if (query.filter) {
      const { filteredRows, queryIsInvalid } = filterCollections(
        colItems.map((p) => {
          const customLoad = getQuota(p)
          const quotaNotReached =
            query.check_quota === 'false' ? !p.traverseEdge : p.traverseEdgesCount < customLoad

          return {
            ...p,
            filterProperties: editAndBrowserInvitationsUnique.reduce(
              (prev, curr) => {
                const edge = [...p.browseEdges, ...p.editEdges].find(
                  (q) => q.invitation === curr.id
                )

                if (edge) {
                  prev[curr.id] = getEdgeValue(edge) // eslint-disable-line no-param-reassign
                } else {
                  prev[curr.id] = curr.defaultWeight ?? curr.defaultLabel // eslint-disable-line no-param-reassign
                }
                return prev
              },
              { Quota: quotaNotReached }
            ),
          }
        }),
        `${query.filter} AND Quota=true`,
        ['!=', '>=', '<=', '>', '<', '==', '='],
        editAndBrowserInvitationsUnique.reduce(
          (prev, curr) => {
            prev[curr.id] = [`filterProperties.${curr.id}`] // eslint-disable-line no-param-reassign
            return prev
          },
          {
            Quota: ['filterProperties.Quota'],
          }
        ),
        'id'
      )
      if (queryIsInvalid) return colItems
      return filteredRows
    }

    return colItems.filter((p) => {
      const customLoad = getQuota(p)
      if (customLoad === undefined) return false
      return p.traverseEdgesCount < customLoad
    })
  }

  const populateColumnItems = () => {
    if (props.loading) return
    if (!shouldUpdateItems) {
      setShouldUpdateItems(true)
      return
    }

    // If no parent id is provided, display the full list of entities. Used for
    // the first column when no start invitation is provided
    if (!parentId && !startInvitation) {
      setItems(Object.values(globalEntityMap))
      return
    }

    if (startInvitation) {
      if (startInvitation.id === 'staticList') {
        let idsToInclude = []
        if (startInvitation.query.storageKey) {
          const rawData = window.localStorage.getItem(startInvitation.query.storageKey)
          window.localStorage.removeItem(startInvitation.query.storageKey)
          try {
            idsToInclude = JSON.parse(rawData).data
          } catch (error) {
            idsToInclude = []
          }
        } else if (startInvitation.query.ids) {
          idsToInclude = startInvitation.query.ids.split(' ')
        }

        setItems(
          idsToInclude.map((id) => ({
            ...globalEntityMap[id],
            browseEdges: [],
            metadata: {
              isAssigned: false,
            },
          }))
        )
        return
      }
      const { apiQuery } = buildQuery(startInvitation.id, startInvitation.query, false)
      api
        .getAll(
          '/edges',
          { ...apiQuery, ...(version === 2 && { domain: startInvitation.domain }) },
          {
            accessToken,
            version,
          }
        )
        .then((startEdges) => {
          if (!startEdges) {
            setItems([])
            return
          }

          const colItems = []
          const existingItems = new Set()
          // eslint-disable-next-line no-param-reassign
          startEdges = _.orderBy(startEdges, (p) => p.weight ?? 0, ['desc'])
          startEdges.forEach((sEdge) => {
            const headOrTailId = sEdge[type]
            if (!globalEntityMap[headOrTailId]) {
              // eslint-disable-next-line no-console
              console.warn(`${headOrTailId} not found in global entity map`)
              return
            }
            if (existingItems.has(headOrTailId)) {
              // Don't allow duplicate items in start column
              return
            }

            colItems.push({
              ...globalEntityMap[headOrTailId],
              browseEdges: [],
              metadata: {
                isAssigned: false,
              },
            })
            existingItems.add(headOrTailId)
          })
          setItems(
            type === 'head'
              ? colItems.sort((itemA, itemB) => itemA.number - itemB.number)
              : colItems
          )
        })
        .catch((error) => promptError(error.message))
      return
    }

    const edgesPromiseMap = []
    addToEdgesPromiseMap(traverseInvitation, 'traverse', edgesPromiseMap, true, true) // traverse does not need to getWritable, this is for the case edit == traverse
    editInvitations.forEach((editInvitation) =>
      addToEdgesPromiseMap(editInvitation, 'edit', edgesPromiseMap, true, false)
    )
    addToEdgesPromiseMap(hideInvitation, 'hide', edgesPromiseMap, false, false)
    browseInvitations.forEach((browseInvitation) =>
      addToEdgesPromiseMap(browseInvitation, 'browse', edgesPromiseMap, false, false)
    )

    // Load all edges related to parent and build lists of assigned items and
    // alternate items, adding edges to each cell
    Promise.all(edgesPromiseMap.map((p) => p.promise)).then((result) => {
      let traverseEdges =
        result.find(
          (p, i) => edgesPromiseMap.findIndex((q) => q.invitations.includes('traverse')) === i
        ) || []
      const hideEdges =
        result.find(
          (p, i) => edgesPromiseMap.findIndex((q) => q.invitations.includes('hide')) === i
        ) || []
      const editEdgeGroups = result.filter((p, i) =>
        edgesPromiseMap
          .map((q, j) => (q.invitations.includes('edit') ? j : -1))
          .filter((q) => q !== -1) // index in edgesPromiseMap
          .includes(i)
      )
      const browseEdgeGroups = result.filter((p, i) =>
        edgesPromiseMap
          .map((q, j) => (q.invitations.includes('browse') ? j : -1))
          .filter((q) => q !== -1) // index in edgesPromiseMap
          .includes(i)
      )
      const colItems = []
      // if clicked on invite invitation profile entity
      // display full list of notes with meta/browseEdges/editEdges/editEdgeTemplates
      if (parentColumnEntityType === 'profile' && !altGlobalEntityMap[parentId]) {
        const allItems = Object.values(globalEntityMap).map((p) =>
          appendEdgesInfo({
            item: p,
            traverseEdges,
            hideEdges,
            browseEdgeGroups,
            editEdgeGroups,
          })
        )
        setItems(sortItemsByTraverseEdge(allItems))
        return
      }

      // sort by weight (in API) would fail when traverse edges has label instead of weight
      // and traverse is the default sort so must work.
      const traverseLabels = traverseInvitation.label?.['value-radio']
      if (traverseLabels) {
        const traverseLabelMap = _.fromPairs(
          _.zip(traverseLabels, _.range(traverseLabels.length, 0, -1))
        )
        // eslint-disable-next-line no-param-reassign
        traverseEdges = _.orderBy(
          traverseEdges,
          [(edge) => traverseLabelMap[edge.label] || 0],
          ['desc']
        )
      }

      traverseEdges.forEach((tEdge) => {
        const headOrTailId = tEdge[type]
        let itemToAdd = globalEntityMap[headOrTailId]
        if (!itemToAdd) {
          if (entityType === 'profile') {
            const hasInviteInvitation = editInvitations.some(
              (p) => isNotInGroupInvite(p, type) || isForBothGroupTypesInvite(p, type)
            )
            const hasProposedAssignmentInvitation = editInvitations.some((p) =>
              p.id.includes('Proposed_Assignment')
            )
            itemToAdd = {
              id: headOrTailId,
              content: {
                name: { fullname: prettyId(headOrTailId) },
                email: headOrTailId,
                title: '',
                expertise: [],
                isInvitedProfile: hasInviteInvitation || hasProposedAssignmentInvitation,
              },
              searchText: headOrTailId,
              traverseEdgesCount: traverseEdges.filter((p) => p[type] === headOrTailId).length,
            }
            // eslint-disable-next-line no-console
            console.warn(`${headOrTailId} not found in global entity map`)
          } else {
            // eslint-disable-next-line no-console
            console.warn(`${headOrTailId} not found in global entity map`)
            return
          }
        }
        const columnMetadata =
          type === 'head'
            ? _.get(props.metadataMap, [headOrTailId, parentId], {})
            : _.get(props.metadataMap, [parentId, headOrTailId], {})
        colItems.push({
          ...itemToAdd,
          browseEdges: [],
          editEdges: [],
          traverseEdge: formatEdge(tEdge, traverseInvitation),
          metadata: {
            ...columnMetadata,
            isAssigned: true,
          },
        })
      })

      if (altGlobalEntityMap[parentId]?.traverseEdgesCount !== traverseEdges.length) {
        props.updateGlobalEntityMap(
          otherType,
          parentId,
          'traverseEdgesCount',
          traverseEdges.length
        ) // other user has updated edge
        setShouldUpdateItems(false) // avoid infinite update
      }

      // Add existing edit edges to items
      editEdgeGroups.forEach((editEdge) =>
        editEdge?.forEach(updateColumnItems('editEdges', colItems))
      )

      // Add all browse edges to items
      browseEdgeGroups.forEach((browseEdges, i) => {
        if (!browseEdges) {
          return
        }

        // add weights according to labels if invitation has no weight
        // an example is bid invitation
        const bidLabels = browseInvitations[i]?.label?.['value-radio']
        if (bidLabels) {
          const bidLabelMap = _.fromPairs(_.zip(bidLabels, _.range(bidLabels.length, 0, -1)))
          // eslint-disable-next-line no-param-reassign
          browseEdges = browseEdges.map((e) => ({ ...e, weight: bidLabelMap[e.label] || 0 }))
        }
        browseEdges.forEach(updateColumnItems('browseEdges', colItems))
      })

      hideEdges.forEach(updateColumnItems('browseEdges', colItems, true))

      // Add each editInvitation as a template so that new invitation can be added
      if (editInvitations.length) {
        colItems.forEach((item) => {
          const hasAggregateScoreEdge =
            item.browseEdges.length && item.browseEdges[0].name === 'Aggregate_Score'
          const edgeWeight = hasAggregateScoreEdge ? item.browseEdges[0].weight : 0
          // eslint-disable-next-line no-param-reassign
          item.editEdgeTemplates = editInvitations.map((editInvitation) =>
            buildNewEditEdge(editInvitation, item.id, edgeWeight)
          )
          // eslint-disable-next-line no-param-reassign
          item.traverseEdgeTemplate = buildNewEditEdge(traverseInvitation, item.id, 0)
        })
      }

      setItems(colItems)
    })
  }

  useEffect(() => {
    if (!items) return
    if (!items.length && !parentId) {
      return
    }
    // Reset column to show original items and no search heading
    if (!search.term && !hideQuotaReached) {
      const itemsAssociatedWithParent = parentId
        ? items.filter(
            (p) => p.traverseEdge || p.browseEdges.some((q) => q?.[otherType] === parentId)
          )
        : items
      setFilteredItems(sortItems(filterQuotaReachedItems(itemsAssociatedWithParent)))
      setItemsHeading(null)
      return
    }

    // Show all entities when filter by quota reached without searching
    if (!search.term && hideQuotaReached && parentId) {
      const allItems = [...items]
      Object.values(globalEntityMap).forEach((item) => {
        if (allItems.find((p) => p.id === item.id)) return
        allItems.push({
          ...item,
          // eslint-disable-next-line max-len
          editEdgeTemplates: editInvitations.map((editInvitation) =>
            buildNewEditEdge(editInvitation, item.id)
          ),
          editEdges: [],
          browseEdges: [],
          metadata: {
            isAssigned: false,
          },
        })
      })

      setFilteredItems(sortItems(filterQuotaReachedItems(allItems)))
      return
    }
    if (search.term.length < 2) {
      return
    }

    // Build search regex. \b represents a word boundary, so matches in the
    // middle of a word don't count. Includes special case for searching by
    // paper number so only the exact paper is matched.
    const escapedTerm = _.escapeRegExp(search.term)
    let [preModifier, postModifier] = ['\\b', '']
    if (escapedTerm.startsWith('#')) {
      ;[preModifier, postModifier] = ['^', '\\b']
    }
    const searchRegex = new RegExp(preModifier + escapedTerm + postModifier, 'mi')

    // Search existing items
    const matchingItems = items.filter((item) => item.searchText?.match(searchRegex))

    // Search all other items that don't share edges with the parent entity
    if (parentId) {
      const searchedIds = items.map((item) => item.id)

      Object.values(globalEntityMap).forEach((item) => {
        if (searchedIds.includes(item.id)) return

        if (item.searchText.match(searchRegex)) {
          matchingItems.push({
            ...item,
            // eslint-disable-next-line max-len
            editEdgeTemplates: editInvitations.map((editInvitation) =>
              buildNewEditEdge(editInvitation, item.id)
            ),
            editEdges: [],
            browseEdges: [],
            metadata: {
              isAssigned: false,
            },
          })
        }
      })
    }

    setFilteredItems(sortItems(filterQuotaReachedItems(matchingItems)))
    setItemsHeading('Search Results')
  }, [items, search, columnSort, hideQuotaReached])

  useEffect(() => {
    setNumItemsToRender(100)
    colBodyEl.current.scrollTop = 0
  }, [search, columnSort, hideQuotaReached])

  useEffect(() => {
    populateColumnItems()
  }, [props.loading, entityMapChanged, shouldReloadEntities])

  useEffect(() => {
    if (entityMapChanged) {
      populateColumnItems()
    }
    setEntityMapChanged(false)
  }, [entityMapChanged])

  useEffect(() => {
    if (
      !_.isEqual(globalEntityMap, entityMap.current.globalEntityMap) &&
      !_.isEqual(altGlobalEntityMap, entityMap.current.altGlobalEntityMap)
    ) {
      entityMap.current = { globalEntityMap, altGlobalEntityMap }
      setEntityMapChanged(true)
    }
  })

  // Event Handlers
  const addEdgeToEntity = (id, newEdge) => {
    const formattedNewEdge = formatEdge(newEdge)
    const entityIndex = _.findIndex(items, ['id', id])
    let modifiedExistingEdge = false

    // controls the green background
    const isAddingTraverseEdge = formattedNewEdge.invitation === traverseInvitation.id
    // set to existing value if not adding traverse edge
    const shouldUserBeAssigned = isAddingTraverseEdge
      ? true
      : items[entityIndex].metadata.isUserAssigned

    if (entityIndex > -1) {
      // Added (or modified) from existing list
      const existingEditEdges = items[entityIndex].editEdges.filter(
        (p) => p.id === formattedNewEdge.id
      )
      if (existingEditEdges.length) {
        modifiedExistingEdge = true
      }

      const itemToAdd = {
        ...items[entityIndex],
        editEdges: modifiedExistingEdge
          ? sortEditEdges([
              ...items[entityIndex].editEdges.filter((p) => p.id !== formattedNewEdge.id),
              formattedNewEdge,
            ])
          : sortEditEdges([...items[entityIndex].editEdges, formattedNewEdge]),
        metadata: {
          ...items[entityIndex].metadata,
          isAssigned: isAddingTraverseEdge ? true : items[entityIndex].metadata.isAssigned,
          isUserAssigned: shouldUserBeAssigned,
          isUserUnassigned: !shouldUserBeAssigned,
        },
      }
      setItems([...items.slice(0, entityIndex), itemToAdd, ...items.slice(entityIndex + 1)])
    } else {
      // Added from search
      const editInvitation = editInvitations.filter(
        (p) => p.id === formattedNewEdge.invitation
      )[0]
      const newItem = {
        ...globalEntityMap[id],
        editEdges: [buildNewEditEdge(editInvitation, id)],
        editEdgeTemplates: editInvitations.map((p) => buildNewEditEdge(editInvitation, id)),
        browseEdges: [],
        metadata: {
          isAssigned: true,
          isUserAssigned: true,
          isUserUnassigned: false,
        },
      }
      setItems([...items, newItem])
    }

    if (type === 'head') {
      // eslint-disable-next-line max-len
      props.updateMetadataMap(id, parentId, {
        isUserAssigned: shouldUserBeAssigned,
        isUserUnassigned: !shouldUserBeAssigned,
      })
    } else {
      // eslint-disable-next-line max-len
      props.updateMetadataMap(parentId, id, {
        isUserAssigned: shouldUserBeAssigned,
        isUserUnassigned: !shouldUserBeAssigned,
      })
    }

    // Update global head and tail maps
    const incr = modifiedExistingEdge ? 0 : 1
    const newCount1 = (altGlobalEntityMap[parentId]?.traverseEdgesCount ?? 0) + incr
    props.updateGlobalEntityMap(otherType, parentId, 'traverseEdgesCount', newCount1)

    const newCount2 = (globalEntityMap[id]?.traverseEdgesCount ?? 0) + incr
    props.updateGlobalEntityMap(type, id, 'traverseEdgesCount', newCount2)
  }

  const removeEdgeFromEntity = (id, removedEdge) => {
    const entityIndex = _.findIndex(items, ['id', id])
    if (entityIndex === -1) {
      return
    }

    // controls the green background
    const isRemovingTraverseEdge = removedEdge.invitation === traverseInvitation.id
    // set to existing value if not deleting traverse edge
    const shouldUserRemainAssigned = isRemovingTraverseEdge
      ? false
      : items[entityIndex].metadata.isUserAssigned

    const itemToAdd = {
      ...items[entityIndex],
      editEdges: items[entityIndex].editEdges.filter((p) => p.id !== removedEdge.id),
      metadata: {
        ...items[entityIndex].metadata,
        isAssigned: isRemovingTraverseEdge ? false : items[entityIndex].metadata.isAssigned,
        isUserAssigned: shouldUserRemainAssigned,
        isUserUnassigned: !shouldUserRemainAssigned,
      },
    }
    setItems([...items.slice(0, entityIndex), itemToAdd, ...items.slice(entityIndex + 1)])

    if (type === 'head') {
      props.updateMetadataMap(id, parentId, { isUserAssigned: false, isUserUnassigned: true })
    } else {
      props.updateMetadataMap(parentId, id, { isUserAssigned: false, isUserUnassigned: true })
    }

    // Update global head and tail maps
    const newCount1 = (altGlobalEntityMap[parentId]?.traverseEdgesCount ?? 0) - 1
    props.updateGlobalEntityMap(otherType, parentId, 'traverseEdgesCount', newCount1)

    const newCount2 = (globalEntityMap[id]?.traverseEdgesCount ?? 0) - 1
    props.updateGlobalEntityMap(type, id, 'traverseEdgesCount', newCount2)
  }

  // Render
  return (
    <div className="column" tabIndex="-1">
      <div className="head">
        {getColumnTitle()}
        {getColumnDescription()}
      </div>
      <div className="col-search">
        <form role="search" onSubmit={(e) => e.preventDefault()}>
          <div className="filter-container form-group has-feedback">
            <input
              type="text"
              className="form-control input-sm"
              placeholder={getPlaceholderText()}
              value={search.term}
              onChange={(e) => setSearch({ term: e.target.value })}
              autoComplete="off"
              autoCorrect="off"
            />
            <span
              className="glyphicon glyphicon-search form-control-feedback"
              aria-hidden="true"
            />
          </div>
          {parentId && (
            <div className="sort-container form-group">
              {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
              <label>Order By:</label>
              <select
                className="form-control input-sm"
                onChange={(e) => setColumnSort(e.target.value)}
              >
                {sortOptions.map((p) => (
                  <option key={p.key} value={p.value}>
                    {p.text}
                  </option>
                ))}
              </select>
            </div>
          )}
          {parentId && showHideQuotaReachedCheckbox && (
            <div className="checkbox">
              <label>
                <input
                  type="checkbox"
                  checked={hideQuotaReached}
                  onChange={(e) => {
                    setHideQuotaReached(e.target.checked)
                  }}
                />{' '}
                {getFilterLabel()}
              </label>
            </div>
          )}
        </form>
      </div>

      <div className="body" ref={colBodyEl}>
        {items === null ? (
          <LoadingSpinner />
        ) : (
          <>
            <EntityList
              type={props.entityType}
              heading={itemsHeading}
              items={filteredItems}
              numItemsToRender={numItemsToRender}
              selectedItemId={selectedItemId}
              addNewColumn={props.addNewColumn}
              addEdgeToEntity={addEdgeToEntity}
              removeEdgeFromEntity={removeEdgeFromEntity}
              setSelectedItemId={setSelectedItemId}
              canTraverse={!props.finalColumn}
              showCounter={props.showCounter}
              showHiddenItems={false}
              columnType={type} // head/tail
              parentInfo={{
                entityType: parentColumnEntityType,
                id: parentId,
                number: parent?.number,
                content: parentContent,
                customLoad: parentCustomLoad,
                existingLoad: parentExistingLoad,
              }}
              globalEntityMap={globalEntityMap}
              altGlobalEntityMap={altGlobalEntityMap}
              reloadColumnEntities={() => props.reloadColumnEntities(props.index)}
              updateChildColumn={props.updateChildColumn}
              columnIndex={props.index}
            />
            {showLoadMoreButton && (
              <button
                type="button"
                className="btn btn-default btn-xs ml-2 mt-2 mb-2"
                onClick={() => loadMoreItems()}
              >{`Load More ${getPlaceholderText(true)}`}</button>
            )}
            <EditEdgeInviteEmail
              type={type}
              otherType={otherType}
              entityType={entityType}
              parentId={parentId}
              parentNumber={parent?.number}
              reloadColumnEntities={() => props.reloadColumnEntities(props.index)}
            />
          </>
        )}
      </div>
    </div>
  )
}
