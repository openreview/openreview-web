/* eslint-disable react/destructuring-assignment */

import { useContext } from 'react'
import EdgeBrowserContext from './EdgeBrowserContext'
import NoteEntity from './NoteEntity'
import GroupEntity from './GroupEntity'
import ProfileEntity from './ProfileEntity'
import TagEntity from './TagEntity'
import { pluralizeString } from '../../lib/utils'

export default function EntityList(props) {
  const { traverseInvitation } = useContext(EdgeBrowserContext)
  const traverseLabel = pluralizeString(traverseInvitation.name.split(' ').pop())

  const renderEntity = (entity, index) => {
    if ((entity.metadata && entity.metadata.isHidden) && !props.showHiddenItems) {
      return null
    }

    const isSelected = entity.id === props.selectedItemId
    switch (props.type) {
      case 'Note':
        return (
          <NoteEntity
            key={`${entity.id}-${index}`}
            note={entity}
            traverseLabel={traverseLabel}
            addNewColumn={props.addNewColumn}
            addEdgeToEntity={props.addEdgeToEntity}
            removeEdgeFromEntity={props.removeEdgeFromEntity}
            isSelected={isSelected}
            setSelectedItemId={props.setSelectedItemId}
            canTraverse={props.canTraverse}
            columnType={props.columnType}
            parentInfo={props.parentInfo}
            altGlobalEntityMap={props.altGlobalEntityMap}
            reloadWithoutUpdate={props.reloadWithoutUpdate}
          />
        )

      case 'Group':
        return (
          <GroupEntity
            key={`${entity.id}-${index}`}
            group={entity}
            traverseLabel={traverseLabel}
            addNewColumn={props.addNewColumn}
            addEdgeToEntity={props.addEdgeToEntity}
            removeEdgeFromEntity={props.removeEdgeFromEntity}
            isSelected={isSelected}
            setSelectedItemId={props.setSelectedItemId}
            canTraverse={props.canTraverse}
          />
        )

      case 'Profile':
        return (
          <ProfileEntity
            key={`${entity.id}-${index}`}
            profile={entity}
            traverseLabel={traverseLabel}
            addNewColumn={props.addNewColumn}
            addEdgeToEntity={props.addEdgeToEntity}
            removeEdgeFromEntity={props.removeEdgeFromEntity}
            isSelected={isSelected}
            setSelectedItemId={props.setSelectedItemId}
            canTraverse={props.canTraverse}
            columnType={props.columnType}
            parentInfo={props.parentInfo}
            reloadWithoutUpdate={props.reloadWithoutUpdate}
            updateChildColumn={props.updateChildColumn}
            columnIndex={props.columnIndex}
          />
        )

      case 'Tag':
        return (
          <TagEntity
            key={`${entity.id}-${index}`}
            tag={entity}
            traverseLabel={traverseLabel}
            addNewColumn={props.addNewColumn}
            addEdgeToEntity={props.addEdgeToEntity}
            removeEdgeFromEntity={props.removeEdgeFromEntity}
            isSelected={isSelected}
            setSelectedItemId={props.setSelectedItemId}
            canTraverse={props.canTraverse}
          />
        )

      default:
        return null
    }
  }

  return (
    <>
      {props.heading && (
        <h3 className="entry divider">{props.heading}</h3>
      )}

      {props.items?.length > 0 ? (
        <ul className={`list-unstyled entry-list ${!props.heading ? 'without-title' : ''}`}>
          {props.items.slice(0, props.numItemsToRender).map(renderEntity)}
        </ul>
      ) : (
        <p className="empty-message">{`No ${props.type.toLowerCase()}s to display`}</p>
      )}
    </>
  )
}
