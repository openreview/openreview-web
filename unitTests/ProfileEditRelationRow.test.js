import { screen, render, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { RelationRow } from '../components/profile/RelationsSection'
import api from '../lib/api-client'
import '@testing-library/jest-dom'

global.ResizeObserver =
  global.ResizeObserver ||
  class {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
if (!window.matchMedia) {
  window.matchMedia = (query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  })
}

global.promptMessage = jest.fn()

jest.mock('nanoid', () => ({ nanoid: () => 'some id' }))
jest.mock('../components/EditorComponents/ProfileSearchWidget', () => () => {
  return <span>ProfileSearchWidget</span>
})
jest.mock('../components/MultiSelectorDropdown', () => () => {
  return <span>Relation Readers Dropdown</span>
})
jest.mock('next/dynamic', () => ({
  __esModule: true,
  default: (loader) => {
    const match = /require\(['"]\.\.\/(.+?)['"]\)/.exec(loader.toString())
    if (match) return require(`../components/${match[1]}`)
    return () => null
  },
}))

describe('RelationRow', () => {
  test('render ProfileSearchWidget for empty relation row', () => {
    const props = {
      relation: {
        key: 'test',
        relation: '',
        name: '',
        email: '',
        start: null,
        end: null,
        readers: ['everyone'],
      },
      setRelation: jest.fn(),
      profileRelation: null,
      relationOptions: [],
      relationReaderOptions: [{ value: 'everyone', label: 'everyone' }],
      showVouchButton: false,
      user: { profile: { id: '~The_Voucher1' } },
    }
    render(<RelationRow {...props} />)
    expect(screen.getByPlaceholderText('Choose or type a relation')).toBeInTheDocument()
    expect(screen.getByText('ProfileSearchWidget')).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: 'Start Year' })).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: 'End Year' })).toBeInTheDocument()
    expect(screen.getByText('Relation Readers Dropdown')).toBeInTheDocument()
  })

  test('render disabled row if the relation is from vouch', () => {
    const props = {
      // merge of profile relation of tag handled by RelationsSection
      relation: {
        key: 'test',
        relation: 'Some Advisor',
        name: 'Test User',
        username: '~Test_User1',
        start: 1999,
        end: 2000,
        readers: ['everyone'],
        vouched: true,
      },
      setRelation: jest.fn(),
      profileRelation: null,
      relationOptions: [],
      relationReaderOptions: [{ value: 'everyone', label: 'everyone' }],
      showVouchButton: false,
      user: { profile: { id: '~The_Voucher1' } },
    }
    render(<RelationRow {...props} />)
    expect(screen.getByDisplayValue('Some Advisor')).toBeDisabled()
    expect(screen.getByDisplayValue('Test User (~Test_User1)')).toBeDisabled()
    expect(screen.getByDisplayValue('1999')).toBeDisabled()
    expect(screen.getByDisplayValue('2000')).toBeDisabled()
    expect(screen.getByDisplayValue('everyone')).toBeDisabled()
  })

  test('show vouch button for saved public tilde id relation', async () => {
    api.post = jest.fn()
    const props = {
      relation: {
        key: 'test',
        relation: 'Some Advisor',
        name: 'Test User',
        username: '~Test_User1',
        start: 1999,
        end: 2000,
        readers: ['everyone'],
        vouched: false,
      },
      setRelation: jest.fn(),
      profileRelation: null,
      relationOptions: [],
      relationReaderOptions: [{ value: 'everyone', label: 'everyone' }],
      showVouchButton: true,
      user: { profile: { id: '~The_Voucher1' } },
    }
    render(<RelationRow {...props} />)
    expect(screen.getByDisplayValue('Test User (~Test_User1)')).toBeInTheDocument()

    const vouchButton = screen.getByRole('button', { name: 'Vouch for this user' })
    expect(vouchButton).toBeInTheDocument()

    // show vouch confirmation modal after clicking vouch button
    await userEvent.click(vouchButton)
    await waitFor(() => {
      expect(screen.getByText('You are about to vouch for Test User')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Vouch' })).toBeInTheDocument()
    })

    // click vouch to post the vouch tag
    await userEvent.click(screen.getByRole('button', { name: 'Vouch' }))
    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/tags', {
        profile: '~Test_User1',
        signature: '~The_Voucher1',
        invitation: expect.any(String),
        label: JSON.stringify({
          relation: 'Some Advisor',
          start: 1999,
          end: 2000,
        }),
      })
    })

    // disable relation after vouching
    await waitFor(() => {
      expect(props.setRelation).toHaveBeenCalledWith({
        type: 'vouchRelation',
        data: { key: 'test' },
      })
      expect(global.promptMessage).toHaveBeenCalledWith('You have vouched for Test User.')
    })
  })
})
