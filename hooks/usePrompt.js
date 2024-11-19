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
    promptMessage: (message) =>
      notificationInstance?.notice({
        content: (
          <div className="message">
            <Markdown text={message} />
          </div>
        ),
        duration: 3,
        closable: canClose,
      }),
    promptError: (message) =>
      notificationInstance?.notice({
        content: (
          <div className="error">
            <Markdown text={`**Error:** ${message}`} />
          </div>
        ),
        duration: 4,
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
