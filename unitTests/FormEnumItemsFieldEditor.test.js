import { render, waitFor, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import userEvent from '@testing-library/user-event'
import FormEnumItemsFieldEditor from '../components/FormEnumItemsFieldEditor'

jest.mock('nanoid', () => ({ nanoid: () => 'some id' }))

describe('FormEnumItemsFieldEditor', () => {
  test('show Add option button', () => {
    render(
      <FormEnumItemsFieldEditor
        fieldName="enum"
        formData={{ dataType: 'string' }}
        options={undefined}
        setOptions={jest.fn()}
      />
    )

    expect(screen.getByRole('button', { text: 'Add Option' })).toBeInTheDocument()
  })

  test('render string options and remove option button', () => {
    render(
      <FormEnumItemsFieldEditor
        fieldName="enum"
        formData={{ dataType: 'string' }}
        options={['value one', 'value two']}
        setOptions={jest.fn()}
      />
    )

    expect(screen.getByDisplayValue('value one')).toHaveAttribute('type', 'text')
    expect(screen.getByDisplayValue('value two')).toHaveAttribute('type', 'text')
    expect(screen.getAllByRole('button', { name: '' })).toHaveLength(2) // wrapper of minus icon
  })

  test('render enum options and remove option button', () => {
    render(
      <FormEnumItemsFieldEditor
        fieldName="enum"
        formData={{ dataType: 'string' }}
        options={[
          { value: 'value one', description: 'Description One' },
          { value: 'value two', description: 'Description Two' },
        ]}
        setOptions={jest.fn()}
      />
    )

    expect(screen.getByDisplayValue('value one')).toHaveAttribute('type', 'text')
    expect(screen.getByDisplayValue('Description One')).toHaveAttribute('type', 'text')
    expect(screen.getByDisplayValue('value two')).toHaveAttribute('type', 'text')
    expect(screen.getByDisplayValue('Description Two')).toHaveAttribute('type', 'text')
    expect(screen.getAllByRole('button', { name: '' })).toHaveLength(2) // wrapper of minus icon
  })

  test('render items options and remove option button', () => {
    render(
      <FormEnumItemsFieldEditor
        fieldName="items"
        formData={{ dataType: 'string[]' }}
        options={[
          { value: 'value one', description: 'Description One', optional: true },
          { value: 'value two', description: 'Description Two', optional: false },
        ]}
        setOptions={jest.fn()}
      />
    )

    expect(screen.getByDisplayValue('value one')).toHaveAttribute('type', 'text')
    expect(screen.getByDisplayValue('Description One')).toHaveAttribute('type', 'text')
    expect(screen.getByDisplayValue('value two')).toHaveAttribute('type', 'text')
    expect(screen.getByDisplayValue('Description Two')).toHaveAttribute('type', 'text')
    expect(screen.getByRole('checkbox', { checked: true })).toBeInTheDocument()
    expect(screen.getByRole('checkbox', { checked: false })).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: '' })).toHaveLength(2)
  })

  test('add an option when add option button is clicked', async () => {
    const setOptions = jest.fn()
    render(
      <FormEnumItemsFieldEditor
        fieldName="enum"
        formData={{ dataType: 'string' }}
        options={undefined}
        setOptions={setOptions}
      />
    )

    const addOptionButton = screen.getByRole('button', { text: 'Add Option' })
    await userEvent.click(addOptionButton)
    await waitFor(() =>
      expect(setOptions).toHaveBeenCalledWith({
        fieldName: 'enum',
        value: [{ description: '', value: '' }],
      })
    )
  })
})
