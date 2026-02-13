import React from 'react'
import List from 'rc-virtual-list'
import { maxBy } from 'lodash'
import { getProfileName } from '../lib/utils'
import { BidRadioButtonGroup, BidScore } from './webfield/BidWidget'
import ProfileLink from './webfield/ProfileLink'

const getTitle = (profile) => {
  if (!profile.content) return null
  const latestHistory =
    profile.content.history?.find((p) => !p.end) || maxBy(profile.content.history, 'end')
  const title = latestHistory
    ? `${latestHistory.position ? `${latestHistory.position} at ` : ''}${
        latestHistory.institution?.name ?? ''
      }${latestHistory.institution?.domain ? ` (${latestHistory.institution?.domain})` : ''}`
    : ''
  return title
}

const BasicProfileSummary = ({ profile, setSearchTerm }) => {
  const profileName = getProfileName(profile)
  const expertises = profile?.content?.expertise?.flatMap((p) => p.keywords) ?? []

  if (!profile) return null
  return (
    <div className="profile-summary">
      <h4 className="profile-name">
        <ProfileLink id={profile.id} name={profileName} />
      </h4>
      <span className="profile-title">{getTitle(profile)}</span>
      {expertises.length ? (
        <div className="profile-expertise">
          <b>Expertise:</b>{' '}
          {setSearchTerm ? (
            <>
              {expertises.map((expertise, index) => (
                <React.Fragment key={index}>
                  {index !== 0 && <span>, </span>}
                  <span role="button" onClick={() => setSearchTerm(expertise)}>
                    {expertise}
                  </span>
                </React.Fragment>
              ))}
            </>
          ) : (
            <span>{expertises.join(', ')}</span>
          )}
        </div>
      ) : null}
    </div>
  )
}

// only work with v2 api
const ProfileListWithBidWidget = ({
  profiles,
  bidOptions,
  bidEdges,
  scoreEdges,
  emptyMessage,
  updateBidOption,
  virtualList,
  bidUpdateStatus,
  setSearchTerm,
}) => {
  const renderNoteWithBidWidget = (profile, selectedBidOption, scoreEdge) => (
    <div className="bid-container">
      <BasicProfileSummary
        profile={profile}
        profileId={profile.id}
        setSearchTerm={setSearchTerm}
      />
      <BidRadioButtonGroup
        label="Bid"
        options={bidOptions}
        selectedBidOption={selectedBidOption}
        updateBidOption={(updatedOption) => updateBidOption(profile, updatedOption)}
        bidUpdateStatus={bidUpdateStatus}
      />
      {<BidScore scoreEdge={scoreEdge} />}
    </div>
  )

  if (virtualList) {
    return (
      <div className="profiles-list">
        <ul className="list-unstyled">
          <List
            data={profiles}
            height={profiles.length === 0 ? 0 : window.innerHeight}
            itemHeight={135}
            itemKey="id"
          >
            {(profile) => {
              const selectedBidOption = bidEdges?.find((p) => p.head === profile.id)?.label
              const scoreEdge = scoreEdges?.find((p) => p.head === profile.id)
              return renderNoteWithBidWidget(profile, selectedBidOption, scoreEdge)
            }}
          </List>
          {profiles.length === 0 && (
            <li>
              <p className="empty-message">{emptyMessage}</p>
            </li>
          )}
        </ul>
      </div>
    )
  }

  return (
    <div className="profiles-list">
      <ul className="list-unstyled">
        {profiles.map((profile) => {
          const selectedBidOption = bidEdges?.find((p) => p.head === profile.id)?.label
          const scoreEdge = scoreEdges?.find((p) => p.head === profile.id)

          return (
            <li key={profile.id}>
              {renderNoteWithBidWidget(profile, selectedBidOption, scoreEdge)}
            </li>
          )
        })}

        {profiles.length === 0 && (
          <li>
            <p className="empty-message">{emptyMessage}</p>
          </li>
        )}
      </ul>
    </div>
  )
}

export default ProfileListWithBidWidget
