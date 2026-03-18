import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import { renderWithWebFieldContext } from './util'
import ProfileTagsViewer from '../components/webfield/ProfileTagsViewer'
import api from '../lib/api-client'

Object.defineProperty(window, 'matchMedia', {
  value: jest.fn((query) => ({
    matches: false,
  })),
})

let basicHeaderProps

jest.mock('nanoid', () => ({ nanoid: () => 'some id' }))
jest.mock('../hooks/useUser', () => () => ({
  user: { profile: { id: '~Test_User1' } },
  accessToken: 'some token',
}))
jest.mock('../components/webfield/BasicHeader', () => (props) => {
  basicHeaderProps(props)
  return <span>basic header</span>
})
jest.mock('next/navigation', () => ({
  useSearchParams: () => ({
    get: () => 'some domain',
  }),
}))

beforeEach(() => {
  basicHeaderProps = jest.fn()
})

describe('ProfileTagsViewer', () => {
  test('pass default title and instruction to basic header', async () => {
    api.get = jest.fn(() =>
      Promise.resolve({
        tags: [
          {
            profile: '~Some_User1',
            label: 'some label',
            cdate: 'some cdate',
            readers: ['some domain'],
            signature: 'Support Group',
          },
        ],
      })
    )
    const providerProps = {
      value: {
        entity: {
          id: 'some group id',
          domain: 'some domain',
        },
        title: undefined,
        instructions: 'some instructions',
      },
    }
    renderWithWebFieldContext(<ProfileTagsViewer />, providerProps)

    await waitFor(() => {
      expect(screen.getByText('basic header')).toBeInTheDocument()
      expect(basicHeaderProps).toHaveBeenCalledWith({
        instructions: 'some instructions',
        title: 'Tags For Profile Blocked Status',
      })
    })
  })

  test('allow title to be overwritten', async () => {
    api.get = jest.fn(() =>
      Promise.resolve({
        tags: [
          {
            profile: '~Some_User1',
            label: 'some label',
            cdate: 'some cdate',
            readers: ['some domain'],
            signature: 'Support Group',
          },
        ],
      })
    )
    const providerProps = {
      value: {
        entity: {
          id: 'some group id',
          domain: 'some domain',
        },
        title: 'some custom title',
        instructions: undefined,
      },
    }
    renderWithWebFieldContext(<ProfileTagsViewer />, providerProps)

    await waitFor(() => {
      expect(screen.getByText('basic header')).toBeInTheDocument()
      expect(basicHeaderProps).toHaveBeenCalledWith({
        instructions: undefined,
        title: 'some custom title',
      })
    })
  })

  test('show error when no tag can be retrieved', async () => {
    api.get = jest.fn(() =>
      Promise.resolve({
        tags: [],
      })
    )
    const providerProps = {
      value: {
        entity: {
          id: 'some group id',
          domain: 'some domain',
        },
        title: undefined,
        instructions: undefined,
      },
    }
    renderWithWebFieldContext(<ProfileTagsViewer />, providerProps)

    await waitFor(() => {
      expect(screen.queryByText('basic header')).not.toBeInTheDocument()
      expect(screen.getByText('No tags found')).toBeInTheDocument()
    })
  })

  test('show tags and load groups', async () => {
    api.get = jest.fn((path) => {
      switch (path) {
        case '/tags':
          return Promise.resolve({
            tags: [
              {
                profile: '~Some_User1',
                label: 'some label one',
                cdate: new Date(),
                readers: ['some domain'],
                signature: 'Support Group',
              },
              {
                profile: '~Some_User2',
                label: 'some label two',
                cdate: new Date(),
                readers: ['some domain'],
                signature: '~Support_User1',
              },
              {
                profile: '~Some_User3',
                label: 'some label three',
                cdate: new Date(),
                readers: ['some domain'],
                signature: 'Support Group',
              },
            ],
          })
        case '/groups':
          return Promise.resolve({
            groups: [{ id: 'everyone', domain: 'OpenReview.net' }], // will be filtered out by domain
          })
        default:
          break
      }
    })
    const providerProps = {
      value: {
        entity: {
          id: 'some group id',
          domain: 'some domain',
        },
        title: undefined,
        instructions: undefined,
      },
    }
    renderWithWebFieldContext(<ProfileTagsViewer />, providerProps)

    await waitFor(() => {
      expect(screen.getByRole('link', { name: '~Some_User1' })).toBeInTheDocument()
      expect(screen.getByText('some label one')).toBeInTheDocument()
      expect(screen.getAllByRole('link', { name: 'Support Group' })).toHaveLength(2)
      expect(screen.getByRole('link', { name: '~Some_User2' })).toBeInTheDocument()
      expect(screen.getByText('some label two')).toBeInTheDocument()
      expect(screen.getByRole('link', { name: '~Support_User1' })).toBeInTheDocument()
      expect(screen.getByRole('link', { name: '~Some_User3' })).toBeInTheDocument()
      expect(screen.getByText('some label three')).toBeInTheDocument()

      expect(api.get).toHaveBeenCalledWith('/groups', {
        domain: 'some domain',
        member: '~Some_User1',
        select: 'id,domain',
      })

      expect(api.get).toHaveBeenCalledWith('/groups', {
        domain: 'some domain',
        member: '~Some_User2',
        select: 'id,domain',
      })
      expect(api.get).toHaveBeenCalledWith('/groups', {
        domain: 'some domain',
        member: '~Some_User3',
        select: 'id,domain',
      })

      expect(screen.queryByRole('link', { name: 'everyone' })).not.toBeInTheDocument()
    })
  })

  test('do no show unblocked profile', async () => {
    api.get = jest.fn((path) => {
      switch (path) {
        case '/tags':
          return Promise.resolve({
            tags: [
              {
                profile: '~Some_User1',
                label: 'block',
                cdate: new Date(),
                readers: ['some domain'],
                signature: 'Support Group',
              },
              {
                profile: '~Some_User1',
                label: 'unblock',
                cdate: new Date(),
                readers: ['some domain'],
                signature: 'Support Group',
              },
            ],
          })
        case '/groups':
          return Promise.resolve({})
        default:
          break
      }
    })
    const providerProps = {
      value: {
        entity: {
          id: 'some group id',
          domain: 'some domain',
        },
        title: undefined,
        instructions: undefined,
      },
    }
    renderWithWebFieldContext(<ProfileTagsViewer />, providerProps)

    await waitFor(() => {
      expect(screen.getByText('No tags found')).toBeInTheDocument()
    })
  })

  test('show tags and groups (>10 results)', async () => {
    const tagIndex = [...Array(15).keys()].map((p) => p + 1)
    api.get = jest.fn((path, param) => {
      switch (path) {
        case '/tags':
          return Promise.resolve({
            tags: tagIndex.map((index) => ({
              profile: `~Some_User${index}`,
              label: `some label ${index}`,
              cdate: new Date(),
              readers: ['some domain'],
              signature: 'Support Group',
            })),
          })
        case '/groups':
          if (param.member === '~Some_User1') {
            return Promise.resolve({
              groups: [
                { id: 'some group user one is in', domain: 'some domain' },
                { id: 'some other group user one is in', domain: 'some domain' },
              ],
            })
          }
          if (param.member === '~Some_User15') {
            return Promise.resolve({
              groups: [
                { id: 'some group user fifteen is in', domain: 'some domain' },
                { id: 'some other group user fifteen is in', domain: 'some domain' },
              ],
            })
          }
          return Promise.resolve({
            groups: [],
          })
        default:
          break
      }
    })
    const providerProps = {
      value: {
        entity: {
          id: 'some group id',
          domain: 'some domain',
        },
        title: undefined,
        instructions: undefined,
      },
    }
    renderWithWebFieldContext(<ProfileTagsViewer />, providerProps)

    await waitFor(() => {
      expect(screen.getByRole('link', { name: '~Some_User1' })).toBeInTheDocument()
      expect(screen.getByText('some label 1')).toBeInTheDocument()
      expect(screen.getByRole('link', { name: '~Some_User10' })).toBeInTheDocument()
      expect(screen.getByText('some label 10')).toBeInTheDocument()

      expect(screen.getAllByText('No member for some domain')).toHaveLength(9) //user 2 to 10 without matching group

      expect(screen.queryByRole('link', { name: '~Some_User11' })).not.toBeInTheDocument()
      expect(screen.queryByText('some label 11')).not.toBeInTheDocument()

      expect(
        screen.getByRole('link', { name: 'some group user one is in' })
      ).toBeInTheDocument()
      expect(
        screen.getByRole('link', { name: 'some other group user one is in' })
      ).toBeInTheDocument()
      expect(
        screen.queryByRole('link', { name: 'some group user fifteen is in' })
      ).not.toBeInTheDocument()
    })

    await waitFor(() => {
      userEvent.click(screen.getByTitle('2')) //go to page 2
      expect(screen.queryByRole('link', { name: '~Some_User1' })).not.toBeInTheDocument()
      expect(screen.queryByText('some label 1')).not.toBeInTheDocument()
      expect(
        screen.queryByRole('link', { name: 'some group user one is in' })
      ).not.toBeInTheDocument()

      expect(screen.getByRole('link', { name: '~Some_User15' })).toBeInTheDocument()
      expect(screen.getByText('some label 15')).toBeInTheDocument()
      expect(
        screen.getByRole('link', { name: 'some group user fifteen is in' })
      ).toBeInTheDocument()
      expect(
        screen.getByRole('link', { name: 'some other group user fifteen is in' })
      ).toBeInTheDocument()
    })
  })
})
