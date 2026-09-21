import { screen, render } from '@testing-library/react'
import Banner from '../components/Banner'
import '@testing-library/jest-dom'

describe('Banner', () => {
  const originalApiUrl = process.env.API_V2_URL

  afterEach(() => {
    if (originalApiUrl === undefined) {
      delete process.env.API_V2_URL
    } else {
      process.env.API_V2_URL = originalApiUrl
    }
  })

  test('renders open... banner as default in prod', () => {
    process.env.API_V2_URL = 'https://api2.openreview.example'

    render(<Banner />)
    const alert = screen.getByRole('alert')
    expect(alert).toHaveClass('ant-alert-banner', 'ant-alert-info')
    expect(alert).toHaveTextContent('Open Peer Review. Open Publishing. Open Access.')
    expect(screen.getByRole('link', { name: 'Donate' })).toHaveAttribute('href', '/donate')
    expect(screen.queryByText(/test sandbox/)).not.toBeInTheDocument()
  })

  test('renders open... banner in local', () => {
    process.env.API_V2_URL = 'http://localhost:3001'

    render(<Banner />)
    const alert = screen.getByRole('alert')
    expect(alert).toHaveClass('ant-alert-banner', 'ant-alert-info')
    expect(alert).toHaveTextContent('Open Peer Review. Open Publishing. Open Access.')
    expect(screen.getByRole('link', { name: 'Donate' })).toHaveAttribute('href', '/donate')
    expect(screen.queryByText(/test sandbox/)).not.toBeInTheDocument()
  })

  test('renders open... banner when api url is missing or invalid', () => {
    delete process.env.API_V2_URL
    const { unmount } = render(<Banner />)
    expect(screen.getByRole('alert')).toHaveClass('ant-alert-info')
    expect(screen.queryByText(/test sandbox/)).not.toBeInTheDocument()
    unmount()

    process.env.API_V2_URL = 'not a url'
    render(<Banner />)
    expect(screen.getByRole('alert')).toHaveClass('ant-alert-info')
    expect(screen.queryByText(/test sandbox/)).not.toBeInTheDocument()
  })

  test('renders sandbox banner in dev', () => {
    process.env.API_V2_URL = 'https://api2.dev.openreview.net'

    render(<Banner />)

    const alert = screen.getByRole('alert')
    expect(alert).toHaveTextContent(
      'You are on the OpenReview test sandbox, not the real site.'
    )
    expect(screen.getByRole('link', { name: 'Go to openreview.net' })).toHaveAttribute(
      'href',
      'https://openreview.net'
    )

    expect(screen.queryByText(/Open Peer Review/)).not.toBeInTheDocument()
  })

  test('render child when supplied', () => {
    process.env.API_V2_URL = 'https://api2.dev.openreview.net'

    render(
      <Banner type="error">
        <span>go back to venue homepage</span>
      </Banner>
    )
    expect(screen.getByText('go back to venue homepage')).toBeInTheDocument()
    expect(screen.getByRole('banner')).toHaveClass('banner', 'banner-error')
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(screen.queryByText(/test sandbox/)).not.toBeInTheDocument()
    expect(screen.queryByText(/Open Peer Review/)).not.toBeInTheDocument()
  })

  test('renders nothing when hidden', () => {
    const { container } = render(<Banner hidden />)
    expect(container).toBeEmptyDOMElement()
  })
})
