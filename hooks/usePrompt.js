import { Button, Flex, notification } from 'antd'
import Markdown from '../components/EditorComponents/Markdown'
import useBreakpoint from './useBreakPoint'

const okTextColor = '#3c763d'

const commonStyles = {
  icon: { display: 'none' },
  title: { display: 'none' },
  description: {
    fontSize: '0.9375rem',
    lineHeight: '21px',
    marginTop: 0,
    marginInlineStart: 0,
  },
}

const getStyles = (type) => {
  switch (type) {
    case 'success':
    case 'login':
    case 'refresh':
      return {
        ...commonStyles,
        description: { ...commonStyles.description, color: okTextColor },
      }
    case 'error':
      return {
        ...commonStyles,
        description: { ...commonStyles.description, color: '#a94442' },
      }
    default:
      return {}
  }
}

export default function usePrompt() {
  const isMobile = !useBreakpoint('md')
  const canClose = !isMobile
  const messageDuration = isMobile ? 2 : 3
  const errorDuration = isMobile ? 2 : 4

  const [api, contextHolder] = notification.useNotification({
    maxCount: 2,
    placement: 'top',
    top: 91,
  })

  const commonProps = {
    message: null,
    pauseOnHover: true,
    closable: canClose,
  }

  return {
    notificationHolder: contextHolder,
    promptFunctions: {
      promptMessage: (message, customDuration) =>
        api.success({
          ...commonProps,
          styles: getStyles('success'),
          description: <Markdown text={message?.toString()} />,
          duration: customDuration ?? messageDuration,
        }),
      promptError: (message, customDuration) =>
        api.error({
          ...commonProps,
          styles: getStyles('error'),
          description: <Markdown text={`**Error:** ${message?.toString()}`} />,
          duration: customDuration ?? errorDuration,
        }),
      promptLogin: (customDuration) =>
        api.info({
          ...commonProps,
          styles: getStyles('login'),
          description: (
            <>
              <span>Please&nbsp;</span>
              <a
                href={`/login?redirect=${encodeURIComponent(
                  `${window.location.pathname}${window.location.search}${window.location.hash}`
                )}`}
              >
                Login
              </a>
              <span> to proceed</span>
            </>
          ),
          duration: customDuration ?? errorDuration,
        }),
      promptRefresh: (message, customDuration) =>
        api.info({
          ...commonProps,
          styles: getStyles('refresh'),
          description: (
            <Flex align="center" gap={8}>
              <div style={{ overflow: 'hidden', height: '21px' }}>
                <Markdown text={message?.toString()} />
              </div>
              <Button type="primary" size="small" onClick={() => window.location.reload()}>
                Refresh
              </Button>
            </Flex>
          ),
          duration: customDuration ?? messageDuration,
        }),
      clearMessage: () => {
        api.destroy()
      },
    },
  }
}
