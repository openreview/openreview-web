/* eslint-disable react/destructuring-assignment */
/* eslint-disable react/no-access-state-in-setstate */
/* globals promptError: false */

import React from 'react'
import _ from 'lodash'
import Column from './Column'
import EdgeBrowserContext from './EdgeBrowserContext'
import api from '../../lib/api-client'
import { formatEntityContent, buildSearchText } from '../../lib/edge-utils'
import { prettyId } from '../../lib/utils'

export default class EdgeBrowser extends React.Component {
  constructor(props) {
    super(props)

    this.version = props.version
    this.startInvitation = props.startInvitation
    this.traverseInvitation = props.traverseInvitations[0]
    this.editInvitations = props.editInvitations
    this.browseInvitations = props.browseInvitations
    this.hideInvitation = props.hideInvitations[0]
    this.maxColumns = props.maxColumns
    this.showCounter = props.showCounter

    let initialColumn
    if (this.startInvitation) {
      let initialColType
      if (this.startInvitation.query.type) {
        initialColType = this.startInvitation.query.type
      } else {
        initialColType = this.startInvitation.query.head ? 'tail' : 'head'
      }

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
      .catch((error) => promptError(error.message))
  }

  buildEntityMapFromInvitation(headOrTail) {
    // Get all head or tail objects referenced by the traverse parameter invitation
    const invReplyObj = this.traverseInvitation[headOrTail]
    const requestParams = { ...invReplyObj?.query } // avoid polluting invReplyObj which is used for compare
    const localQuery = invReplyObj?.localQuery
    const apiUrlMap = {
      note: '/notes',
      profile: '/profiles',
      group: '/groups',
      tag: '/tags',
    }
    const mainResultsP = api
      .getAll(apiUrlMap[invReplyObj.type], requestParams, {
        accessToken: this.accessToken,
        version: this.version,
      })
      .then((results) =>
        results.filter((result) => {
          if (localQuery?.content) {
            return Object.keys(localQuery.content).every(
              (key) => result.content[key]?.value === localQuery.content[key]
            )
          }
          return true
        })
      )

    // Get all head or tail objects referenced by the start parameter edge
    // invitation. Note: currently startInvitation has to have the same head
    // and tail types as traverseInvitation
    let startResultsP
    const startInv = this.startInvitation?.[headOrTail]
    if (
      startInv &&
      (startInv.type !== invReplyObj.type || !_.isEqual(startInv.query, invReplyObj.query))
    ) {
      const startRequestParams = startInv.query || {}
      if (startInv.type === 'note') {
        startRequestParams.invitation = startInv.query.invitation
      }
      startResultsP = api.getAll(apiUrlMap[startInv.type], startRequestParams, {
        accessToken: this.accessToken,
        version: this.version,
      })
    } else {
      startResultsP = Promise.resolve([])
    }

    // Get list of all keys to seed the entity map with. Currently only used for
    // profiles
    let initialKeysP
    if (invReplyObj.type === 'profile' && requestParams.group) {
      initialKeysP = api
        .get(
          '/groups',
          { id: requestParams.group },
          { accessToken: this.accessToken, version: this.version }
        )
        .then((response) => _.get(response, 'groups[0].members', []))
    } else {
      initialKeysP = Promise.resolve(null)
    }

    const groupedEdgesP = api
      .getAll(
        '/edges',
        {
          invitation: this.traverseInvitation.id,
          groupBy: headOrTail,
          select: 'count',
          ...this.traverseInvitation.query,
          ...(this.traverseInvitation.domain
            ? { domain: this.traverseInvitation.domain }
            : {}),
        },
        { accessToken: this.accessToken, version: this.version, resultsKey: 'groupedEdges' }
      )
      .then((results) => _.keyBy(results, `id.${headOrTail}`))

    return Promise.all([initialKeysP, mainResultsP, startResultsP, groupedEdgesP]).then(
      ([initialKeys, mainResults, startResults, groupedEdges]) => {
        const useInitialKeys = initialKeys && initialKeys.length
        const entityMap = useInitialKeys
          ? _.fromPairs(initialKeys.map((key) => [key, null]))
          : {}

        const buildEntityMap = (entity) => {
          if (useInitialKeys && entityMap[entity.id] === undefined) return
          if (entityMap[entity.id]) return

          const entityType = invReplyObj.type
          entityMap[entity.id] = formatEntityContent(entity, entityType)
          entityMap[entity.id].searchText = buildSearchText(entity, entityType, this.version)
          entityMap[entity.id].traverseEdgesCount = _.get(
            groupedEdges,
            [entity.id, 'count'],
            0
          )
        }
        mainResults.forEach(buildEntityMap)
        startResults.forEach(buildEntityMap)

        // After profile map has been created, if there are any ids without profiles
        // create dummy profiles for them
        if (useInitialKeys) {
          Object.keys(entityMap).forEach((key) => {
            if (entityMap[key]) return

            entityMap[key] = {
              id: key,
              content: {
                name: { fullname: key },
                email: key,
                title: '',
                expertise: [],
                isDummyProfile: true,
              },
              searchText: key,
              traverseEdgesCount: _.get(groupedEdges, [key, 'count'], 0),
            }
          })

          // Also iterate through grouped edges and create dummy profiles for any ids missing
          // from the entity map
          Object.keys(groupedEdges).forEach((key) => {
            if (entityMap[key]) return

            entityMap[key] = {
              id: key,
              content: {
                name: { fullname: prettyId(key) },
                email: key,
                title: '',
                expertise: [],
                isDummyProfile: true,
                isInvitedProfile: true,
              },
              searchText: `${key}\n${prettyId(key)}`,
              traverseEdgesCount: groupedEdges[key].count,
            }
          })
        }

        return entityMap
      }
    )
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

      this.setState(
        {
          columns: [...this.state.columns.slice(0, index + 1), newCol],
        },
        () => {
          // This relies on the experimental CSS property scroll-behavior for smooth scrolling
          // For a more cross-browser compatible solution we could use:
          // $(this.exploreInterfaceRef.current).animate({ scrollLeft: '+=800' }, 200)
          this.exploreInterfaceRef.current.scrollLeft += 800
        }
      )
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
    this.setState((prevState) => {
      if (index + 1 >= prevState.columns.length) return null
      const parentIdOfColumn = prevState.columns[index].parentId
      const resultColumns = []
      resultColumns.push(prevState.columns[0])
      for (let i = 1; i < prevState.columns.length; i += 1) {
        const parentColumn = prevState.columns[i - 1]
        const column = prevState.columns[i]
        if (parentColumn.parentId === parentIdOfColumn) {
          const updatedColumn = {
            ...column,
            parentCustomLoad: customLoad,
          }
          resultColumns.push(updatedColumn)
        } else {
          resultColumns.push(column)
        }
      }
      return { columns: resultColumns }
    })
  }

  // set the shouldUpdate property of column at index
  // and all other columns with same parent
  // to trigger entites reload of those columns
  reloadColumnEntities(index) {
    this.setState((prevState) => {
      const parentIdOfColumn = prevState.columns[index].parentId
      const resultColumns = prevState.columns.map((column) => {
        if (column?.parentId === parentIdOfColumn) {
          return { ...column, shouldReloadEntities: !column.shouldReloadEntities }
        }
        return column
      })
      return { columns: resultColumns }
    })
  }

  async lookupSignatures() {
    const editInvitationSignaturesMap = []
    // traverseInvitation may be edited without being in edit param
    const editTranerseInvitations = [...this.editInvitations, this.traverseInvitation]
    editTranerseInvitations?.forEach(async (editInvitation) => {
      // this case is handled here to reduce num of calls to /groups,other cases handled at entity
      if (
        editInvitation.signatures['values-regex'] &&
        !editInvitation.signatures['values-regex']?.startsWith('~.*')
      ) {
        if (editInvitation.signatures.default) {
          try {
            const defaultLookupResult = await api.get(
              '/groups',
              { id: editInvitation.signatures.default, signatory: this.userId },
              { accessToken: this.accessToken, version: this.version }
            )
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
        const interpolatedSignature = editInvitation.signatures['values-regex'].replace(
          /{head\.number}/g,
          '.*'
        )
        try {
          const interpolatedLookupResult = await api.get(
            '/groups',
            {
              regex: interpolatedSignature,
              signatory: this.userId,
              ...(editInvitation.domain && { domain: editInvitation.domain }),
            },
            { accessToken: this.accessToken, version: 1 } // Use only version 1 where regex is supported
          )
          editInvitationSignaturesMap.push({
            invitation: editInvitation.id,
            signatures: interpolatedLookupResult.groups.map((group) => group.id),
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
      ignoreHeadBrowseInvitations: this.startInvitation?.query?.storageKey
        ? []
        : this.browseInvitations?.filter((p) => p?.query?.head === 'ignore'),
      hideInvitation: this.hideInvitation,
      availableSignaturesInvitationMap: this.availableSignaturesInvitationMap,
      version: this.version,
    }

    return (
      <EdgeBrowserContext.Provider value={invitations}>
        <div
          className={`row explore-interface expand-columns-${this.maxColumns}`}
          ref={this.exploreInterfaceRef}
        >
          {this.state.columns.map((column, i) => (
            <Column
              // eslint-disable-next-line react/no-array-index-key
              key={`${column.parentId || 'start-col'}-${i}`}
              type={column.type}
              entityType={column.entityType}
              parentId={column.parentId}
              startInvitation={i === 0 ? this.startInvitation : null}
              globalEntityMap={
                column.type === 'head' ? this.state.headMap : this.state.tailMap
              }
              altGlobalEntityMap={
                column.type === 'head' ? this.state.tailMap : this.state.headMap
              }
              updateGlobalEntityMap={this.updateGlobalEntityMap}
              metadataMap={this.state.metadataMap}
              updateMetadataMap={this.updateMetadataMap}
              addNewColumn={this.addNewColumn(i)}
              loading={this.state.loading}
              finalColumn={i + 1 === this.maxColumns}
              showCounter={this.showCounter}
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
