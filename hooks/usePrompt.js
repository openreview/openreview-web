import { useNotification } from 'rc-notification'
import Icon from '../components/Icon'
import Markdown from '../components/EditorComponents/Markdown'
import useBreakpoint from './useBreakPoint'

export default function usePrompt() {
  const isMobile = !useBreakpoint('md')
  const canClose = !isMobile
  const messageDuration = isMobile ? 2 : 3
  const errorDuration = isMobile ? 2 : 4

  const [api, holder] = useNotification({
    maxCount: 2,
    ...(canClose && {
      closeIcon: <Icon name="remove" />,
    }),
    animation: null,
  })

  return {
    notificationHolder: holder,
    promptFunctions: {
      promptMessage: (message, customDuration) =>
        api.open({
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
        api.open({
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
        api.open({
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
        api.destroy()
      },
    },
  }
}
