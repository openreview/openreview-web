import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ConsoleTabs from '../components/webfield/ConsoleTabs'

let routerParams

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    replace: jest.fn((params) => {
      routerParams = params
      return {
        catch: jest.fn(),
      }
    }),
  }),
}))

beforeEach(() => {
  routerParams = null
  window.location.hash = ''
})

describe('ConsoleTabs', () => {
  test('render first tab by default', () => {
    const tabs = [
      { id: 'tab1Id', label: 'Tab One', visible: true, content: <span>tab 1 content</span> },
      { id: 'tab2Id', label: 'Tab Two', visible: true, content: <span>tab 2 content</span> },
      { id: 'tab3Id', label: 'Tab Three', visible: true, content: <span>tab 3 content</span> },
    ]
    render(<ConsoleTabs tabs={tabs} />)

    expect(screen.getAllByRole('tab').length).toBe(3)
    expect(screen.getAllByRole('tabpanel').length).toBe(1)
    expect(screen.getByText('tab 1 content')).toBeInTheDocument()
  })

  test('render specified default tab in properties', () => {
    const tabs = [
      { id: 'tab1Id', label: 'Tab One', visible: true, content: <span>tab 1 content</span> },
      { id: 'tab2Id', label: 'Tab Two', visible: true, content: <span>tab 2 content</span> },
      { id: 'tab3Id', label: 'Tab Three', visible: true, content: <span>tab 3 content</span> },
    ]
    render(<ConsoleTabs tabs={tabs} defaultActiveTabId="tab3Id" />)

    expect(screen.getAllByRole('tab').length).toBe(3)
    expect(screen.getAllByRole('tabpanel').length).toBe(1)
    expect(screen.getByText('tab 3 content')).toBeInTheDocument()
  })

  test('render tab specified in url', () => {
    window.location.hash = '#tab2Id' // higher priority than defaultActiveTabId
    const tabs = [
      { id: 'tab1Id', label: 'Tab One', visible: true, content: <span>tab 1 content</span> },
      { id: 'tab2Id', label: 'Tab Two', visible: true, content: <span>tab 2 content</span> },
      { id: 'tab3Id', label: 'Tab Three', visible: true, content: <span>tab 3 content</span> },
    ]
    render(<ConsoleTabs tabs={tabs} defaultActiveTabId="tab3Id" />)

    expect(screen.getAllByRole('tab').length).toBe(3)
    expect(screen.getAllByRole('tabpanel').length).toBe(1)
    expect(screen.getByText('tab 2 content')).toBeInTheDocument()
  })

  test('render only visible tabs', () => {
    const tabs = [
      { id: 'tab1Id', label: 'Tab One', visible: false, content: <span>tab 1 content</span> }, // first tab is invisible
      { id: 'tab2Id', label: 'Tab Two', visible: true, content: <span>tab 2 content</span> }, // tab 2 becomes first tab
      { id: 'tab3Id', label: 'Tab Three', visible: true, content: <span>tab 3 content</span> },
    ]
    render(<ConsoleTabs tabs={tabs} />)

    expect(screen.getAllByRole('tab').length).toBe(2)
    expect(screen.getAllByRole('tabpanel').length).toBe(1)
    expect(screen.getByText('tab 2 content')).toBeInTheDocument()
  })

  test('handle invalid hash in url', () => {
    window.location.hash = '#invalidTabId'
    const tabs = [
      { id: 'tab1Id', label: 'Tab One', visible: true, content: <span>tab 1 content</span> },
      { id: 'tab2Id', label: 'Tab Two', visible: true, content: <span>tab 2 content</span> },
      { id: 'tab3Id', label: 'Tab Three', visible: true, content: <span>tab 3 content</span> },
    ]
    render(<ConsoleTabs tabs={tabs} defaultActiveTabId="tab1Id" />)

    expect(screen.getAllByRole('tab').length).toBe(3)
    expect(screen.getAllByRole('tabpanel').length).toBe(1)
    expect(screen.getByText('tab 1 content')).toBeInTheDocument()
  })

  test('switch tab and pass active tab id to parent', async () => {
    const tabs = [
      { id: 'tab1Id', label: 'Tab One', visible: true, content: <span>tab 1 content</span> },
      { id: 'tab2Id', label: 'Tab Two', visible: true, content: <span>tab 2 content</span> },
      { id: 'tab3Id', label: 'Tab Three', visible: true, content: <span>tab 3 content</span> },
    ]
    render(<ConsoleTabs tabs={tabs} />)

    expect(screen.getByText('tab 1 content')).toBeInTheDocument()

    await userEvent.click(screen.getByText('Tab Two'))
    expect(screen.getByText('tab 2 content')).toBeInTheDocument()
    expect(routerParams).toBe('#tab2Id')

    await userEvent.click(screen.getByText('Tab Three'))
    expect(screen.getByText('tab 3 content')).toBeInTheDocument()
    expect(routerParams).toBe('#tab3Id')
  })
})
