import { screen, render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import dayjs from 'dayjs'
import Signup from '../app/signup/Signup'
import api from '../lib/api-client'
import '@testing-library/jest-dom'

jest.mock('nanoid', () => ({ nanoid: () => 'some id' }))
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}))
global.$ = jest.fn(() => ({ on: jest.fn(), off: jest.fn(), modal: jest.fn() }))

beforeEach(() => {
  api.get = jest.fn()
  global.promptError = jest.fn()
})

describe('Signup', () => {
  test('show fullname input and confirm name checkbox (disabled)', () => {
    render(<Signup />)

    expect(
      screen.getByText('Enter your full name as you would write it as the author of a paper')
    ).toBeInTheDocument()
    expect(screen.getByRole('textbox', { placeholder: 'Full Name' })).toBeInTheDocument()
    expect(screen.getByRole('checkbox')).toBeDisabled()

    expect(screen.queryByRole('button')).not.toBeInTheDocument()
    expect(api.get).not.toHaveBeenCalled()
  })

  test('enable checkbox after full name is entered', async () => {
    render(<Signup />)

    const fullNameInput = screen.getByRole('textbox', { placeholder: 'Full Name' })
    await userEvent.type(fullNameInput, 'Valid Name')

    expect(screen.getByRole('checkbox')).toBeEnabled()
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
    expect(api.get).not.toHaveBeenCalled()
  })

  test('show dob input when name is confirmed', async () => {
    render(<Signup />)

    const fullNameInput = screen.getByRole('textbox', { placeholder: 'Full Name' })
    const confirmNameCheckbox = screen.getByRole('checkbox')

    await userEvent.type(fullNameInput, 'Valid Name')
    await userEvent.click(confirmNameCheckbox)

    expect(screen.getByText('Enter your date of birth')).toBeInTheDocument()
    expect(screen.getByRole('combobox', { type: 'search' })).toBeInTheDocument() // month
    expect(screen.getByPlaceholderText('DD')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('YYYY')).toBeInTheDocument()
  })

  test('show error when invalid dob is entered', async () => {
    render(<Signup />)

    const currentYear = dayjs().year()

    const fullNameInput = screen.getByRole('textbox', { placeholder: 'Full Name' })
    await userEvent.type(fullNameInput, 'Valid Name')

    const confirmNameCheckbox = screen.getByRole('checkbox')
    await userEvent.click(confirmNameCheckbox)

    const monthDropdown = screen.getByRole('combobox')
    const dayInput = screen.getByPlaceholderText('DD')
    const yearInput = screen.getByPlaceholderText('YYYY')

    // <13 dob
    await userEvent.click(monthDropdown)
    await userEvent.click(screen.getByTitle('January (1)'))
    await userEvent.type(dayInput, '1')
    await userEvent.type(yearInput, (currentYear - 12).toString())

    expect(promptError).toHaveBeenCalledWith(
      'OpenReview profiles require an age of 13 or over.'
    )

    // >100 dob
    await userEvent.clear(yearInput)
    await userEvent.type(yearInput, (currentYear - 101).toString())
    expect(promptError).toHaveBeenLastCalledWith('Please enter a valid date of birth.')

    // invalid date 2/31
    await userEvent.clear(dayInput)
    await userEvent.clear(yearInput)

    await userEvent.click(monthDropdown)
    await userEvent.click(screen.getByTitle('February (2)'))
    await userEvent.type(yearInput, (currentYear - 30).toString())
    await userEvent.type(dayInput, '31')

    expect(promptError).toHaveBeenNthCalledWith(3, 'Please enter a valid date of birth.')
  })

  test('show new profile form when valid dob is entered', async () => {
    render(<Signup />)

    const currentYear = dayjs().year()

    await userEvent.type(screen.getByPlaceholderText('Full name'), 'Valid Name')
    await userEvent.click(screen.getByRole('checkbox'))
    await userEvent.click(screen.getByRole('combobox'))
    await userEvent.click(screen.getByTitle('January (1)'))
    await userEvent.type(screen.getByPlaceholderText('DD'), '11')
    await userEvent.type(screen.getByPlaceholderText('YYYY'), (currentYear - 30).toString())

    expect(screen.getByRole('button', { name: 'Sign Up' })).toBeInTheDocument()
    expect(api.get).toHaveBeenCalledTimes(1) // get institutional domains
    expect(api.get).toHaveBeenCalledWith('/settings/institutionDomains')
  })
})
