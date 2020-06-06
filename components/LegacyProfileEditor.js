/* globals $: false */
/* globals promptMessage: false */
/* globals promptError: false */
/* globals Webfield: false */

import {
  useEffect, useState, useRef, useContext,
} from 'react'
import { useRouter } from 'next/router'
import get from 'lodash/get'
import omit from 'lodash/omit'
import UserContext from './UserContext'
import api from '../lib/api-client'
import editController from '../client/profileView'

import '../styles/components/legacy-profile-editor.less'

export default function LegacyProfileEditor({
  profile, loading, hideDblpButton = false, hidePublicationEditor = false,
}) {
  const containerEl = useRef(null)
  const [dropdownOptions, setDropdownOptions] = useState(null)
  const { accessToken } = useContext(UserContext)
  const router = useRouter()

  const loadOptions = async () => {
    try {
      const optionsRes = await api.get('/profiles/options')
      setDropdownOptions(optionsRes)
    } catch (error) {
      setDropdownOptions({})
    }
  }

  const unlinkPublication = async (profileId, noteId) => {
    const notes = await api.get('/notes', { id: noteId }, { accessToken })
    const authorIds = get(notes, 'notes[0].content.authorids')
    if (!authorIds) {
      return Promise.reject()
    }
    const idx = authorIds.indexOf(profileId)
    if (idx < 0) {
      Promise.reject()
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

    const { view, renderPublicationEditor } = editController(profile, {
      buttonText: 'Save Profile Changes',
      prefixedPositions: dropdownOptions.prefixedPositions || [],
      prefixedRelations: dropdownOptions.prefixedRelations || [],
      institutions: dropdownOptions.institutions || [],
      hideDblpButton,
      hidePublicationEditor,
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
        await Promise.all(publicationIdsToUnlink.map(publicationId => unlinkPublication(profile.id, publicationId)))
        promptMessage('Your profile information has been successfully updated')
        router.push(`/profile?id=${profile.id}`)
      } catch (error) {
        promptError(error.message)
      }
      done()
    }, () => {
      // Cancel handler
      router.push(`/profile?id=${profile.id}`)
    })
    $(containerEl.current).empty().append(view)

    if (!hideDblpButton && !hidePublicationEditor) {
      $('#dblp-import-modal').on('hidden.bs.modal', () => {
        renderPublicationEditor()
      })
    }
  }, [loading, profile, dropdownOptions])

  return <div ref={containerEl} />
}
