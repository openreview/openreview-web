'use client'

/* globals promptError: false */
import { use, useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { useDispatch } from 'react-redux'
import WebFieldContext from '../../components/WebFieldContext'
import LoadingSpinner from '../../components/LoadingSpinner'
import { setBannerContent } from '../../bannerSlice'

export default function ComponentInvitation({ componentObjP }) {
  const componentObj = use(componentObjP)
  const [WebComponent, setWebComponent] = useState(null)
  const [webComponentProps, setWebComponentProps] = useState({})
  const dispatch = useDispatch()

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
      <div id="invitation-container">
        {WebComponent && webComponentProps ? (
          <WebComponent
            appContext={{ setBannerContent: (e) => dispatch(setBannerContent(e)) }}
          />
        ) : (
          <LoadingSpinner />
        )}
      </div>
    </WebFieldContext.Provider>
  )
}
