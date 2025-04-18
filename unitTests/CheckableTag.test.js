import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import userEvent from '@testing-library/user-event'
import CheckableTag from '../components/CheckableTag'

describe('CheckableTag', () => {
  test('show label and no tag text by default', () => {
    const props = {
      label: '🔔',
      tagText: 'Subscribed',
      noTagText: 'Subscribe',
      rawCount: 0,
      checked: undefined,
      onChange: jest.fn(),
    }
    render(<CheckableTag {...props} />)

    expect(screen.getByText('🔔')).toBeInTheDocument()
    expect(screen.getByText('Subscribe', { exact: true })).toBeInTheDocument()
  })

  test('show label with color and has tag text by checked', () => {
    const props = {
      label: '🔔',
      tagText: 'Subscribed',
      noTagText: 'Subscribe',
      rawCount: 1,
      checked: true,
      onChange: jest.fn(),
    }
    render(<CheckableTag {...props} />)

    expect(screen.getByText('🔔')).toBeInTheDocument()
    expect(screen.getByText('🔔')).toHaveClass('checked')
    expect(screen.getByText('Subscribed', { exact: true })).toBeInTheDocument()
    expect(screen.getByText('1')).toBeInTheDocument()
  })

  test('show formatted count', () => {
    let props = {
      label: '🔔',
      tagText: 'Subscribed',
      noTagText: 'Subscribe',
      rawCount: 999,
      checked: true,
      onChange: jest.fn(),
    }
    const { rerender } = render(<CheckableTag {...props} />)

    expect(screen.getByText('999')).toBeInTheDocument()

    props = {
      label: '🔔',
      tagText: 'Subscribed',
      noTagText: 'Subscribe',
      rawCount: 1001, // 1K
      checked: true,
      onChange: jest.fn(),
    }
    rerender(<CheckableTag {...props} />)

    expect(screen.getByText('1K')).toBeInTheDocument()
    expect(screen.getByText('1K')).toHaveAttribute('title', '1001')

    props = {
      label: '🔔',
      tagText: 'Subscribed',
      noTagText: 'Subscribe',
      rawCount: 123456, // 123K
      checked: true,
      onChange: jest.fn(),
    }
    rerender(<CheckableTag {...props} />)

    expect(screen.getByText('123K')).toBeInTheDocument()
    expect(screen.getByText('123K')).toHaveAttribute('title', '123456')

    props = {
      label: '🔔',
      tagText: 'Subscribed',
      noTagText: 'Subscribe',
      rawCount: Number.MAX_SAFE_INTEGER, // 2^53-1
      checked: true,
      onChange: jest.fn(),
    }
    rerender(<CheckableTag {...props} />)

    expect(screen.getByText('9007T')).toBeInTheDocument()
    expect(screen.getByText('9007T')).toHaveAttribute('title', '9007199254740991')
  })

  test('call onChange when checked/unchecked', async () => {
    const onChange = jest.fn()
    let props = {
      label: '🔔',
      tagText: 'Subscribed',
      noTagText: 'Subscribe',
      rawCount: 0,
      checked: false,
      onChange,
    }
    const { rerender } = render(<CheckableTag {...props} />)

    await userEvent.click(screen.getByText('Subscribe'))
    expect(onChange).toHaveBeenCalledTimes(1)

    props = {
      label: '🔔',
      tagText: 'Subscribed',
      noTagText: 'Subscribe',
      rawCount: 1,
      checked: true,
      onChange,
    }
    rerender(<CheckableTag {...props} />)

    await userEvent.click(screen.getByText('Subscribed'))
    expect(onChange).toHaveBeenCalledTimes(2)
  })
})
