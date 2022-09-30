import { useContext, useEffect } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import WebFieldContext from '../WebFieldContext'
import { referrerLink, venueHomepageLink } from '../../lib/banner-links'

export default function GroupDirectory({ appContext }) {
  const {
    entity: group,
    title,
    subtitle,
    parentGroupId,
    links,
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
      <div className="venue-header" id="header">
        <h1>{title}</h1>
        <h3>{subtitle}</h3>
      </div>

      <hr />

      <ul className="list-unstyled venues-list">
        {links.map(link => (
          <li key={link.url}>
            <Link href={link.url}>
              <a>{link.name}</a>
            </Link>
          </li>
        ))}
      </ul>
    </>
  )
}
