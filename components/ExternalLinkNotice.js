import { Modal, Typography } from 'antd'
import { useEffect, useState } from 'react'

export function getExternalUrl(href) {
  let url
  try {
    url = new URL(href, window.location.href)
  } catch {
    return null
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return null

  return url.hostname === window.location.hostname ? null : url
}

export default function ExternalLinkNotice({ containerRef }) {
  const [externalLink, setExternalLink] = useState(null)

  useEffect(() => {
    const container = containerRef?.current
    if (!container) return undefined

    const interceptClick = (event) => {
      if (event.defaultPrevented || event.button !== 0) return
      const anchor = event.target.closest?.('a[href]')
      if (!anchor || !container.contains(anchor)) return
      const url = getExternalUrl(anchor.getAttribute('href'))
      if (!url) return

      event.preventDefault()
      event.stopPropagation()
      setExternalLink(url.href)
    }

    container.addEventListener('click', interceptClick, true)
    return () => container.removeEventListener('click', interceptClick, true)
  }, [containerRef])

  const continueToLink = () => {
    window.open(externalLink, '_blank', 'noopener,noreferrer')
    setExternalLink(null)
  }

  return (
    <Modal
      centered
      open={!!externalLink}
      zIndex={1080}
      mousePosition={{ x: 0, y: 0 }}
      title="You're leaving OpenReview"
      closable={false}
      styles={{
        container: { padding: '2.5rem' },
        header: { marginBottom: '2.5rem' },
        title: { textAlign: 'center' },
        footer: { marginTop: '2.5rem' },
      }}
      okText="Continue"
      cancelText="Cancel"
      onOk={continueToLink}
      onCancel={() => setExternalLink(null)}
    >
      <Typography.Paragraph>
        This link was posted by a user and takes you to a site OpenReview doesn&apos;t control:
      </Typography.Paragraph>
      <Typography.Paragraph style={{ overflowWrap: 'anywhere' }}>
        {externalLink}
      </Typography.Paragraph>
      <Typography.Paragraph>
        OpenReview doesn&apos;t review, endorse, or take responsibility for content on external
        sites. Check the address above before continuing.
      </Typography.Paragraph>
    </Modal>
  )
}
