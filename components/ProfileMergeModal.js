/* globals $,promptMessage: false */

import { useState, useContext, useReducer, useEffect } from 'react'
import BasicModal from './BasicModal'
import UserContext from './UserContext'
import api from '../lib/api-client'
import { buildArray, isValidEmail } from '../lib/utils'

const ProfileMergeModal = ({ preFillProfileMergeInfo }) => {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const { accessToken, user } = useContext(UserContext)
  const profileMergeInvitationId = `${process.env.SUPER_USER}/Support/-/Profile_Merge`
  const defaultProfileMergeInfo = {
    email: '',
    idsToMerge: '',
    comment: '',
  }
  const [profileMergeInfo, setProfileMergeInfo] = useReducer(
    profileMergeInfoReducer, // eslint-disable-line no-use-before-define
    preFillProfileMergeInfo ?? defaultProfileMergeInfo
  )

  useEffect(() => {
    if (preFillProfileMergeInfo) setProfileMergeInfo({ type: 'PREFILL' })
  }, [preFillProfileMergeInfo])

  function getProfilePairsToMerge(profileIds) {
    const ids = [...new Set(profileIds.split(',').map((p) => p.trim()))]
    const idPairsToMerge = ids.reduce((prev, curr, index) => {
      const remaining = ids.slice(index + 1)
      remaining.forEach((p) => {
        prev.push({ left: curr, right: p })
      })

      return prev
    }, [])
    return idPairsToMerge
  }

  function profileMergeInfoReducer(state, action) {
    if (action.type === 'INIT') return preFillProfileMergeInfo ?? defaultProfileMergeInfo
    if (action.type === 'PREFILL')
      return {
        ...preFillProfileMergeInfo,
        idPairsToMerge: getProfilePairsToMerge(preFillProfileMergeInfo.idsToMerge),
      }
    if (action.type === 'idsToMerge') {
      const idPairsToMerge = getProfilePairsToMerge(state.idsToMerge)
      return { ...state, idsToMerge: action.payload, idPairsToMerge }
    }
    return { ...state, [action.type]: action.payload }
  }

  const isProfileMergeInfoComplete = () =>
    (user?.profile?.preferredId || isValidEmail(profileMergeInfo.email)) &&
    profileMergeInfo.comment?.trim()?.length &&
    profileMergeInfo.idPairsToMerge?.length

  const postProfileMergeRequest = async () => {
    setIsLoading(true)
    try {
      const result = await api.get(
        '/invitations',
        { id: profileMergeInvitationId },
        { accessToken }
      )
      const profileMergeInvitation = result.invitations[0]
      await Promise.all(
        profileMergeInfo.idPairsToMerge.map((idPairToMerge) =>
          api.post(
            '/notes',
            {
              invitation: profileMergeInvitation.id,
              content: {
                email: profileMergeInfo.email,
                left: idPairToMerge.left,
                right: idPairToMerge.right,
                comment: profileMergeInfo.comment,
                status: 'Pending',
              },
              readers: buildArray(
                profileMergeInvitation,
                'readers',
                user?.profile?.preferredId
              ),
              writers: buildArray(
                profileMergeInvitation,
                'writers',
                user?.profile?.preferredId
              ),
              signatures: [user?.profile?.preferredId ?? '(guest)'],
            },
            { accessToken }
          )
        )
      )

      $('#profilemerge-modal').modal('hide')
      promptMessage('Your request has been submitted')
    } catch (apiError) {
      setError(apiError.message)
    }
    setIsLoading(false)
  }

  return (
    <BasicModal
      id="profilemerge-modal"
      title="Reques profile merge"
      primaryButtonText="Submit"
      onPrimaryButtonClick={postProfileMergeRequest}
      primaryButtonDisabled={isLoading || !isProfileMergeInfoComplete()}
      onClose={() => {
        setProfileMergeInfo({ type: 'INIT' })
        setError(null)
      }}
    >
      {error && <div className="alert alert-danger">{error}</div>}
      <div className="form-group">
        {!preFillProfileMergeInfo && (
          <>
            <p>Fill in the following info to request profile merge</p>
            <label htmlFor="name">Your email</label>
            <input
              type="email"
              name="subject"
              className="form-control"
              value={profileMergeInfo.email}
              required
              onChange={(e) => setProfileMergeInfo({ type: 'email', payload: e.target.value })}
            />
          </>
        )}

        <label htmlFor="idsToMerge">
          {preFillProfileMergeInfo
            ? 'Profile ids to merge'
            : 'Profile ids or emails to merge,separated by comma'}
        </label>
        <input
          type="text"
          name="idsToMerge"
          className="form-control"
          value={profileMergeInfo.idsToMerge}
          required
          readOnly={preFillProfileMergeInfo}
          onChange={(e) =>
            setProfileMergeInfo({ type: 'idsToMerge', payload: e.target.value })
          }
        />
        <label htmlFor="comment">Comment</label>
        <textarea
          name="comment"
          className="form-control message-body"
          rows="6"
          value={profileMergeInfo.comment}
          required
          onChange={(e) => setProfileMergeInfo({ type: 'comment', payload: e.target.value })}
        />
      </div>
    </BasicModal>
  )
}

export default ProfileMergeModal
