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
          closeIcon: (
            <button className="btn btn-xs" type="button">
              close
            </button>
          ),
        }),
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
        duration: messageDuration,
        closable: canClose,
      }),
    promptError: (message) =>
      notificationInstance?.notice({
        content: (
          <div className="error">
            <Markdown text={`**Error:** ${message}`} />
          </div>
        ),
        duration: errorDuration,
        closable: canClose,
      }),

    promptLogin: () =>
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
            <span>&nbsp;to proceed</span>
          </div>
        ),
        duration: errorDuration,
        closable: canClose,
      }),
    clearMessage: () => {
      notificationInstance?.destroy()
      // new instance after destroy otherwise calling destroy again will fail
      Notification.newInstance(
        {
          maxCount: 2,
          ...(canClose && {
            closeIcon: (
              <button className="btn btn-xs" type="button">
                close
              </button>
            ),
          }),
        },
        (notification) => {
          setNotificationInstance(notification)
        }
      )
    },
  }
}
