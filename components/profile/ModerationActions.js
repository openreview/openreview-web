import { Button, Flex, Input, Select, Space } from 'antd'
import { useMemo, useState } from 'react'
import { getRejectionReasons } from '../../lib/utils'

const invalidInfoWarning =
  "Submitting invalid info is a violation of OpenReview's Terms and Conditions (https://openreview.net/legal/terms) which may result in terminating your access to the system."
const lastNoticeWarning = 'If invalid info is submitted again, your email will be blocked.'

const ModerationActions = ({
  profile,
  profileStateInvitation,
  onAccept,
  onReject,
  onSkip,
}) => {
  const [rejectionMessage, setRejectionMessage] = useState('')
  const [rejectionLabels, setRejectionLabels] = useState([])
  const [isRejecting, setIsRejecting] = useState(false)

  const rejectionReasons = useMemo(() => {
    const currentInstitutionName = profile?.history?.find(
      (p) => !p.end || p.end >= new Date().getFullYear()
    )?.institution?.name
    return getRejectionReasons(profileStateInvitation, currentInstitutionName)
  }, [profileStateInvitation, profile?.history])

  const prependWarning = (warning) => setRejectionMessage((p) => `${warning}\n\n${p}`)

  return (
    <Flex vertical gap="small">
      <Flex justify={onSkip ? 'space-between' : 'flex-end'} wrap gap="small">
        {onSkip && (
          <Button type="primary" onClick={onSkip}>
            Skip
          </Button>
        )}

        <Flex wrap gap="small">
          <Button type="primary" onClick={onAccept}>
            Accept
          </Button>
          <Button type="primary" onClick={() => setIsRejecting(true)}>
            Show Reject Options
          </Button>
          <Button
            type="primary"
            onClick={() =>
              onReject(
                rejectionReasons[0]?.rejectionText,
                rejectionReasons[0] ? [rejectionReasons[0].label] : []
              )
            }
          >
            Reject
          </Button>
        </Flex>
      </Flex>

      {isRejecting && (
        <Flex vertical gap="small" align="flex-start">
          <Select
            allowClear
            mode="multiple"
            style={{ width: '100%' }}
            placeholder="Choose rejection reason(s)..."
            options={rejectionReasons}
            getPopupContainer={(triggerNode) => triggerNode.parentElement}
            onChange={(value) => {
              const selectedReasons = rejectionReasons.filter((r) => value.includes(r.value))
              setRejectionLabels(selectedReasons.map((p) => p.label))
              setRejectionMessage(selectedReasons.map((p) => p.rejectionText).join('\n\n'))
            }}
          />
          <Space wrap>
            <Button type="primary" onClick={() => prependWarning(invalidInfoWarning)}>
              Add Invalid Info Warning
            </Button>
            <Button type="primary" onClick={() => prependWarning(lastNoticeWarning)}>
              Add Last Notice Warning
            </Button>
          </Space>
          <Input.TextArea
            autoSize={{ minRows: 5 }}
            style={{ width: '100%' }}
            value={rejectionMessage}
            onChange={(e) => setRejectionMessage(e.target.value)}
          />
          <Button type="primary" onClick={() => onReject(rejectionMessage, rejectionLabels)}>
            Reject
          </Button>
        </Flex>
      )}
    </Flex>
  )
}

export default ModerationActions
