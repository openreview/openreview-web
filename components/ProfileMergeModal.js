/* globals $,promptMessage,view2: false */

import { useState, useReducer, useEffect } from 'react'
import BasicModal from './BasicModal'
import api from '../lib/api-client'
import { buildArray, isValidEmail } from '../lib/utils'
import useUser from '../hooks/useUser'

const ProfileMergeModal = ({ preFillProfileMergeInfo }) => {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const { accessToken, user } = useUser()
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
    const ids = [
      ...new Set(
        profileIds.split(',').map((p) => {
          const cleanId = p.trim()
          const isEmail = isValidEmail(cleanId)
          if (isEmail) {
            return cleanId.toLowerCase()
          }
          return cleanId.startsWith('~') ? cleanId : `~${cleanId}`
        })
      ),
    ]
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
      const idPairsToMerge = getProfilePairsToMerge(action.payload)
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
      const profileMergeInvitation = await api.getInvitationById(
        profileMergeInvitationId,
        accessToken
      )
      await Promise.all(
        profileMergeInfo.idPairsToMerge.map((idPairToMerge) => {
          const editToPost = view2.constructEdit({
            formData: {
              email: profileMergeInfo.email,
              left: idPairToMerge.left,
              right: idPairToMerge.right,
              comment: profileMergeInfo.comment,
              status: 'Pending',
              editSignatureInputValues: [user?.profile?.preferredId ?? '(guest)'],
            },
            invitationObj: profileMergeInvitation,
          })
          return api.post('/notes/edits', editToPost, { accessToken, version: 2 })
        })
      )

      $('#profile-merge-modal').modal('hide')
      promptMessage('Your request has been submitted')
    } catch (apiError) {
      setError(apiError.message)
    }
    setIsLoading(false)
  }

  return (
    <BasicModal
      id="profile-merge-modal"
      title="Request Profile Merge"
      primaryButtonText="Submit"
      onPrimaryButtonClick={postProfileMergeRequest}
      primaryButtonDisabled={isLoading || !isProfileMergeInfoComplete()}
      onClose={() => {
        setProfileMergeInfo({ type: 'INIT' })
        setError(null)
      }}
    >
      {error && <div className="alert alert-danger">{error}</div>}
      <form onSubmit={(e) => e.preventDefault()}>
        {!preFillProfileMergeInfo && (
          <div className="form-group">
            <p>Please fill in the following information to request a profile merge.</p>
            <label htmlFor="email">Your email</label>
            <input
              id="email"
              type="email"
              className="form-control"
              value={profileMergeInfo.email}
              required
              onChange={(e) => setProfileMergeInfo({ type: 'email', payload: e.target.value })}
            />
          </div>
        )}

        <div className="form-group">
          <label htmlFor="idsToMerge">
            {preFillProfileMergeInfo
              ? 'Profile IDs to merge'
              : 'Profile IDs or emails to merge, separated by commas'}
          </label>
          <input
            id="idsToMerge"
            type="text"
            className="form-control"
            value={profileMergeInfo.idsToMerge}
            required
            readOnly={preFillProfileMergeInfo}
            onChange={(e) =>
              setProfileMergeInfo({ type: 'idsToMerge', payload: e.target.value })
            }
          />
        </div>
        <div className="form-group">
          <label htmlFor="comment">Comment</label>
          <textarea
            id="comment"
            className="form-control message-body"
            rows="6"
            value={profileMergeInfo.comment}
            required
            onChange={(e) => setProfileMergeInfo({ type: 'comment', payload: e.target.value })}
          />
        </div>
      </form>
    </BasicModal>
  )
}

export default ProfileMergeModal
