import { screen, render, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import userEvent from '@testing-library/user-event'
import BaseMenuBar from '../components/webfield/BaseMenuBar'

jest.mock('nanoid', () => ({ nanoid: () => 'some id' }))
jest.mock('../components/ExportFile', () => (props) => <span>CSV Export</span>)
jest.mock('../components/DownloadPDFButton', () => (props) => <span>PDF Download</span>)
jest.mock('lodash', () => {
  const lodash = jest.requireActual('lodash')
  lodash.debounce = (fn) => fn
  return lodash
})
jest.mock('react', () => {
  const react = jest.requireActual('react')
  react.useCallback = (fn) => fn
  return react
})

describe('BaseMenuBar', () => {
  test('show search and sort by default', () => {
    const props = {
      sortOptions: [{ value: 'value', label: 'sort LABEL', getValue: jest.fn() }],
      setData: jest.fn(),
    }

    render(<BaseMenuBar {...props} />)

    expect(screen.getByPlaceholderText('Enter search term')).toBeInTheDocument() // basic search
    expect(screen.getByText('Sort by:')).toBeInTheDocument()
    expect(screen.getByText('sort LABEL')).toBeInTheDocument()
  })

  test('allow search input placeholder to be overwritten', () => {
    const props = {
      sortOptions: [{ value: 'value', label: 'sort LABEL', getValue: jest.fn() }],
      setData: jest.fn(),
      enableQuerySearch: true,
      filterOperators: ['='],
      propertiesAllowed: { number: ['note.number'] },
      searchPlaceHolder: 'search PLACEHOLDER',
    }

    render(<BaseMenuBar {...props} />)

    expect(screen.queryByPlaceholderText('Enter search term')).not.toBeInTheDocument()
    expect(
      screen.getByPlaceholderText(
        'search PLACEHOLDER or type + to start a query and press enter' // placeholder overwrite + query search
      )
    ).toBeInTheDocument()
  })

  test('show message/csv export/download pdf based on setting', () => {
    const props = {
      sortOptions: [],
      setData: jest.fn(),
      messageModal: () => <span>Message Modal</span>,
      exportColumns: [],
      enablePDFDownload: true,
      shortPhrase: 'Test Venue',
    }

    render(<BaseMenuBar {...props} />)

    expect(screen.getByText('Message', { exact: true })).toBeInTheDocument() // message button
    expect(screen.getByText('Message Modal', { exact: true })).toBeInTheDocument() // message modal
    expect(screen.getByText('CSV Export')).toBeInTheDocument()
    expect(screen.getByText('PDF Download')).toBeInTheDocument()
  })

  test('do simple search', async () => {
    const setData = jest.fn()
    const props = {
      sortOptions: [],
      setData,
      enableQuerySearch: true,
      filterOperators: ['='],
      propertiesAllowed: { number: ['note.number'] },
      querySearchInfoModal: () => <span>Query Search Info Modal</span>,
      tableRowsAll: [{ note: { number: 1, id: 'id1' } }, { note: { number: 2, id: 'id2' } }],
    }
    render(<BaseMenuBar {...props} />)

    const searchInput = screen.getByPlaceholderText(
      'Enter search term or type + to start a query and press enter'
    )

    await userEvent.type(searchInput, '+number=1')
    expect(screen.getByDisplayValue('+number=1').previousSibling.firstChild).toHaveAttribute(
      'class',
      expect.stringContaining('glyphicon-info-sign')
    )

    // press enter key
    await userEvent.type(searchInput, '{enter}')
    expect(setData).toHaveBeenCalledWith(expect.any(Function))
  })

  test('enter query search mode when user type + and do search', async () => {
    const setData = jest.fn()
    const props = {
      sortOptions: [],
      setData,
      enableQuerySearch: true,
      filterOperators: ['='],
      propertiesAllowed: { number: ['note.number'] },
      querySearchInfoModal: () => <span>Query Search Info Modal</span>,
      tableRowsAll: [{ note: { number: 1, id: 'id1' } }, { note: { number: 2, id: 'id2' } }],
    }
    render(<BaseMenuBar {...props} />)

    const searchInput = screen.getByPlaceholderText(
      'Enter search term or type + to start a query and press enter'
    )

    await userEvent.type(searchInput, '+number=1')
    expect(screen.getByDisplayValue('+number=1').previousSibling.firstChild).toHaveAttribute(
      'class',
      expect.stringContaining('glyphicon-info-sign')
    )

    // press enter key
    await userEvent.type(searchInput, '{enter}')
    expect(setData).toHaveBeenCalledWith(expect.any(Function))
  })

  test('show error in textbox when search query is invalid', async () => {
    const props = {
      sortOptions: [],
      setData: jest.fn(),
      enableQuerySearch: true,
      filterOperators: ['='],
      propertiesAllowed: { number: ['note.number'] },
      querySearchInfoModal: () => <span>Query Search Info Modal</span>,
      tableRowsAll: [{ note: { number: 1, id: 'id1' } }, { note: { number: 2, id: 'id2' } }],
    }
    render(<BaseMenuBar {...props} />)

    const searchInput = screen.getByPlaceholderText(
      'Enter search term or type + to start a query and press enter'
    )

    await userEvent.type(searchInput, '+number!=1{enter}')
    expect(screen.getByDisplayValue('+number!=1')).toHaveAttribute(
      'class',
      expect.stringContaining('invalid-value')
    )
  })

  test('clear selected note ids when performing search (basic search)', async () => {
    const setSelectedIds = jest.fn()
    const props = {
      sortOptions: [],
      setData: jest.fn(),
      tableRowsAll: [{ note: { number: 1, id: 'id1' } }, { note: { number: 2, id: 'id2' } }],
      tableRows: [{ note: { number: 1, id: 'id1' } }, { note: { number: 2, id: 'id2' } }],
      setSelectedIds,
    }
    render(<BaseMenuBar {...props} />)

    const searchInput = screen.getByPlaceholderText('Enter search term')

    await userEvent.type(searchInput, 'test')
    expect(setSelectedIds).toHaveBeenNthCalledWith(1, [])

    await userEvent.clear(searchInput)
    await waitFor(() => {
      expect(setSelectedIds).toHaveBeenNthCalledWith(2, [])
    })
  })

  test('clear selected note ids when performing search (query search)', async () => {
    const setSelectedIds = jest.fn()
    const props = {
      sortOptions: [],
      setData: jest.fn(),
      enableQuerySearch: true,
      filterOperators: ['='],
      propertiesAllowed: { number: ['note.number'] },
      querySearchInfoModal: () => <span>Query Search Info Modal</span>,
      tableRowsAll: [{ note: { number: 1, id: 'id1' } }, { note: { number: 2, id: 'id2' } }],
      tableRows: [{ note: { number: 1, id: 'id1' } }, { note: { number: 2, id: 'id2' } }],
      setSelectedIds,
    }
    render(<BaseMenuBar {...props} />)

    const searchInput = screen.getByPlaceholderText(
      'Enter search term or type + to start a query and press enter'
    )

    await userEvent.type(searchInput, '+number=1{enter}')
    expect(setSelectedIds).toHaveBeenNthCalledWith(1, [])

    // clear search query
    await userEvent.clear(searchInput)
    await waitFor(() => {
      expect(setSelectedIds).toHaveBeenNthCalledWith(2, [])
    })
  })
})
