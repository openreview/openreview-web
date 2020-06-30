/* globals Webfield: false */
/* eslint-disable react/destructuring-assignment */

import {
  useState, useEffect, useContext, useRef,
} from 'react'
import _ from 'lodash'
import Icon from '../Icon'
import LoadingSpinner from '../LoadingSpinner'
import EdgeBrowserContext from './EdgeBrowserContext'
import EntityList from './EntityList'
import {
  prettyId, prettyInvitationId, pluralizeString,
} from '../../lib/utils'

export default function Column(props) {
  const {
    type,
    parentId,
    globalEntityMap,
    altGlobalEntityMap,
    startInvitation,
  } = props
  const {
    traverseInvitation,
    editInvitation,
    browseInvitations,
    hideInvitation,
  } = useContext(EdgeBrowserContext)
  const parent = parentId ? altGlobalEntityMap[parentId] : null
  const otherType = type === 'head' ? 'tail' : 'head'
  const colBodyEl = useRef(null)

  // Helpers
  const formatEdge = edge => ({
    id: edge.id,
    invitation: edge.invitation,
    name: edge.invitation.split('/').pop().replace(/_/g, ' '),
    head: edge.head,
    tail: edge.tail,
    label: edge.label,
    weight: (typeof edge.weight === 'number')
      ? Math.round(edge.weight * 1000) / 1000
      : edge.weight,
    writers: edge.writers || [],
    readers: edge.readers || [],
    signatures: edge.signatures || [],
  })

  const buildNewEditEdge = (entityId, weight = 0) => {
    if (!editInvitation) return null

    const finalReaders = editInvitation.readers.map((reader) => {
      if (reader === '{tail}') {
        return type === 'tail' ? entityId : parentId
      }
      return reader
    })

    return {
      invitation: editInvitation.id,
      name: editInvitation.id.split('/').pop().replace(/_/g, ' '),
      [type]: entityId,
      [otherType]: parentId,
      label: editInvitation.query.label,
      weight,
      readers: finalReaders,
      writers: editInvitation.writers,
      signatures: editInvitation.signatures,
    }
  }

  const buildQuery = (invitationId, invQueryObj) => {
    const apiQuery = {
      invitation: invitationId,
      sort: 'weight:desc',
    }
    if (parentId) {
      apiQuery[otherType] = parentId
    }

    Object.keys(invQueryObj).forEach((key) => {
      if (['head', 'tail', 'sort'].includes(key) && invQueryObj[key] === 'ignore') {
        delete apiQuery[key]
      } else {
        apiQuery[key] = invQueryObj[key]
      }
    })

    return apiQuery
  }

  const getColumnTitle = () => {
    if (props.title) {
      return <p><strong>{props.title}</strong></p>
    }

    // First column
    if (!parentId && !startInvitation) {
      const queryField = type === 'head' ? 'invitation' : 'group'
      const entityInvitationName = prettyId(traverseInvitation[type].query[queryField])
      // eslint-disable-next-line react/jsx-one-expression-per-line
      return <p><strong>All {entityInvitationName}s</strong></p>
    }

    const invitationName = startInvitation ? startInvitation.name : traverseInvitation.name
    let invitationNamePlural = pluralizeString(invitationName)
    if (invitationName === 'Paper Assignment') {
      invitationNamePlural = 'Assignments'
    } else if (invitationName === 'staticList') {
      invitationNamePlural = 'Items'
    }

    // Notes
    if (parent && parent.forum && parent.content) {
      const paperTitle = _.truncate(parent.content.title, {
        length: 65, omission: '...', separator: ' ',
      })
      const num = parent.number ? ` (#${parent.number})` : ''
      // eslint-disable-next-line react/jsx-one-expression-per-line
      return <p>{invitationNamePlural} for <strong>{paperTitle}</strong>{num}</p>
    }

    // Profiles
    if (_.has(parent, 'content.name')) {
      const { name } = parent.content
      // eslint-disable-next-line react/jsx-one-expression-per-line
      return <p>{invitationNamePlural} for <strong>{name.first} {name.middle} {name.last}</strong></p>
    }

    // Default
    const parentIdToShow = parentId || startInvitation.query.tail
      || startInvitation.query.head || startInvitation.query.storageKey
    // eslint-disable-next-line react/jsx-one-expression-per-line
    return <p>{invitationNamePlural} for <strong>{prettyId(parentIdToShow)}</strong></p>
  }

  const getColumnDescription = () => {
    if (!parentId || !editInvitation || !editInvitation[type].description) {
      return null
    }

    return (
      <p className="description">
        <Icon name="info-sign" />
        {editInvitation[type].description}
      </p>
    )
  }

  const getSearchPlaceholder = () => {
    let entityName = props.entityType
    if (props.entityType === 'Note') {
      entityName = prettyInvitationId(traverseInvitation[type].query.invitation)
    } else if (props.entityType === 'Profile') {
      entityName = prettyId(traverseInvitation[type].query.group, true)
    }
    if (startInvitation) {
      entityName = prettyInvitationId(startInvitation.id)
    }
    return `Search all ${pluralizeString(entityName).toLowerCase()}...`
  }

  // State Vars
  const [selectedItemId, setSelectedItemId] = useState(null)

  // Adds either a new browse edge or an edit edge to an item
  const updateColumnItems = (fieldName, colItems, isHidden = false) => (edge) => {
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

    const itemToAdd = globalEntityMap[headOrTailId]
    if (!itemToAdd) {
      // This mainly occurs when an affinity edge references a withdrawn paper
      // and isn't usually a problem. Missing profile IDs sometimes occur if
      // profiles get merged and the edges are not updated.
      // eslint-disable-next-line no-console
      console.warn(`${headOrTailId} not found in global entity map. From ${edgeFormatted.name}`)
      return
    }

    const columnMetadata = type === 'head'
      ? _.get(props.metadataMap, [headOrTailId, parentId], {})
      : _.get(props.metadataMap, [parentId, headOrTailId], {})
    const itemToAddFormatted = {
      ...itemToAdd,
      editEdge: null,
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

  const [items, setItems] = useState(null)
  useEffect(() => {
    if (props.loading) {
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
          window.localStorage.removeItem(startInvitation.query.key)
          try {
            idsToInclude = JSON.parse(rawData).data
          } catch (error) {
            idsToInclude = []
          }
        } else if (startInvitation.query.ids) {
          idsToInclude = startInvitation.query.ids.split(' ')
        }

        setItems(idsToInclude.map(id => ({
          ...globalEntityMap[id],
          browseEdges: [],
          metadata: {
            isAssigned: false,
          },
        })))
        return
      }

      Webfield.getAll('/edges', buildQuery(startInvitation.id, startInvitation.query))
        .then((startEdges) => {
          if (!startEdges) {
            setItems([])
            return
          }

          const hideEdge = ['Paper Assignment', 'Conflict'].includes(startInvitation.name)
          const colItems = []
          const existingItems = new Set()
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
              browseEdges: hideEdge ? [] : [formatEdge(sEdge)],
              metadata: {
                isAssigned: false,
              },
            })
            existingItems.add(headOrTailId)
          })
          setItems(colItems)
        })
      return
    }

    const traverseEdgesP = Webfield.get('/edges', buildQuery(
      traverseInvitation.id, traverseInvitation.query,
    )).then(response => response.edges)
    const editEdgesP = editInvitation ? Webfield.get('/edges', buildQuery(
      editInvitation.id, editInvitation.query,
    )).then(response => response.edges) : Promise.resolve([])
    const hideEdgesP = hideInvitation ? Webfield.get('/edges', buildQuery(
      hideInvitation.id, hideInvitation.query,
    )).then(response => response.edges) : Promise.resolve([])
    const browseEdgesP = browseInvitations.map(inv => Webfield.getAll('/edges', buildQuery(
      inv.id, inv.query,
    )))

    // Load all edges related to parent and build lists of assigned items and
    // alternate items, adding edges to each cell
    Promise.all([traverseEdgesP, editEdgesP, hideEdgesP, ...browseEdgesP])
      .then(([traverseEdges, editEdges, hideEdges, ...browseEdgeGroups]) => {
        const colItems = []

        traverseEdges.forEach((tEdge) => {
          const headOrTailId = tEdge[type]
          if (!globalEntityMap[headOrTailId]) {
            // eslint-disable-next-line no-console
            console.warn(`${headOrTailId} not found in global entity map`)
            return
          }
          const columnMetadata = type === 'head'
            ? _.get(props.metadataMap, [headOrTailId, parentId], {})
            : _.get(props.metadataMap, [parentId, headOrTailId], {})
          colItems.push({
            ...globalEntityMap[headOrTailId],
            browseEdges: [],
            metadata: {
              ...columnMetadata,
              isAssigned: true,
            },
          })
        })

        // Add all browse edges to items
        browseEdgeGroups.forEach((browseEdges, i) => {
          if (!browseEdges) {
            return
          }

          // Special case for bid edges: since they are not sorted on the backend,
          // add weights according to labels and sort them here before displaying.
          if (browseInvitations[i].name === 'Bid') {
            const bidLabels = browseInvitations[i].label['value-radio'] || []
            const bidLabelMap = _.fromPairs(_.zip(bidLabels, _.range(bidLabels.length, 0, -1)))
            // eslint-disable-next-line no-param-reassign
            browseEdges = _.orderBy(
              browseEdges.map(e => ({ ...e, weight: bidLabelMap[e.label] || 0 })),
              ['weight'],
              ['desc'],
            )
          }

          browseEdges.forEach(updateColumnItems('browseEdges', colItems))
        })

        hideEdges.forEach(updateColumnItems('browseEdges', colItems, true))

        // Add existing edit edges to items
        editEdges.forEach(updateColumnItems('editEdge', colItems))

        // Finally, make sure all have edit edges and create them if they do not
        if (editInvitation) {
          colItems.forEach((item) => {
            if (!_.isEmpty(item.editEdge)) return

            const hasAggregateScoreEdge = item.browseEdges.length && item.browseEdges[0].name === 'Aggregate_Score'
            const edgeWeight = hasAggregateScoreEdge ? item.browseEdges[0].weight : 0
            // eslint-disable-next-line no-param-reassign
            item.editEdge = buildNewEditEdge(item.id, edgeWeight)
          })
        }

        setItems(colItems)
      })
  }, [props.loading, globalEntityMap])

  const [filteredItems, setFilteredItems] = useState([])
  const [itemsHeading, setItemsHeading] = useState(null)

  const [numItemsToRender, setNumItemsToRender] = useState(100)
  const loadMoreItems = (e) => {
    const elem = e.target

    if (elem.scrollHeight > elem.clientHeight
        && elem.scrollTop > elem.scrollHeight - 840
        && numItemsToRender < filteredItems.length) {
      setNumItemsToRender(numItemsToRender + 100)
    }
  }

  const [columnSort, setColumnSort] = useState('default')

  // Sorts item list by the weights of the edges specified by columnSort. If an
  // item does not have the specified edge it should go at the bottom of the
  // list below all items that have that edge.
  const sortItems = (colItems) => {
    if (columnSort === 'default') {
      return colItems
    }

    return [...colItems].sort((itemA, itemB) => {
      const edgeA = _.find(itemA.browseEdges, ['invitation', columnSort])
      const edgeB = _.find(itemB.browseEdges, ['invitation', columnSort])

      if (!edgeA && !edgeB) return 0
      if (!edgeA && edgeB) return 1
      if (edgeA && !edgeB) return -1

      const weightA = edgeA.weight || 0
      const weightB = edgeB.weight || 0
      return weightB - weightA
    })
  }

  const [search, setSearch] = useState({ term: '' })

  useEffect(() => {
    if (!items || !items.length) {
      return
    }
    // Reset column to show original items and no search heading
    if (!search.term) {
      setFilteredItems(sortItems(items))
      setItemsHeading(null)
      return
    }
    if (search.term.length < 2) {
      return
    }

    // Build search regex. \b represents a word boundary, so matches in the
    // middle of a word don't count. Includes special case for searching by
    // paper number so only the exact paper is matched.
    const escapedTerm = _.escapeRegExp(search.term.toLowerCase())
    let [preModifier, postModifier] = ['\\b', '']
    if (escapedTerm.startsWith('#')) {
      [preModifier, postModifier] = ['^', '\\b']
    }
    const searchRegex = new RegExp(preModifier + escapedTerm + postModifier, 'm')

    // Search existing items
    const matchingItems = items.filter(item => item.searchText.match(searchRegex))

    // Search all other items that don't share edges with the parent entity
    if (parentId) {
      const searchedIds = items.map(item => item.id)

      Object.values(globalEntityMap).forEach((item) => {
        if (searchedIds.includes(item.id)) return

        if (item.searchText.match(searchRegex)) {
          matchingItems.push({
            ...item,
            editEdge: buildNewEditEdge(item.id),
            browseEdges: [],
            metadata: {
              isAssigned: false,
            },
          })
        }
      })
    }

    setFilteredItems(sortItems(matchingItems))
    setItemsHeading('Search Results')
  }, [items, search, columnSort])

  useEffect(() => {
    setNumItemsToRender(100)
    colBodyEl.current.scrollTop = 0
  }, [search, columnSort])

  // Event Handlers
  const addEdgeToEntity = (id, newEdge) => {
    const entityIndex = _.findIndex(items, ['id', id])
    let modifiedExistingEdge = false

    if (entityIndex > -1) {
      // Added (or modified) from existing list
      const editEdgeId = items[entityIndex].editEdge.id
      if (editEdgeId && editEdgeId === newEdge.id) {
        modifiedExistingEdge = true
      }

      const itemToAdd = {
        ...items[entityIndex],
        editEdge: newEdge,
        metadata: {
          ...items[entityIndex].metadata,
          isAssigned: true,
          isUserAssigned: true,
          isUserUnassigned: false,
        },
      }
      setItems([
        ...items.slice(0, entityIndex),
        itemToAdd,
        ...items.slice(entityIndex + 1),
      ])
    } else {
      // Added from search
      const newItem = {
        ...globalEntityMap[id],
        editEdge: buildNewEditEdge(id),
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
      props.updateMetadataMap(id, parentId, { isUserAssigned: true, isUserUnassigned: false })
    } else {
      props.updateMetadataMap(parentId, id, { isUserAssigned: true, isUserUnassigned: false })
    }

    // Update global head and tail maps
    const incr = modifiedExistingEdge ? 0 : 1
    const newCount1 = altGlobalEntityMap[parentId].traverseEdgesCount + incr
    props.updateGlobalEntityMap(otherType, parentId, 'traverseEdgesCount', newCount1)

    const newCount2 = globalEntityMap[id].traverseEdgesCount + incr
    props.updateGlobalEntityMap(type, id, 'traverseEdgesCount', newCount2)
  }

  const removeEdgeFromEntity = (id, removedEdge) => {
    const entityIndex = _.findIndex(items, ['id', id])
    if (entityIndex === -1) {
      return
    }

    const itemToAdd = {
      ...items[entityIndex],
      editEdge: removedEdge,
      metadata: {
        ...items[entityIndex].metadata,
        isAssigned: false,
        isUserAssigned: false,
        isUserUnassigned: true,
      },
    }
    setItems([
      ...items.slice(0, entityIndex),
      itemToAdd,
      ...items.slice(entityIndex + 1),
    ])

    if (type === 'head') {
      props.updateMetadataMap(id, parentId, { isUserAssigned: false, isUserUnassigned: true })
    } else {
      props.updateMetadataMap(parentId, id, { isUserAssigned: false, isUserUnassigned: true })
    }

    // Update global head and tail maps
    const newCount1 = altGlobalEntityMap[parentId].traverseEdgesCount - 1
    props.updateGlobalEntityMap(otherType, parentId, 'traverseEdgesCount', newCount1)

    const newCount2 = globalEntityMap[id].traverseEdgesCount - 1
    props.updateGlobalEntityMap(type, id, 'traverseEdgesCount', newCount2)
  }

  // Render
  return (
    <div className={`column ${props.finalColumn ? 'column-final' : ''}`} tabIndex="-1">
      <div className="head">
        {getColumnTitle()}
        {getColumnDescription()}
      </div>
      <div className="col-search">
        <form role="search" onSubmit={e => e.preventDefault()}>
          <div className="filter-container form-group has-feedback">
            <input
              type="text"
              className="form-control input-sm"
              placeholder={getSearchPlaceholder()}
              value={search.term}
              onChange={e => setSearch({ term: e.target.value })}
            />
            <span className="glyphicon glyphicon-search form-control-feedback" aria-hidden="true" />
          </div>
          {parentId && (
            <div className="sort-container form-group">
              {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
              <label>Order By:</label>
              <select className="form-control input-sm" onChange={e => setColumnSort(e.target.value)}>
                <option key={traverseInvitation.id} value="default">
                  {prettyInvitationId(traverseInvitation.id)}
                </option>
                {browseInvitations.map(inv => (
                  <option key={inv.id} value={inv.id}>
                    {prettyInvitationId(inv.id)}
                  </option>
                ))}
              </select>
            </div>
          )}
        </form>
      </div>

      <div className="body" ref={colBodyEl} onScroll={loadMoreItems}>
        {items === null ? (
          <LoadingSpinner />
        ) : (
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
            showHiddenItems={itemsHeading === 'Search Results'}
          />
        )}
      </div>
    </div>
  )
}
