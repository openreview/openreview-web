/* globals Webfield: false */
/* eslint-disable react/destructuring-assignment */
/* eslint-disable react/no-access-state-in-setstate */
/* globals promptError: false */

import React from 'react'
import _ from 'lodash'
import Column from './Column'
import EdgeBrowserContext from './EdgeBrowserContext'
import { formatEntityContent, buildSearchText } from '../../lib/edge-utils'
import api from '../../lib/api-client'

export default class EdgeBrowser extends React.Component {
  constructor(props) {
    super(props)

    this.startInvitation = props.startInvitation
    this.traverseInvitation = props.traverseInvitations[0]
    this.editInvitations = props.editInvitations
    this.browseInvitations = props.browseInvitations
    this.hideInvitation = props.hideInvitations[0]
    this.maxColumns = props.maxColumns

    let initialColumn
    if (this.startInvitation) {
      const initialColType = (this.startInvitation.query.head || this.startInvitation.query.type === 'tail')
        ? 'tail'
        : 'head'
      initialColumn = {
        type: initialColType,
        entityType: this.startInvitation[initialColType].type,
        parent: null,
      }
    } else {
      initialColumn = {
        type: 'head',
        entityType: this.traverseInvitation.head.type,
        parent: null,
      }
    }

    this.state = {
      headMap: {},
      tailMap: {},
      metadataMap: {},
      columns: [initialColumn],
      loading: true,
    }

    this.exploreInterfaceRef = React.createRef()
    this.updateGlobalEntityMap = this.updateGlobalEntityMap.bind(this)
    this.updateMetadataMap = this.updateMetadataMap.bind(this)
    this.updateChildColumn = this.updateChildColumn.bind(this)
    this.reloadColumnEntities = this.reloadColumnEntities.bind(this)

    this.userId = props.userInfo.userId
    this.accessToken = props.userInfo.accessToken

    this.availableSignaturesInvitationMap = []
  }

  componentDidMount() {
    this.lookupSignatures()
    // Create gloabl head and tail maps by querying all possible head and tail objects
    // create global signature list
    Promise.all([
      this.buildEntityMapFromInvitation('head'),
      this.buildEntityMapFromInvitation('tail'),
    ])
      .then(([headMap, tailMap]) => {
        this.setState({
          headMap,
          tailMap,
          loading: false,
        })
      })
  }

  buildEntityMapFromInvitation(headOrTail) {
    // Get all head or tail objects referenced by the traverse parameter invitation
    const invReplyObj = this.traverseInvitation[headOrTail]
    const requestParams = { ...invReplyObj?.query } // avoid polluting invReplyObj which is used for compare
    if (invReplyObj.type === 'Note') {
      // TODO: move these params to the invitation so it's not hardcoded
      requestParams.details = 'original'
      requestParams.sort = 'number:asc'
    }
    const apiUrlMap = {
      Note: '/notes',
      Profile: '/profiles',
      Group: '/groups',
      Tag: '/tags',
    }
    const mainResultsP = Webfield.getAll(apiUrlMap[invReplyObj.type], requestParams)

    // Get all head or tail objects referenced by the start parameter edge
    // invitation. Note: currently startInvitation has to have the same head
    // and tail types as traverseInvitation
    let startResultsP
    const startInv = this.startInvitation?.[headOrTail]
    if (this.startInvitation && (
      startInv.type !== invReplyObj.type || !_.isEqual(startInv.query, invReplyObj.query)
    )) {
      const startRequestParams = startInv.query || {}
      if (startInv.type === 'Note') {
        startRequestParams.details = 'original'
        startRequestParams.sort = 'number:asc'
      }
      startResultsP = Webfield.getAll(apiUrlMap[startInv.type], startRequestParams)
    } else {
      startResultsP = Promise.resolve([])
    }

    // Get list of all keys to seed the entity map with. Currently only used for
    // profiles
    let initialKeysP
    if (invReplyObj.type === 'Profile' && requestParams.group) {
      initialKeysP = Webfield.get('/groups', { id: requestParams.group })
        .then(response => _.get(response, 'groups[0].members', []))
    } else {
      initialKeysP = Promise.resolve(null)
    }

    const groupedEdgesP = Webfield.getAll('/edges', {
      invitation: this.traverseInvitation.id,
      groupBy: headOrTail,
      select: 'count',
      ...this.traverseInvitation.query,
    }, 'groupedEdges').then(results => _.keyBy(results, `id.${headOrTail}`))

    return Promise.all([
      initialKeysP,
      mainResultsP,
      startResultsP,
      groupedEdgesP,
    ])
      .then(([initialKeys, mainResults, startResults, groupedEdges]) => {
        const useInitialKeys = initialKeys && initialKeys.length
        const entityMap = useInitialKeys ? _.fromPairs(initialKeys.map(key => [key, null])) : {}

        const buildEntityMap = (entity) => {
          if (useInitialKeys && entityMap[entity.id] === undefined) return
          if (entityMap[entity.id]) return

          const entityType = invReplyObj.type
          entityMap[entity.id] = formatEntityContent(entity, entityType)
          entityMap[entity.id].searchText = buildSearchText(entity, entityType)
          entityMap[entity.id].traverseEdgesCount = _.get(groupedEdges, [entity.id, 'count'], 0)
        }
        mainResults.forEach(buildEntityMap)
        startResults.forEach(buildEntityMap)

        // After profile map has been created, if there are any ids without profiles
        // create dummy profiles for them
        if (useInitialKeys) {
          Object.keys(entityMap).forEach((key) => {
            if (entityMap[key]) {
              return
            }

            entityMap[key] = {
              id: key,
              content: {
                name: { first: key, middle: '', last: '' },
                email: key,
                title: 'Unknown',
                expertise: [],
                isDummyProfile: true,
              },
              searchText: key,
              traverseEdgesCount: _.get(groupedEdges, [key, 'count'], 0),
            }
          })
        }
        return entityMap
      })
  }

  addNewColumn(index) {
    return (parentId, parentContent, parentCustomLoad, parentExistingLoad) => {
      if (!parentId) {
        return
      }
      if (index + 1 === this.maxColumns) {
        // eslint-disable-next-line no-console
        console.warn('Cannot add new column: maxColumns limit reached')
        return
      }

      let type
      let entityType
      if (this.state.columns[index].type === 'head') {
        type = 'tail'
        entityType = this.traverseInvitation.tail.type
      } else {
        type = 'head'
        entityType = this.traverseInvitation.head.type
      }
      const newCol = {
        type,
        entityType,
        parentId,
        parentContent,
        parentCustomLoad,
        parentExistingLoad,
        shouldReloadEntities: false,
      }

      this.setState({
        columns: [...this.state.columns.slice(0, index + 1), newCol],
      }, () => {
        // This relies on the experimental CSS property scroll-behavior for smooth scrolling
        // For a more cross-browser compatible solution we could use:
        // $(this.exploreInterfaceRef.current).animate({ scrollLeft: '+=800' }, 200)
        this.exploreInterfaceRef.current.scrollLeft += 800
      })
    }
  }

  updateGlobalEntityMap(headOrTail, id, fieldName, newVal) {
    const entityMap = headOrTail === 'head' ? this.state.headMap : this.state.tailMap
    const entityMapName = headOrTail === 'head' ? 'headMap' : 'tailMap'
    if (!entityMap[id]) {
      return
    }

    const newEntity = { ...entityMap[id], [fieldName]: newVal }
    this.setState({
      [entityMapName]: { ...entityMap, [id]: newEntity },
    })
  }

  updateMetadataMap(headId, tailId, updateObj) {
    const mergedObj = { ..._.get(this.state.metadataMap, [headId, tailId], {}), ...updateObj }
    this.setState({
      metadataMap: {
        ...this.state.metadataMap,
        [headId]: {
          ..._.get(this.state.metadataMap, [headId], {}),
          [tailId]: mergedObj,
        },
      },
    })
  }

  // update the parentCustomLoad of child column
  // when custom load of a column is changed
  // index is index of the column where the custom load of an entity is changed
  // also update if there's column with same parent
  updateChildColumn(index, customLoad) {
    if (index + 1 >= this.state.columns.length) return
    const parentIdOfColumn = this.state.columns[index].parentId
    const resultColumns = []
    resultColumns.push(this.state.columns[0])
    for (let i = 1; i < this.state.columns.length; i += 1) {
      const parentColumn = this.state.columns[i - 1]
      const column = this.state.columns[i]
      if (parentColumn.parentId === parentIdOfColumn) {
        resultColumns.push({ ...column, parentCustomLoad: customLoad })
      } else {
        resultColumns.push(column)
      }
    }
    this.setState({ columns: resultColumns })
  }

  // set the shouldUpdate property of column at index
  // and all other columns with same parent
  // to trigger entites reload of those columns
  reloadColumnEntities(index) {
    const parentIdOfColumn = this.state.columns[index].parentId
    const resultColumns = []
    for (let i = 0; i < this.state.columns.length; i += 1) {
      const column = this.state.columns[i]
      if (column?.parentId === parentIdOfColumn) {
        resultColumns.push({ ...column, shouldReloadEntities: !column.shouldReloadEntities })
      } else {
        resultColumns.push(column)
      }
    }
    this.setState({ columns: resultColumns })
  }

  async lookupSignatures() {
    const editInvitationSignaturesMap = []
    this.editInvitations?.forEach(async (editInvitation) => {
      // this case is handled here to reduce num of calls to /groups,other cases handled at entity
      if (editInvitation.signatures['values-regex'] && !editInvitation.signatures['values-regex']?.startsWith('~.*')) {
        if (editInvitation.signatures.default) {
          try {
            const defaultLookupResult = await api.get('/groups', { regex: editInvitation.signatures.default, signatory: this.userId }, { accessToken: this.accessToken })
            if (defaultLookupResult.groups.length === 1) {
              editInvitationSignaturesMap.push({
                invitation: editInvitation.id,
                signature: editInvitation.signatures.default, // singular
              })
              return
            }
          } catch (error) {
            promptError(error.message)
          }
        }
        const interpolatedSignature = editInvitation.signatures['values-regex'].replaceAll('{head.number}', '.*')
        try {
          const interpolatedLookupResult = await api.get('/groups', { regex: interpolatedSignature, signatory: this.userId }, { accessToken: this.accessToken })
          editInvitationSignaturesMap.push({
            invitation: editInvitation.id,
            signatures: interpolatedLookupResult.groups.map(group => group.id),
          })
        } catch (error) {
          promptError(error.message)
        }
      }
    })
    this.availableSignaturesInvitationMap = editInvitationSignaturesMap
  }

  render() {
    const invitations = {
      traverseInvitation: this.traverseInvitation,
      editInvitations: this.editInvitations,
      browseInvitations: this.browseInvitations,
      hideInvitation: this.hideInvitation,
      availableSignaturesInvitationMap: this.availableSignaturesInvitationMap,
    }

    return (
      <EdgeBrowserContext.Provider value={invitations}>
        <div className={`row explore-interface expand-columns-${this.maxColumns}`} ref={this.exploreInterfaceRef}>
          {this.state.columns.map((column, i) => (
            <Column
              // eslint-disable-next-line react/no-array-index-key
              key={`${column.parentId || 'start-col'}-${i}`}
              type={column.type}
              entityType={column.entityType}
              parentId={column.parentId}
              startInvitation={i === 0 ? this.startInvitation : null}
              globalEntityMap={column.type === 'head' ? this.state.headMap : this.state.tailMap}
              altGlobalEntityMap={column.type === 'head' ? this.state.tailMap : this.state.headMap}
              updateGlobalEntityMap={this.updateGlobalEntityMap}
              metadataMap={this.state.metadataMap}
              updateMetadataMap={this.updateMetadataMap}
              addNewColumn={this.addNewColumn(i)}
              loading={this.state.loading}
              finalColumn={i + 1 === this.maxColumns}
              parentColumnEntityType={this.state.columns[i - 1]?.entityType} // to decide whether number can be used
              parentContent={column.parentContent}
              parentTraverseCount={column.parentTraverseCount}
              parentCustomLoad={column.parentCustomLoad}
              parentExistingLoad={column.parentExistingLoad}
              index={i}
              updateChildColumn={this.updateChildColumn}
              shouldReloadEntities={column.shouldReloadEntities}
              reloadColumnEntities={this.reloadColumnEntities}
            />
          ))}
          <div className="column column-spacer" tabIndex="-1" />
        </div>
      </EdgeBrowserContext.Provider>
    )
  }
}
