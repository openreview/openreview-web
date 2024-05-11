/* globals promptError: false */
/* globals promptMessage: false */

import { useContext, useEffect } from 'react'
import { useRouter } from 'next/router'
import WebFieldContext from '../WebFieldContext'
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
    uploadInvitationId,
    apiVersion,
  } = useContext(WebFieldContext)
  const router = useRouter()

  const { setBannerContent } = appContext

  const defaultDescription = `Listed below are keyphrases representing your expertise and the potential paper assignments you will receive. Your expertise keyphrases are inferred from all the papers you have authored that exist in the OpenReview database. 

Use the keyphrases below to explore the potential assignments you will receive and save the profile that leads to your preferred reviewing assignments. The saved profile will be used to make actual paper assignments for the conference. Your previously authored papers from selected conferences were automatically imported from DBLP.org.

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

      <div id="notes">
        <ExpertiseSelector />
      </div>
    </>
  )
}
