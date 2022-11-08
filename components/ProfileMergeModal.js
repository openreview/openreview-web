/* globals $: false */

import { useState, useContext, useReducer, useEffect } from 'react'
import BasicModal from './BasicModal'
import UserContext from './UserContext'
import api from '../lib/api-client'
import { buildArray } from '../lib/utils'

const ProfileMergeModal = ({ preFillProfileMergeInfo }) => {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const { accessToken, user } = useContext(UserContext)
  const profileMergeInvitationId = `${process.env.SUPER_USER}/Support/-/Profile_Merge`
  const defaultProfileMergeInfo = {
    email: '',
    left: '',
    right: '',
    comment: '',
  }
  const [profileMergeInfo, setProfileMergeInfo] = useReducer(
    profileMergeInfoReducer,
    preFillProfileMergeInfo ?? defaultProfileMergeInfo
  )

  useEffect(() => {
    if (preFillProfileMergeInfo) setProfileMergeInfo({ type: 'PREFILL' })
  }, [preFillProfileMergeInfo])

  function profileMergeInfoReducer(state, action) {
    if (action.type === 'INIT') return preFillProfileMergeInfo ?? defaultProfileMergeInfo
    if (action.type === 'PREFILL') return preFillProfileMergeInfo
    return { ...state, [action.type]: action.payload }
  }

  const isProfileMergeInfoComplete = () => {
    return Object.values(profileMergeInfo).every((p) => p)
  }

  const postProfileMergeRequest = async () => {
    setIsLoading(true)
    try {
      const result = await api.get(
        '/invitations',
        { id: profileMergeInvitationId },
        { accessToken }
      )
      const profileMergeInvitation = result.invitations[0]
      await api.post(
        '/notes',
        {
          invitation: profileMergeInvitation.id,
          content: {
            email: profileMergeInfo.email,
            left: profileMergeInfo.left,
            right: profileMergeInfo.right,
            comment: profileMergeInfo.comment,
            status: 'Pending',
          },
          readers: buildArray(profileMergeInvitation, 'readers', user?.profile?.preferredId),
          writers: buildArray(profileMergeInvitation, 'writers', user?.profile?.preferredId),
          signatures: [user?.profile?.preferredId ?? '(guest)'],
        },
        { accessToken }
      )
      $('#profileMerge-modal').modal('hide')
      promptMessage('Your request has been submitted')
    } catch (apiError) {
      setError(apiError.message)
    }
    setIsLoading(false)
  }

  return (
    <BasicModal
      id="profileMerge-modal"
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
        <p>Fill in the following info to request profile merge</p>
        <label htmlFor="name">email</label>
        <input
          type="text"
          name="subject"
          className="form-control"
          value={profileMergeInfo.email}
          required
          onChange={(e) => setProfileMergeInfo({ type: 'email', payload: e.target.value })}
        />
        <label htmlFor="left">Profile id or email to merge from</label>
        <input
          type="text"
          name="left"
          className="form-control"
          value={profileMergeInfo.left}
          required
          onChange={(e) => setProfileMergeInfo({ type: 'left', payload: e.target.value })}
        />
        <label htmlFor="right">Profile id or email to merge to</label>
        <input
          type="text"
          name="right"
          className="form-control"
          value={profileMergeInfo.right}
          required
          onChange={(e) => setProfileMergeInfo({ type: 'right', payload: e.target.value })}
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
