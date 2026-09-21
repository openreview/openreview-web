'use client'

import dynamic from 'next/dynamic'
import { useEffect, useRef, useState } from 'react'
import { useDispatch } from 'react-redux'
import { setBannerContent } from '../../bannerSlice'
import ExternalLinkNotice from '../../components/ExternalLinkNotice'
import LoadingSpinner from '../../components/LoadingSpinner'
import WebFieldContext from '../../components/WebFieldContext'
import CommonLayout from '../CommonLayout'

import styles from './Group.module.scss'

export default function ComponentGroup({ componentObj, editBanner }) {
  const [WebComponent, setWebComponent] = useState(null)
  const [webComponentProps, setWebComponentProps] = useState({})
  const isFullWidth =
    ['ProgramChairConsole', 'SeniorAreaChairConsole'].includes(componentObj?.component) &&
    webComponentProps.displayReplyInvitations?.length
  const dispatch = useDispatch()
  const containerRef = useRef(null)

  useEffect(() => {
    if (!componentObj) return

    setWebComponent(() =>
      dynamic(() =>
        import(`../../components/webfield/${componentObj.component}`, {
          ssr: false,
          loading: () => <LoadingSpinner />,
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

  if (!(WebComponent && webComponentProps)) return <LoadingSpinner />
  return (
    <CommonLayout
      banner={null}
      editBanner={editBanner}
      fullWidth={isFullWidth}
      minimalFooter={isFullWidth}
    >
      <div className={styles.group}>
        <WebFieldContext.Provider value={webComponentProps}>
          <div id="group-container" ref={containerRef}>
            <WebComponent
              appContext={{ setBannerContent: (e) => dispatch(setBannerContent(e)) }}
            />
          </div>
          <ExternalLinkNotice containerRef={containerRef} />
        </WebFieldContext.Provider>
      </div>
    </CommonLayout>
  )
}
