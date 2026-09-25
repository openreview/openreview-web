'use client'

import dynamic from 'next/dynamic'
import { use, useEffect, useRef, useState } from 'react'
import { useDispatch } from 'react-redux'
import { setBannerContent } from '../../bannerSlice'
import ErrorDisplay from '../../components/ErrorDisplay'
import ExternalLinkNotice from '../../components/ExternalLinkNotice'
import LoadingSpinner from '../../components/LoadingSpinner'
import WebFieldContext from '../../components/WebFieldContext'
import { parseComponentCode } from '../../lib/webfield-utils'

export default function ComponentInvitation({ invitation, domainGroupP, user, query }) {
  const domainGroup = use(domainGroupP)
  const [componentObj, setComponentObj] = useState(null)
  const [error, setError] = useState(null)
  const [WebComponent, setWebComponent] = useState(null)
  const [webComponentProps, setWebComponentProps] = useState({})
  const dispatch = useDispatch()
  const containerRef = useRef(null)

  useEffect(() => {
    let ignore = false
    parseComponentCode(invitation, domainGroup, user, query)
      .then((result) => {
        if (ignore) return
        setError(null)
        setComponentObj(result)
      })
      .catch((e) => {
        if (!ignore) setError(e.message)
      })
    return () => {
      ignore = true
    }
  }, [invitation, domainGroup, user, query])

  useEffect(() => {
    if (!componentObj) return

    setWebComponent(() =>
      dynamic(() =>
        import(`../../components/webfield/${componentObj.component}`, {
          ssr: false,
          loading: () => <LoadingSpinner inline />,
        }).catch((e) => {
          promptError(`Error loading ${componentObj.component}: ${e.message}`)
        })
      )
    )

    const componentProps = {}
    Object.keys(componentObj.properties).forEach((propName) => {
      const prop = componentObj.properties[propName]
      if (prop?.component) {
        componentProps[propName] = () =>
          dynamic(() => import(`../../components/webfield/${prop.component}`), {
            ssr: false,
            loading: () => <LoadingSpinner inline />,
          })
      } else {
        componentProps[propName] = prop
      }
    })

    setWebComponentProps(componentProps)
  }, [componentObj])

  if (error) return <ErrorDisplay message={error} withLayout={false} />
  return (
    <WebFieldContext.Provider value={webComponentProps}>
      <div id="invitation-container" ref={containerRef}>
        {WebComponent && webComponentProps ? (
          <WebComponent
            appContext={{ setBannerContent: (e) => dispatch(setBannerContent(e)) }}
          />
        ) : (
          <LoadingSpinner />
        )}
      </div>
      <ExternalLinkNotice containerRef={containerRef} />
    </WebFieldContext.Provider>
  )
}
