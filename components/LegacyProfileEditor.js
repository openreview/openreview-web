/* globals $: false */
/* globals promptMessage: false */
/* globals promptError: false */
/* globals Webfield: false */

import { useEffect, useState, useRef, useContext } from 'react'
import { useRouter } from 'next/router'
import get from 'lodash/get'
import omit from 'lodash/omit'
import api from '../lib/api-client'
import DblpImportModal from './DblpImportModal'
import UserContext from './UserContext'
import editController from '../client/profileView'

import '../styles/legacy-profile-editor.less'

export default function LegacyProfileEditor({ profile, loading, hideAddDblpAndPublicationEditor = false }) {
  const containerEl = useRef(null)
  const [dropdownOptions, setDropdownOptions] = useState(null)
  const [profileView, setprofileView] = useState(null)
  const router = useRouter()
  const { accessToken } = useContext(UserContext)

  const loadOptions = async () => {
    try {
      const optionsRes = await api.get('/profiles/options')
      setDropdownOptions(optionsRes)
    } catch (error) {
      setDropdownOptions({})
    }
  }

  const showDblpModal = () => {
    $('#dblp-import-modal').modal({ backdrop: 'static' })
  }

  const unlinkPublication = async (profileId, noteId) => {
    const notes = await api.get('/notes', { id: noteId }, { accessToken })
    const authorIds = get(notes, 'notes[0].content.authorids')
    if (!authorIds) {
      return $.Deferred().reject()
    }
    const idx = authorIds.indexOf(profileId)
    if (idx < 0) {
      $.Deferred().reject()
    }
    authorIds[idx] = null

    const updateAuthorIdsObject = {
      id: null,
      referent: noteId,
      invitation: 'dblp.org/-/author_coreference',
      signatures: [profileId],
      readers: ['everyone'],
      writers: [],
      content: {
        authorids: authorIds,
      },
    }
    return api.post('/notes', updateAuthorIdsObject, { accessToken })
  }

  useEffect(() => {
    loadOptions()
  }, [])

  useEffect(() => {
    if (loading || !profile || !dropdownOptions) return

    const profileViewResult = editController(profile, {
      buttonText: 'Save Profile Changes',
      prefixedPositions: dropdownOptions.prefixedPositions || [],
      prefixedRelations: dropdownOptions.prefixedRelations || [],
      institutions: dropdownOptions.institutions || [],
      onDblpButtonClick: showDblpModal,
      hideAddDblpAndPublicationEditor,
    }, async (newProfileData, done) => {
      // Save profile handler
      const { publicationIdsToUnlink } = newProfileData.content
      const dataToSubmit = {
        id: newProfileData.id,
        content: omit(newProfileData.content, [
          'preferredName', 'currentInstitution', 'options', 'publicationIdsToUnlink',
        ]),
      }
      try {
        const updatedProfile = await api.post('/profiles', dataToSubmit, { accessToken })
        await Promise.all(publicationIdsToUnlink.map(publicationId => (unlinkPublication(profile.id, publicationId))))
        promptMessage('Your Profile information has successfully been updated')
        router.push(`/profile?id=${profile.id}`)
      } catch (error) {
        promptError(error.message)
      }
    }, () => {
      // Cancel handler
      router.push(`/profile?id=${profile.id}`)
    })
    setprofileView(profileViewResult)
    $(containerEl.current).empty().append(profileViewResult.profileController.view)
  }, [loading, profile, dropdownOptions])

  return (
    <>
      <div ref={containerEl} />
      <DblpImportModal
        profileId={profile.id}
        profileNames={profile.names.map(name => (name.middle
          ? `${name.first} ${name.middle} ${name.last}`
          : `${name.first} ${name.last}`))}
        renderPublicationEditor={() => profileView.renderPublicationEditor(profile.id)}
      />
    </>
  )
}
