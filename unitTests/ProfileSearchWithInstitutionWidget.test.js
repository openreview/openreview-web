import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ProfileSearchWithInstitutionWidget from '../components/EditorComponents/ProfileSearchWithInstitutionWidget'
import { renderWithEditorComponentContext, reRenderWithEditorComponentContext } from './util'
import '@testing-library/jest-dom'

import api from '../lib/api-client'

jest.mock('nanoid', () => ({ nanoid: () => 'some id' }))
jest.mock('../hooks/useUser', () => () => ({
  user: { profile: { id: '~test_id1' } },
  accessToken: 'test token',
}))

global.$ = jest.fn(() => ({
  tooltip: jest.fn(),
}))
global.promptError = jest.fn()

describe('ProfileSearchWithInstitutionWidget', () => {
  test('add current user to author list (no current institution)', async () => {
    const apiPost = jest.fn(() =>
      Promise.resolve({
        profiles: [
          {
            id: '~test_id1',
            content: {
              names: [{ fullname: 'Test First Test Last', username: '~test_id1' }],
              preferredEmail: 'test@email.com',
              history: [
                {
                  start: 1999,
                  end: 1999,
                  institution: {
                    name: 'Test Institution',
                    domain: 'test.edu',
                    country: 'TC',
                  },
                },
                {
                  start: 2000,
                  end: 2000,
                  institution: {
                    name: 'Another Test Institution',
                    domain: 'another.test.edu',
                    country: 'TC',
                  },
                },
              ],
            },
          },
        ],
      })
    )
    api.post = apiPost
    const onChange = jest.fn()
    const providerProps = {
      value: {
        field: {
          authors: {
            value: {
              param: {
                type: 'author{}',
                properties: {
                  fullname: {
                    param: {
                      type: 'string',
                    },
                  },
                  username: {
                    param: {
                      type: 'string',
                    },
                  },
                  institutions: {
                    param: {
                      type: 'object{}',
                      properties: {
                        name: { param: { type: 'string' } },
                        domain: { param: { type: 'string' } },
                        country: { param: { type: 'string' } },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        onChange,
      },
    }

    renderWithEditorComponentContext(<ProfileSearchWithInstitutionWidget />, providerProps)

    await waitFor(() => {
      expect(onChange).toHaveBeenCalledWith(
        expect.objectContaining({
          value: [
            {
              username: '~test_id1',
              fullname: 'Test First Test Last',
              institutions: [],
            },
          ],
        })
      )
    })
  })

  test('add current user to author list (1 current institution)', async () => {
    const apiPost = jest.fn(() =>
      Promise.resolve({
        profiles: [
          {
            id: '~test_id1',
            content: {
              names: [{ fullname: 'Test First Test Last', username: '~test_id1' }],
              preferredEmail: 'test@email.com',
              history: [
                {
                  start: null,
                  end: null,
                  institution: {
                    name: 'Test Institution',
                    domain: 'test.edu',
                    country: 'TC',
                  },
                },
              ],
            },
          },
        ],
      })
    )
    api.post = apiPost
    const onChange = jest.fn()
    const providerProps = {
      value: {
        field: {
          authors: {
            value: {
              param: {
                type: 'author{}',
                properties: {
                  fullname: {
                    param: {
                      type: 'string',
                    },
                  },
                  username: {
                    param: {
                      type: 'string',
                    },
                  },
                  institutions: {
                    param: {
                      type: 'object{}',
                      properties: {
                        name: { param: { type: 'string' } },
                        domain: { param: { type: 'string' } },
                        country: { param: { type: 'string' } },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        onChange,
      },
    }

    renderWithEditorComponentContext(<ProfileSearchWithInstitutionWidget />, providerProps)

    await waitFor(() => {
      expect(onChange).toHaveBeenCalledWith(
        expect.objectContaining({
          value: [
            {
              fullname: 'Test First Test Last',
              institutions: [{ country: 'TC', domain: 'test.edu', name: 'Test Institution' }],
              username: '~test_id1',
            },
          ],
        })
      )
    })
  })

  test('add current user to author list (multiple current institution)', async () => {
    const currentYear = new Date().getFullYear()
    const apiPost = jest.fn(() =>
      Promise.resolve({
        profiles: [
          {
            id: '~test_id1',
            content: {
              names: [{ fullname: 'Test First Test Last', username: '~test_id1' }],
              preferredEmail: 'test@email.com',
              history: [
                {
                  start: 1999,
                  end: null,
                  institution: {
                    name: 'Test Institution',
                    domain: 'test.edu',
                    country: 'TC',
                  },
                },
                {
                  start: 2000,
                  end: currentYear + 1,
                  institution: {
                    name: 'Another Test Institution',
                    domain: 'another.test.edu',
                    country: 'TC',
                  },
                },
                {
                  start: 1999,
                  end: currentYear + 1,
                  institution: {
                    name: 'Yet Another Test Institution',
                    domain: 'yet.another.test.edu',
                    country: 'TC',
                  },
                },
              ],
            },
          },
        ],
      })
    )
    api.post = apiPost
    const onChange = jest.fn()
    const providerProps = {
      value: {
        field: {
          authors: {
            value: {
              param: {
                type: 'author{}',
                properties: {
                  fullname: {
                    param: {
                      type: 'string',
                    },
                  },
                  username: {
                    param: {
                      type: 'string',
                    },
                  },
                  institutions: {
                    param: {
                      type: 'object{}',
                      properties: {
                        name: { param: { type: 'string' } },
                        domain: { param: { type: 'string' } },
                        country: { param: { type: 'string' } },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        onChange,
      },
    }

    renderWithEditorComponentContext(<ProfileSearchWithInstitutionWidget />, providerProps)

    await waitFor(() => {
      expect(onChange).toHaveBeenCalledWith(
        expect.objectContaining({
          value: [
            {
              username: '~test_id1',
              fullname: 'Test First Test Last',
              institutions: [{ country: 'TC', domain: 'test.edu', name: 'Test Institution' }], // only the first institution is added
            },
          ],
        })
      )
    })
  })

  test('show added author (no current institution)', async () => {
    const apiPost = jest.fn(() =>
      Promise.resolve({
        profiles: [
          {
            id: '~test_id1',
            content: {
              names: [{ fullname: 'Test First Test Last', username: '~test_id1' }],
              preferredEmail: 'test@email.com',
              history: [
                {
                  start: 1999,
                  end: 1999,
                  institution: {
                    name: 'Test Institution',
                    domain: 'test.edu',
                    country: 'TC',
                  },
                },
                {
                  start: 2000,
                  end: 2000,
                  institution: {
                    name: 'Another Test Institution',
                    domain: 'another.test.edu',
                    country: 'TC',
                  },
                },
              ],
            },
          },
        ],
      })
    )
    api.post = apiPost
    const onChange = jest.fn()
    const providerProps = {
      value: {
        field: {
          authors: {
            value: {
              param: {
                type: 'author{}',
                properties: {
                  fullname: {
                    param: {
                      type: 'string',
                    },
                  },
                  username: {
                    param: {
                      type: 'string',
                    },
                  },
                  institutions: {
                    param: {
                      type: 'object{}',
                      properties: {
                        name: { param: { type: 'string' } },
                        domain: { param: { type: 'string' } },
                        country: { param: { type: 'string' } },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        value: [
          {
            username: '~test_id1',
            fullname: 'Test First Test Last',
            institutions: [],
          },
        ],
        onChange,
      },
    }

    renderWithEditorComponentContext(<ProfileSearchWithInstitutionWidget />, providerProps)

    await waitFor(() => {
      // show name
      expect(screen.getByText('Test First Test Last')).toBeInTheDocument()
      // show tilde id as tooltip
      expect(screen.getByText('Test First Test Last')).toHaveAttribute(
        'data-original-title',
        '~test_id1'
      )
      // show link to profile page
      expect(screen.getByText('Test First Test Last')).toHaveAttribute(
        'href',
        '/profile?id=~test_id1'
      )
      // show remove button
      expect(screen.getByRole('button', { name: 'remove' })).toBeInTheDocument()
      // dropdown show no institution
      expect(screen.getByRole('button', { name: 'No Active Institution' })).toBeInTheDocument()
    })
  })

  test('show added author (1 current institution)', async () => {
    const apiPost = jest.fn(() =>
      Promise.resolve({
        profiles: [
          {
            id: '~test_id1',
            content: {
              names: [{ fullname: 'Test First Test Last', username: '~test_id1' }],
              preferredEmail: 'test@email.com',
              history: [
                {
                  start: null,
                  end: null,
                  institution: {
                    name: 'Test Institution',
                    domain: 'test.edu',
                    country: 'TC',
                  },
                },
              ],
            },
          },
        ],
      })
    )
    api.post = apiPost
    const onChange = jest.fn()
    const providerProps = {
      value: {
        field: {
          authors: {
            value: {
              param: {
                type: 'author{}',
                properties: {
                  fullname: {
                    param: {
                      type: 'string',
                    },
                  },
                  username: {
                    param: {
                      type: 'string',
                    },
                  },
                  institutions: {
                    param: {
                      type: 'object{}',
                      properties: {
                        name: { param: { type: 'string' } },
                        domain: { param: { type: 'string' } },
                        country: { param: { type: 'string' } },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        value: [
          {
            username: '~test_id1',
            fullname: 'Test First Test Last',
            institutions: [
              {
                name: 'Test Institution',
                domain: 'test.edu',
                country: 'TC',
              },
            ],
          },
        ],
        onChange,
      },
    }

    renderWithEditorComponentContext(<ProfileSearchWithInstitutionWidget />, providerProps)

    await waitFor(() => {
      // show name
      expect(screen.getByText('Test First Test Last')).toBeInTheDocument()
      // show tilde id as tooltip
      expect(screen.getByText('Test First Test Last')).toHaveAttribute(
        'data-original-title',
        '~test_id1'
      )
      // show link to profile page
      expect(screen.getByText('Test First Test Last')).toHaveAttribute(
        'href',
        '/profile?id=~test_id1'
      )
      // show remove button
      expect(screen.getByRole('button', { name: 'remove' })).toBeInTheDocument()
      // dropdown show the 1 institution added
      expect(screen.getByRole('button', { name: '1 Institution added' })).toBeInTheDocument()
      // expand dropdown to show the institution checked
      userEvent.click(screen.getByRole('button', { name: '1 Institution added' }))
      expect(
        screen.getByRole('checkbox', { name: 'Test Institution (test.edu)' })
      ).toBeChecked()
    })
  })

  test('show added author (multiple current institution, selected 1)', async () => {
    const currentYear = new Date().getFullYear()
    const apiPost = jest.fn(() =>
      Promise.resolve({
        profiles: [
          {
            id: '~test_id1',
            content: {
              names: [{ fullname: 'Test First Test Last', username: '~test_id1' }],
              preferredEmail: 'test@email.com',
              history: [
                {
                  start: 1999,
                  end: null,
                  institution: {
                    name: 'Test Institution',
                    domain: 'test.edu',
                    country: 'TC',
                  },
                },
                {
                  start: 2000,
                  end: currentYear + 1,
                  institution: {
                    name: 'Another Test Institution',
                    domain: 'another.test.edu',
                    country: 'TC',
                  },
                },
                {
                  start: 1999,
                  end: currentYear - 1,
                  institution: {
                    name: 'Non Current Institution',
                    domain: 'not.current.test.edu',
                    country: 'TC',
                  },
                },
                {
                  start: 1999,
                  end: currentYear + 1,
                  institution: {
                    name: 'Yet Another Test Institution',
                    domain: 'yet.another.test.edu',
                    country: 'TC',
                  },
                },
              ],
            },
          },
        ],
      })
    )
    api.post = apiPost
    const onChange = jest.fn()
    const providerProps = {
      value: {
        field: {
          authors: {
            value: {
              param: {
                type: 'author{}',
                properties: {
                  fullname: {
                    param: {
                      type: 'string',
                    },
                  },
                  username: {
                    param: {
                      type: 'string',
                    },
                  },
                  institutions: {
                    param: {
                      type: 'object{}',
                      properties: {
                        name: { param: { type: 'string' } },
                        domain: { param: { type: 'string' } },
                        country: { param: { type: 'string' } },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        value: [
          {
            username: '~test_id1',
            fullname: 'Test First Test Last',
            institutions: [
              {
                name: 'Test Institution',
                domain: 'test.edu',
                country: 'TC',
              },
            ],
          },
        ],
        onChange,
      },
    }

    renderWithEditorComponentContext(<ProfileSearchWithInstitutionWidget />, providerProps)

    await waitFor(() => {
      // show name
      expect(screen.getByText('Test First Test Last')).toBeInTheDocument()
      // show tilde id as tooltip
      expect(screen.getByText('Test First Test Last')).toHaveAttribute(
        'data-original-title',
        '~test_id1'
      )
      // show link to profile page
      expect(screen.getByText('Test First Test Last')).toHaveAttribute(
        'href',
        '/profile?id=~test_id1'
      )
      // show remove button
      expect(screen.getByRole('button', { name: 'remove' })).toBeInTheDocument()
      // dropdown show the 1 institution added
      expect(screen.getByRole('button', { name: '1 Institution added' })).toBeInTheDocument()
    })
    // expand dropdown to show all options
    await userEvent.click(screen.getByRole('button', { name: '1 Institution added' }))
    await waitFor(() => {
      expect(screen.getAllByRole('checkbox').length).toBe(4) // select all + 3 current options
      expect(
        screen.getByRole('checkbox', { name: 'Test Institution (test.edu)' })
      ).toBeChecked()
      expect(
        screen.getByRole('checkbox', { name: 'Another Test Institution (another.test.edu)' })
      ).not.toBeChecked()
      expect(
        screen.getByRole('checkbox', {
          name: 'Yet Another Test Institution (yet.another.test.edu)',
        })
      ).not.toBeChecked()
    })

    // check another institution
    await userEvent.click(
      screen.getByRole('checkbox', { name: 'Another Test Institution (another.test.edu)' })
    )
    await waitFor(() => {
      expect(onChange).toHaveBeenCalledWith(
        expect.objectContaining({
          value: [
            {
              username: '~test_id1',
              fullname: 'Test First Test Last',
              institutions: [
                {
                  name: 'Test Institution',
                  domain: 'test.edu',
                  country: 'TC',
                },
                {
                  name: 'Another Test Institution',
                  domain: 'another.test.edu',
                  country: 'TC',
                },
              ],
            },
          ],
        })
      )
    })

    // check all
    await userEvent.click(screen.getByRole('checkbox', { name: 'Select All' }))
    await waitFor(() => {
      expect(onChange).toHaveBeenCalledWith(
        expect.objectContaining({
          value: [
            {
              username: '~test_id1',
              fullname: 'Test First Test Last',
              institutions: [
                {
                  name: 'Test Institution',
                  domain: 'test.edu',
                  country: 'TC',
                },
                {
                  name: 'Another Test Institution',
                  domain: 'another.test.edu',
                  country: 'TC',
                },
                {
                  name: 'Yet Another Test Institution',
                  domain: 'yet.another.test.edu',
                  country: 'TC',
                },
              ],
            },
          ],
        })
      )
    })

    // uncheck selected institution
    await userEvent.click(
      screen.getByRole('checkbox', { name: 'Test Institution (test.edu)' })
    )
    await waitFor(() => {
      expect(onChange).toHaveBeenCalledWith(
        expect.objectContaining({
          value: [
            {
              username: '~test_id1',
              fullname: 'Test First Test Last',
              institutions: [
                {
                  name: 'Another Test Institution',
                  domain: 'another.test.edu',
                  country: 'TC',
                },
                {
                  name: 'Yet Another Test Institution',
                  domain: 'yet.another.test.edu',
                  country: 'TC',
                },
              ],
            },
          ],
        })
      )
    })
  })

  test('allow reorder only when invitation fix authors value)', async () => {
    const apiPost = jest.fn(() =>
      Promise.resolve({
        profiles: [
          {
            id: '~test_id1',
            content: {
              names: [{ fullname: 'Test First Test Last', username: '~test_id1' }],
              preferredEmail: 'test@email.com',
              history: [
                {
                  start: 1999,
                  end: 1999,
                  institution: {
                    name: 'Test Institution',
                    domain: 'test.edu',
                    country: 'TC',
                  },
                },
                {
                  start: 2000,
                  end: 2000,
                  institution: {
                    name: 'Another Test Institution',
                    domain: 'another.test.edu',
                    country: 'TC',
                  },
                },
              ],
            },
          },
        ],
      })
    )
    api.post = apiPost
    const onChange = jest.fn()
    const providerProps = {
      value: {
        field: {
          authors: {
            value: {
              param: {
                type: 'author{}',
                properties: {
                  fullname: {
                    param: {
                      type: 'string',
                    },
                  },
                  username: {
                    param: {
                      type: 'string',
                    },
                  },
                  institutions: {
                    param: {
                      type: 'object{}',
                      properties: {
                        name: { param: { type: 'string' } },
                        domain: { param: { type: 'string' } },
                        country: { param: { type: 'string' } },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        onChange,
      },
    }

    renderWithEditorComponentContext(<ProfileSearchWithInstitutionWidget />, providerProps)

    await waitFor(() => {
      expect(onChange).toHaveBeenCalledWith(
        expect.objectContaining({
          value: [
            {
              username: '~test_id1',
              fullname: 'Test First Test Last',
              institutions: [],
            },
          ],
        })
      )
    })
  })
})
