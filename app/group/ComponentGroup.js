'use client'

/* globals promptError: false */
import { use, useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { useDispatch } from 'react-redux'
import WebFieldContext from '../../components/WebFieldContext'
import LoadingSpinner from '../../components/LoadingSpinner'
import { setBannerContent } from '../../bannerSlice'
import CommonLayout from '../CommonLayout'
import styles from './Group.module.scss'

export default function ComponentGroup({ componentObjP, editBanner }) {
  const componentObj = use(componentObjP)
  const [WebComponent, setWebComponent] = useState(null)
  const [webComponentProps, setWebComponentProps] = useState({})
  const isFullWidth =
    ['ProgramChairConsole', 'SeniorAreaChairConsole'].includes(componentObj?.component) &&
    webComponentProps.displayReplyInvitations?.length
  const dispatch = useDispatch()

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
            loading: () => <LoadingSpinner />,
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
          <div id="group-container">
            <WebComponent
              appContext={{ setBannerContent: (e) => dispatch(setBannerContent(e)) }}
            />
          </div>
        </WebFieldContext.Provider>
      </div>
    </CommonLayout>
  )
}
