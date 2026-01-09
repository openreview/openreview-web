import { useContext, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import WebFieldContext from '../WebFieldContext'

export default function CustomContent({ appContext }) {
  const { entity, parentGroupId, header, HeaderComponent, content, BodyComponent } =
    useContext(WebFieldContext)
  const query = useSearchParams()
  const { setBannerContent } = appContext ?? {}

  useEffect(() => {
    // Set referrer banner
    if (query.get('referrer')) {
      setBannerContent({ type: 'referrerLink', value: query.get('referrer') })
    } else if (parentGroupId) {
      setBannerContent({ type: 'venueHomepageLink', value: parentGroupId })
    }
  }, [query])

  const DynamicHeaderComponent = HeaderComponent?.()
  const DynamicBodyComponent = BodyComponent?.()

  return (
    <>
      {/* eslint-disable-next-line react-hooks/static-components */}
      {HeaderComponent && <DynamicHeaderComponent headerInfo={header} />}
      {/* eslint-disable-next-line react-hooks/static-components */}
      <div id="notes">{BodyComponent && <DynamicBodyComponent content={content} />}</div>
    </>
  )
}
