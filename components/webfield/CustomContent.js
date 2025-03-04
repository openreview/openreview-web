import { useContext, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import WebFieldContext from '../WebFieldContext'

export default function CustomContent({ appContext }) {
  const {
    entity: group,
    parentGroupId,
    header,
    HeaderComponent,
    content,
    BodyComponent,
  } = useContext(WebFieldContext)
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
      {HeaderComponent && <DynamicHeaderComponent headerInfo={header} />}
      <div id="notes">
        {DynamicBodyComponent && <DynamicBodyComponent content={content} />}
      </div>
    </>
  )
}
