import { useEffect } from 'react'
import { render } from '@testing-library/react'
import useTurnstileToken from '../hooks/useTurnstileToken'

// minimal consumer component for useTurnstileToken
const UseTurnstileTokenComponent = ({ key, renderWidget, testCall }) => {
  const { turnstileToken, turnstileContainerRef } = useTurnstileToken(key, renderWidget)
  useEffect(() => {
    // to check value of token
    testCall(turnstileToken)
  }, [turnstileToken])
  return <div ref={turnstileContainerRef} />
}

describe('useTurnstileToken', () => {
  it('Set token to null when renderWidget is false', async () => {
    const testCall = jest.fn()
    window.turnstile = {
      remove: jest.fn(),
    }
    render(<UseTurnstileTokenComponent key="test" renderWidget={false} testCall={testCall} />)

    expect(testCall).toHaveBeenCalledWith(null)
    expect(window.turnstile.remove).not.toHaveBeenCalled() // not rendered at all
  })

  it('Set token when renderWidget is true', async () => {
    const testCall = jest.fn()
    window.turnstile = {
      render: jest.fn().mockImplementation((_, options) => {
        options.callback('mock-token')
        return 'mock-widget-id'
      }),
    }
    render(<UseTurnstileTokenComponent key="test" testCall={testCall} />)

    expect(testCall).toHaveBeenCalledWith('mock-token')
  })

  it('Set token to null and remove widget when renderWidget is changed to false', async () => {
    const testCall = jest.fn()
    window.turnstile = {
      render: jest.fn().mockImplementation((_, options) => {
        options.callback('mock-token')
        return 'mock-widget-id'
      }),
      remove: jest.fn(),
    }
    const { rerender } = render(<UseTurnstileTokenComponent key="test" testCall={testCall} />)

    expect(testCall).toHaveBeenCalledWith('mock-token')

    rerender(
      <UseTurnstileTokenComponent key="test" renderWidget={false} testCall={testCall} />
    )
    expect(testCall).toHaveBeenLastCalledWith(null)
    expect(window.turnstile.remove).toHaveBeenCalled()
  })

  it('show error when turnstile script can not be loaded', async () => {
    const testCall = jest.fn()
    window.turnstile = undefined
    global.promptError = jest.fn()

    render(<UseTurnstileTokenComponent key="test" testCall={testCall} />)

    expect(testCall).toHaveBeenCalledWith(null)
    expect(global.promptError).toHaveBeenCalledWith(
      'Could not verify browser. Please make sure third-party scripts are not being blocked and try again.'
    )
  })
})
