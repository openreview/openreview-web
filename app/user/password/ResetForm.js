import { QuestionCircleFilled } from '@ant-design/icons'
import { Button, Checkbox, Flex, Input, Space, Tooltip } from 'antd'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import LoadingIcon from '../../../components/LoadingIcon'
import useUser from '../../../hooks/useUser'
import api from '../../../lib/api-client'

export default function ResetForm({ resetToken }) {
  const [password, setPassword] = useState('')
  const [passwordConfirmation, setPasswordConfirmation] = useState('')
  const [logoutOtherSessions, setLogoutOtherSessions] = useState(true)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { user } = useUser()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      if (password.length === 0) {
        throw new Error('Password cannot be empty')
      }
      if (password !== passwordConfirmation) {
        throw new Error('Passwords must match')
      }

      await api.put(`/reset/${resetToken}`, { password })
      if (user && logoutOtherSessions) await api.post('/logout-all-devices')
      if (!user) {
        promptMessage(
          'Your password has been updated. Please log in with your new password to continue.'
        )
        router.push('/login')
      } else {
        promptMessage(
          `Your password has been updated${logoutOtherSessions ? ' and all other sessions have been logged out.' : '.'}`
        )
        router.push('/')
      }
    } catch (apiError) {
      setLoading(false)
      setError(apiError.message)
    }
  }

  useEffect(() => {
    if (!error) return
    if (error) {
      promptError(error)
    }
    setError(null)
  }, [error])

  return (
    <>
      <Flex vertical gap="small" style={{ minWidth: 0, width: '100%' }}>
        <h4>New Password</h4>
        <Input.Password
          placeholder="New password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoFocus
        />
        <h4>Confirm New Password</h4>
        <Input.Password
          placeholder="Confirm new password"
          value={passwordConfirmation}
          onChange={(e) => setPasswordConfirmation(e.target.value)}
        />

        {user && (
          <Space style={{ marginTop: 25 }}>
            <Checkbox
              checked={logoutOtherSessions}
              onChange={(e) => setLogoutOtherSessions(e.target.checked)}
            />
            Log me out of all other sessions
            <Tooltip title="Sign out of OpenReview on every other browser and device where you're currently signed in. Recommended if you suspect your account was accessed by someone else.">
              <QuestionCircleFilled style={{ color: '#616161' }} />
            </Tooltip>
          </Space>
        )}
        <Button
          type="primary"
          iconPlacement="end"
          loading={loading ? { icon: <LoadingIcon /> } : false}
          onClick={handleSubmit}
          style={{ alignSelf: 'flex-start', marginTop: 25 }}
        >
          Reset Password
        </Button>
      </Flex>
    </>
  )
}
