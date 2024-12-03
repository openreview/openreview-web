import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import PronounSection from '../components/profile/PronounSection'

jest.mock('nanoid', () => ({ nanoid: () => 'some id' }))

describe('Pronoun selection dropdown', () => {
  test('check if pronouns dropdown renders successfully when no pronouns are selected', () => {
    const updatePronoun = jest.fn()
    const properties = {
      profilePronouns: '',
      updatePronoun,
    }

    render(<PronounSection {...properties} />)
    const element = screen.getByText('Choose pronouns or type a custom pronouns')
    expect(element).toBeInTheDocument()
    expect(updatePronoun).toHaveBeenCalledTimes(1)
    expect(updatePronoun).toHaveBeenCalledWith('')
  })

  test('check if pronouns dropdown renders successfully', () => {
    const updatePronoun = jest.fn()
    const properties = {
      profilePronouns: 'he/him',
      updatePronoun,
    }

    render(<PronounSection {...properties} />)
    const element = screen.getByText('he/him')
    expect(element).toBeInTheDocument()
    expect(updatePronoun).toHaveBeenCalledTimes(1)
    expect(updatePronoun).toHaveBeenCalledWith('he/him')
  })
})
