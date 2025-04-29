import Notification from 'rc-notification'
import { useEffect, useState } from 'react'
import Icon from '../components/Icon'
import Markdown from '../components/EditorComponents/Markdown'
import useBreakpoint from './useBreakPoint'

export default function usePrompt() {
  const [notificationInstance, setNotificationInstance] = useState(null)
  const isMobile = !useBreakpoint('md')
  const canClose = !isMobile
  const messageDuration = isMobile ? 2 : 3
  const errorDuration = isMobile ? 2 : 4

  useEffect(() => {
    Notification.newInstance(
      {
        maxCount: 2,
        ...(canClose && {
          closeIcon: <Icon name="remove" />,
        }),
        animation: null,
      },
      (notification) => {
        setNotificationInstance(notification)
      }
    )
  }, [])
  return {
    promptMessage: (message, customDuration) =>
      notificationInstance?.notice({
        content: (
          <div className="message">
            <Markdown text={message} />
          </div>
        ),
        duration: customDuration ?? messageDuration,
        closable: canClose,
        pauseOnHover: true,
      }),
    promptError: (message, customDuration) =>
      notificationInstance?.notice({
        content: (
          <div className="error">
            <Markdown text={`**Error:** ${message}`} />
          </div>
        ),
        duration: customDuration ?? errorDuration,
        closable: canClose,
        pauseOnHover: true,
      }),

    promptLogin: (customDuration) =>
      notificationInstance?.notice({
        content: (
          <div className="login">
            <span>Please&nbsp;</span>
            <a
              href={`/login?redirect=${encodeURIComponent(
                `${window.location.pathname}${window.location.search}${window.location.hash}`
              )}`}
            >
              Login
            </a>
            <span> to proceed</span>
          </div>
        ),
        duration: customDuration ?? errorDuration,
        closable: canClose,
        pauseOnHover: true,
      }),
    clearMessage: () => {
      notificationInstance?.destroy()
      // new instance after destroy otherwise calling destroy again will fail
      Notification.newInstance(
        {
          maxCount: 2,
          ...(canClose && {
            closeIcon: <Icon name="remove" />,
          }),
          animation: null,
        },
        (notification) => {
          setNotificationInstance(notification)
        }
      )
    },
  }
}
