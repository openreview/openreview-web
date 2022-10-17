/* globals promptError: false */
/* globals promptMessage: false */

import { useContext, useEffect, useReducer } from 'react'
import { useRouter } from 'next/router'
import WebFieldContext from '../WebFieldContext'
import SubmissionButton from './SubmissionButton'
import Markdown from '../EditorComponents/Markdown'
import ExpertiseSelector from '../ExpertiseSelector'
import { prettyId } from '../../lib/utils'
import { referrerLink, venueHomepageLink } from '../../lib/banner-links'

export default function ExpertiseConsole({ appContext }) {
  const {
    entity: invitation,
    venueId,
    title,
    description,
    apiVersion,
  } = useContext(WebFieldContext)
  const [shouldReload, reload] = useReducer((p) => !p, true)
  const router = useRouter()

  const { setBannerContent } = appContext
  const defaultDescription = `Listed below are all the papers you have authored that are in the OpenReview database.

**By default, we consider all of these papers to formulate your expertise.
Please click "Exclude" for papers that you do NOT want to be used to represent your expertise.**

Your previously authored papers from selected conferences were imported automatically from [DBLP.org](https://dblp.org/).
The keywords in these papers will be used to rank submissions for you during the bidding process, and to assign submissions to you during the review process.
If there are DBLP papers missing, you can add them by going to your [OpenReview profile](/profile/edit) and clicking "Add DBLP Papers to Profile".

Papers not automatically included as part of this import process can be uploaded with the Direct Upload button below.
Make sure that your email is part of the "authorids" field of the upload form, otherwise the paper will not appear in the list,
though it will be included in the recommendations process. Only upload papers you are an author of.

Please contact info@openreview.net with any questions or concerns about this interface, or about the expertise scoring process.`

  useEffect(() => {
    // Set referrer banner
    if (!router.isReady) return

    if (router.query.referrer) {
      setBannerContent(referrerLink(router.query.referrer))
    } else if (venueId) {
      setBannerContent(venueHomepageLink(venueId))
    }
  }, [router.isReady, router.query])

  return (
    <>
      <header>
        <h1>{title || prettyId(invitation.id)}</h1>

        <div className="description dark">
          <Markdown text={description ?? defaultDescription} />
        </div>
      </header>

      <div id="invitation">
        <SubmissionButton
          invitationId="OpenReview.net/Archive/-/Direct_Upload"
          apiVersion={1}
          onNoteCreated={() => {
            promptMessage('Your paper has been added to the OpenReview Archive')
            reload()
          }}
          options={{ largeLabel: true }}
        />
      </div>

      <div id="notes">
        <ExpertiseSelector
          invitation={invitation}
          venueId={venueId}
          shouldReload={shouldReload}
        />
      </div>
    </>
  )
}
