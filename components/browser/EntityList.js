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

  const {
    heading, items, numItemsToRender, type,
  } = props

  const renderEntity = (entity, index) => {
    if ((entity.metadata && entity.metadata.isHidden) && !props.showHiddenItems) {
      return null
    }

    const isSelected = entity.id === props.selectedItemId
    switch (type) {
      case 'note':
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
            reloadColumnEntities={props.reloadColumnEntities}
          />
        )

      case 'group':
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

      case 'profile':
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
            reloadColumnEntities={props.reloadColumnEntities}
            updateChildColumn={props.updateChildColumn}
            columnIndex={props.columnIndex}
          />
        )

      case 'tag':
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
      {heading && (
        <h3 className="entry divider">{heading}</h3>
      )}

      {items?.length > 0 ? (
        <ul className={`list-unstyled entry-list ${!heading ? 'without-title' : ''}`}>
          {items.slice(0, numItemsToRender).map(renderEntity)}
        </ul>
      ) : (
        <p className="empty-message">{`No ${type.toLowerCase()}s to display`}</p>
      )}
    </>
  )
}
