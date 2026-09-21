'use client'

import dynamic from 'next/dynamic'
import { use, useEffect, useRef, useState } from 'react'
import { useDispatch } from 'react-redux'
import { setBannerContent } from '../../bannerSlice'
import ExternalLinkNotice from '../../components/ExternalLinkNotice'
import LoadingSpinner from '../../components/LoadingSpinner'
import WebFieldContext from '../../components/WebFieldContext'

export default function ComponentInvitation({ componentObjP }) {
  const componentObj = use(componentObjP)
  const [WebComponent, setWebComponent] = useState(null)
  const [webComponentProps, setWebComponentProps] = useState({})
  const dispatch = useDispatch()
  const containerRef = useRef(null)

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
