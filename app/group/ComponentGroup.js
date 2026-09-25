'use client'

import dynamic from 'next/dynamic'
import { useEffect, useRef, useState } from 'react'
import { useDispatch } from 'react-redux'
import { setBannerContent } from '../../bannerSlice'
import ErrorDisplay from '../../components/ErrorDisplay'
import ExternalLinkNotice from '../../components/ExternalLinkNotice'
import LoadingSpinner from '../../components/LoadingSpinner'
import WebFieldContext from '../../components/WebFieldContext'
import { parseComponentCode } from '../../lib/webfield-utils'
import CommonLayout from '../CommonLayout'

import styles from './Group.module.scss'

export default function ComponentGroup({ group, domainGroup, user, query, editBanner }) {
  const [componentObj, setComponentObj] = useState(null)
  const [error, setError] = useState(null)
  const [WebComponent, setWebComponent] = useState(null)
  const [webComponentProps, setWebComponentProps] = useState({})
  const isFullWidth =
    ['ProgramChairConsole', 'SeniorAreaChairConsole'].includes(componentObj?.component) &&
    webComponentProps.displayReplyInvitations?.length
  const dispatch = useDispatch()
  const containerRef = useRef(null)

  useEffect(() => {
    let ignore = false
    parseComponentCode(group, domainGroup, user, query)
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
  }, [group, domainGroup, user, query])

  useEffect(() => {
    if (!componentObj) return

    setWebComponent(() =>
      dynamic(
        () =>
          import(`../../components/webfield/${componentObj.component}`).catch((e) => {
            promptError(`Error loading ${componentObj.component}: ${e.message}`)
          }),
        {
          ssr: false,
          loading: () => <LoadingSpinner />,
        }
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

  if (error) return <ErrorDisplay message={error} />
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
