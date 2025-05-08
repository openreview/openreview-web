import { useContext, useEffect } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import WebFieldContext from '../WebFieldContext'
import VenueHeader from './VenueHeader'
import MarkdownContent from './MarkdownContent'
import { referrerLink, venueHomepageLink } from '../../lib/banner-links'
import { prettyId } from '../../lib/utils'

export default function ArchivedConsole({ appContext }) {
  const {
    entity: group,
    venueId,
    parentGroupId,
    header,
    message,
  } = useContext(WebFieldContext)
  const router = useRouter()
  const { setBannerContent } = appContext

  useEffect(() => {
    // Set referrer banner
    if (!router.isReady) return

    if (router.query.referrer) {
      setBannerContent(referrerLink(router.query.referrer))
    } else if (parentGroupId) {
      setBannerContent(venueHomepageLink(parentGroupId))
    }
  }, [router.isReady, router.query])

  return (
    <div className="text-center row">
      <div className="col-lg-8 col-lg-offset-2">
        <VenueHeader headerInfo={{ ...header, instructions: ' ' }} />

        <hr className="small" />

        <div id="notes">
          <h4 className="mt-4">This {prettyId(group.id, true)} Console has been archived.</h4>{' '}
          <p>
            To request access, please <Link href={`/contact`}>contact us</Link>.
          </p>
          <p>
            Return to the{' '}
            <Link href={`/group?id=${venueId}`}>{prettyId(venueId)} homepage</Link>.
          </p>
          {message && <MarkdownContent content={message} />}
        </div>
      </div>
    </div>
  )
}
