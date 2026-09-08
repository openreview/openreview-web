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
          Before your change can be saved, please confirm you are not a robot.
          <br />
          It will be submitted automatically once verified.
        </Typography.Text>
        <Flex justify="center">
          <div ref={turnstileContainerRef} />
        </Flex>
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
