import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import DropdownDerivedOptionsWidget from '../components/EditorComponents/DropdownDerivedOptionsWidget'
import { renderWithEditorComponentContext } from './util'
import '@testing-library/jest-dom'

jest.mock('nanoid', () => ({ nanoid: () => 'some id' }))

describe('DropdownDerivedOptionsWidget (authors has special handling getting the username)', () => {
  const authorReferenceField = {
    serve_as_reviewer: {
      value: {
        param: {
          type: 'string[]',
          input: 'select',
          enum: ['${3/authors/value/*/username}'],
        },
      },
    },
  }

  test('render options labelled by author display name', async () => {
    const providerProps = {
      value: {
        field: authorReferenceField,
        editorValue: {
          authors: [
            { username: '~Jane_Doe1', fullname: 'Jane Doe' },
            { username: '~Bob_Lee1', fullname: 'Bob Lee' },
          ],
        },
      },
    }

    renderWithEditorComponentContext(<DropdownDerivedOptionsWidget />, providerProps)
    await userEvent.click(screen.getByRole('combobox'))
    expect(screen.getByText('Jane Doe')).toBeInTheDocument()
    expect(screen.getByText('Bob Lee')).toBeInTheDocument()
  })

  test('drop a selected reviewer whose author has been removed', () => {
    const onChange = jest.fn()
    const providerProps = {
      value: {
        field: authorReferenceField,
        editorValue: { authors: [{ username: '~Jane_Doe1', fullname: 'Jane Doe' }] },
        value: ['~Jane_Doe1', '~Removed_Author1'], // second author was removed
        onChange,
      },
    }

    renderWithEditorComponentContext(<DropdownDerivedOptionsWidget />, providerProps)
    expect(onChange).toHaveBeenCalledWith({
      fieldName: 'serve_as_reviewer',
      value: ['~Jane_Doe1'],
    })
  })

  test('clear the value when the only selected author is removed', () => {
    const onChange = jest.fn()
    const providerProps = {
      value: {
        field: authorReferenceField,
        editorValue: { authors: [{ username: '~Jane_Doe1', fullname: 'Jane Doe' }] },
        value: ['~Removed_Author1'],
        onChange,
      },
    }

    renderWithEditorComponentContext(<DropdownDerivedOptionsWidget />, providerProps)
    expect(onChange).toHaveBeenCalledWith({ fieldName: 'serve_as_reviewer', value: undefined })
  })

  test('keep a valid selection unchanged (no reconcile dispatch)', () => {
    const onChange = jest.fn()
    const providerProps = {
      value: {
        field: authorReferenceField,
        editorValue: {
          authors: [
            { username: '~Jane_Doe1', fullname: 'Jane Doe' },
            { username: '~Bob_Lee1', fullname: 'Bob Lee' },
          ],
        },
        value: ['~Jane_Doe1'],
        onChange,
      },
    }

    renderWithEditorComponentContext(<DropdownDerivedOptionsWidget />, providerProps)
    expect(onChange).not.toHaveBeenCalled()
  })

  test('render nothing when there are no authors', () => {
    const providerProps = {
      value: {
        field: authorReferenceField,
        editorValue: { authors: [] },
      },
    }

    const { container } = renderWithEditorComponentContext(
      <DropdownDerivedOptionsWidget />,
      providerProps
    )
    expect(container).toBeEmptyDOMElement()
  })
})

describe('DropdownDerivedOptionsWidget (non authors field)', () => {
  // accept_decision_options as example in invitation editor
  const derivedField = {
    accept_decision_options: {
      value: {
        param: {
          type: 'string[]',
          input: 'select',
          enum: ['${3/decision_options/value}'],
        },
      },
    },
  }

  test('render options derived from another field', async () => {
    const providerProps = {
      value: {
        field: derivedField,
        editorValue: {
          decision_options: ['Accept (Best Paper)', 'Accept', 'Invite to Archive', 'Reject'],
        },
      },
    }

    renderWithEditorComponentContext(<DropdownDerivedOptionsWidget />, providerProps)
    await userEvent.click(screen.getByRole('combobox'))
    expect(screen.getByText('Accept (Best Paper)')).toBeInTheDocument()
    expect(screen.getByText('Accept')).toBeInTheDocument()
    expect(screen.getByText('Invite to Archive')).toBeInTheDocument()
    expect(screen.getByText('Reject')).toBeInTheDocument()
  })

  test('drop a selected option when source field change', () => {
    const onChange = jest.fn()
    const providerProps = {
      value: {
        field: derivedField,
        editorValue: {
          decision_options: ['Accept (Best Paper)', 'Accept', 'Invite to Archive', 'Reject'],
        },
        value: ['Reject', 'Removed Option'],
        onChange,
      },
    }

    renderWithEditorComponentContext(<DropdownDerivedOptionsWidget />, providerProps)
    expect(onChange).toHaveBeenCalledWith({
      fieldName: 'accept_decision_options',
      value: ['Reject'],
    })
  })

  test('clear the value when the only selected option is removed', () => {
    const onChange = jest.fn()
    const providerProps = {
      value: {
        field: derivedField,
        editorValue: {
          decision_options: ['Accept (Best Paper)', 'Accept', 'Invite to Archive', 'Reject'],
        },
        value: ['Removed Option'],
        onChange,
      },
    }

    renderWithEditorComponentContext(<DropdownDerivedOptionsWidget />, providerProps)
    expect(onChange).toHaveBeenCalledWith({
      fieldName: 'accept_decision_options',
      value: undefined,
    })
  })

  test('render nothing when source field is empty', () => {
    const providerProps = {
      value: {
        field: derivedField,
        editorValue: {
          decision_options: [],
        },
      },
    }

    const { container } = renderWithEditorComponentContext(
      <DropdownDerivedOptionsWidget />,
      providerProps
    )
    expect(container).toBeEmptyDOMElement()
  })
})
