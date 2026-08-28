import { Button, Flex, Modal, Typography } from 'antd'
import { useEffect, useState, useSyncExternalStore } from 'react'
import useTurnstileToken from '../hooks/useTurnstileToken'
import {
  shouldShowHumanVerificationModal,
  subscribeShouldShowHumanVerificationModal,
  updateHumanVerificationTurnstileToken,
} from '../lib/human-verification-service'

const HumanVerificationModal = () => {
  const showHumanVerificationModal = useSyncExternalStore(
    subscribeShouldShowHumanVerificationModal,
    shouldShowHumanVerificationModal,
    () => false
  )
  const [showCancelButton, setShowCancelButton] = useState(false)
  const { turnstileToken, turnstileContainerRef } = useTurnstileToken(
    'globalHumanVerification',
    showHumanVerificationModal
  )

  useEffect(() => {
    if (turnstileToken) updateHumanVerificationTurnstileToken(turnstileToken)
  }, [turnstileToken])

  useEffect(() => {
    if (!showHumanVerificationModal) {
      setShowCancelButton(false)
      return undefined
    }
    const timer = setTimeout(() => setShowCancelButton(true), 5000)
    return () => clearTimeout(timer)
  }, [showHumanVerificationModal])

  const cancelVerification = () => updateHumanVerificationTurnstileToken()

  return (
    <Modal
      centered
      open={showHumanVerificationModal}
      closable={false}
      keyboard={false}
      zIndex={1080}
      mousePosition={{ x: 0, y: 0 }}
      title="Verification required"
      footer={showCancelButton && <Button onClick={cancelVerification}>Cancel</Button>}
    >
      <Flex vertical gap="large">
        <Typography.Text>
          <div>Before your change can be saved, please confirm you are not a robot.</div>It
          will be submitted automatically once verified.
        </Typography.Text>
        {/* The turnstile iframe is a fixed 300px wide. Auto margins center it while it
            fits and collapse to zero when a narrow viewport would otherwise crop it —
            the row then scrolls instead. (antd Flex can't express this: its justify
            prop only accepts preset values, not "safe center".) */}
        <div style={{ overflowX: 'auto' }}>
          <div ref={turnstileContainerRef} style={{ width: 'fit-content', margin: '0 auto' }} />
        </div>
        {showCancelButton && (
          <Flex justify="center">
            <Typography.Text type="secondary">
              If you cancel, your change will not be saved.
            </Typography.Text>
          </Flex>
        )}
      </Flex>
    </Modal>
  )
}

export default HumanVerificationModal
