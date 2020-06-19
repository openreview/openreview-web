/* eslint-disable react/destructuring-assignment */

import { useContext } from 'react'
import EdgeBrowserContext from './EdgeBrowserContext'
import NoteEntity from './NoteEntity'
import GroupEntity from './GroupEntity'
import ProfileEntity from './ProfileEntity'
import TagEntity from './TagEntity'

export default function EntityList(props) {
  const { traverseInvitation } = useContext(EdgeBrowserContext)

  let traverseLabel = 'Edges'
  if (traverseInvitation.name === 'Paper Assignment') {
    if (props.type === 'Note') {
      traverseLabel = 'Assigned Reviewers'
    } else if (props.type === 'Profile') {
      traverseLabel = 'Assigned Papers'
    }
  } else if (traverseInvitation.name === 'Paper Similarity') {
    traverseLabel = 'Similar Papers'
  } else if (traverseInvitation.name === 'Recommendation') {
    if (props.type === 'Note') {
      traverseLabel = 'Recommended Reviewers'
    } else if (props.type === 'Profile') {
      traverseLabel = 'Number of Recommendations'
    }
  }

  const renderEntity = (entity) => {
    if ((entity.metadata && entity.metadata.isHidden) && !props.showHiddenItems) {
      return null
    }

    const isSelected = entity.id === props.selectedItemId
    switch (props.type) {
      case 'Note':
        return (
          <NoteEntity
            key={entity.id}
            note={entity}
            traverseLabel={traverseLabel}
            addNewColumn={props.addNewColumn}
            addEdgeToEntity={props.addEdgeToEntity}
            removeEdgeFromEntity={props.removeEdgeFromEntity}
            isSelected={isSelected}
            setSelectedItemId={props.setSelectedItemId}
            canTraverse={props.canTraverse}
          />
        )

      case 'Group':
        return (
          <GroupEntity
            key={entity.id}
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
            key={entity.id}
            profile={entity}
            traverseLabel={traverseLabel}
            addNewColumn={props.addNewColumn}
            addEdgeToEntity={props.addEdgeToEntity}
            removeEdgeFromEntity={props.removeEdgeFromEntity}
            isSelected={isSelected}
            setSelectedItemId={props.setSelectedItemId}
            canTraverse={props.canTraverse}
          />
        )

      case 'Tag':
        return (
          <TagEntity
            key={entity.id}
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
