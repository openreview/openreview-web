import { screen, render } from '@testing-library/react'
import '@testing-library/jest-dom'
import userEvent from '@testing-library/user-event'
import SelectAllCheckBox from '../components/webfield/SelectAllCheckbox'

describe('SelectAllCheckbox', () => {
  test('show unchecked checkbox when there is no item', () => {
    const selectedIds = [1, 2]
    const setSelectedIds = jest.fn()
    const allIds = null

    render(
      <SelectAllCheckBox
        selectedIds={selectedIds}
        setSelectedIds={setSelectedIds}
        allIds={allIds}
      />
    )

    expect(screen.getByRole('checkbox')).not.toBeChecked()
  })

  test('show unchecked checkbox when not all items are selected', () => {
    const selectedIds = [1, 2]
    const setSelectedIds = jest.fn()
    const allIds = [1, 2, 3]

    render(
      <SelectAllCheckBox
        selectedIds={selectedIds}
        setSelectedIds={setSelectedIds}
        allIds={allIds}
      />
    )

    expect(screen.getByRole('checkbox')).not.toBeChecked()
  })

  test('show checked checkbox when all items are selected', () => {
    const selectedIds = [1, 2, 3]
    const setSelectedIds = jest.fn()
    const allIds = [1, 2, 3]

    render(
      <SelectAllCheckBox
        selectedIds={selectedIds}
        setSelectedIds={setSelectedIds}
        allIds={allIds}
      />
    )

    expect(screen.getByRole('checkbox')).toBeChecked()
  })

  test('select all when checked', async () => {
    const selectedIds = [1, 2]
    const setSelectedIds = jest.fn()
    const allIds = [1, 2, 3]

    render(
      <SelectAllCheckBox
        selectedIds={selectedIds}
        setSelectedIds={setSelectedIds}
        allIds={allIds}
      />
    )

    await userEvent.click(screen.getByRole('checkbox'))
    expect(setSelectedIds).toHaveBeenCalledWith(allIds)
  })

  test('select empty when unchecked', async () => {
    const selectedIds = [1, 2, 3]
    const setSelectedIds = jest.fn()
    const allIds = [1, 2, 3]

    render(
      <SelectAllCheckBox
        selectedIds={selectedIds}
        setSelectedIds={setSelectedIds}
        allIds={allIds}
      />
    )

    await userEvent.click(screen.getByRole('checkbox'))
    expect(setSelectedIds).toHaveBeenCalledWith([])
  })
})
