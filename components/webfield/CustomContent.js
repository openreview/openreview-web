import { useContext, useEffect } from 'react'
import { useRouter } from 'next/router'
import WebFieldContext from '../WebFieldContext'
import { referrerLink, venueHomepageLink } from '../../lib/banner-links'

export default function CustomContent({ appContext }) {
  const {
    entity: group,
    parentGroupId,
    header,
    HeaderComponent,
    content,
    BodyComponent
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
    <>
      <HeaderComponent headerInfo={header} />

      <div id="notes">
        <BodyComponent content={content} />
      </div>
    </>
  )
}
