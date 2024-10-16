import Notification from 'rc-notification'
import { useEffect, useState } from 'react'
import Icon from '../components/Icon'
import Markdown from '../components/EditorComponents/Markdown'
import useBreakpoint from './useBreakPoint'

export default function usePrompt() {
  const [notificationInstance, setNotificationInstance] = useState(null)
  const isMobile = !useBreakpoint('md')
  const canClose = !isMobile

  useEffect(() => {
    Notification.newInstance(
      {
        maxCount: 2,
        ...(canClose && { closeIcon: <Icon name="remove" /> }),
      },
      (notification) => {
        setNotificationInstance(notification)
      }
    )
  }, [])
  return {
    promptOk: (message) =>
      notificationInstance?.notice({
        content: (
          <>
            <Icon name="ok-sign" />
            <Markdown text={message} />
          </>
        ),
        duration: 2,
      }),
    promptMessage: (message) =>
      notificationInstance?.notice({
        content: (
          <>
            <Icon name="info-sign" />
            <Markdown text={message} />
          </>
        ),
        duration: 2,
        closable: canClose,
      }),
    promptError: (message) =>
      notificationInstance?.notice({
        content: (
          <>
            <Icon name="remove-sign" />
            <Markdown text={message} />
          </>
        ),
        duration: 4000,
        closable: canClose,
      }),
    clearMessage: () => {
      notificationInstance?.destroy()
      // new instance after destroy otherwise calling destroy again will fail
      Notification.newInstance(
        {
          maxCount: 2,
          ...(canClose && { closeIcon: <Icon name="remove" /> }),
        },
        (notification) => {
          setNotificationInstance(notification)
        }
      )
    },
    promptLogin: () =>
      notificationInstance?.notice({
        content: (
          <>
            <Icon name="remove-sign" />
            <span>Please&nbsp;</span>
            <a
              href={`/login?redirect=${encodeURIComponent(
                `${window.location.pathname}${window.location.search}${window.location.hash}`
              )}`}
            >
              Login
            </a>
            <span>&nbsp;to proceed</span>
          </>
        ),
        duration: 4,
        closable: canClose,
      }),
  }
}
