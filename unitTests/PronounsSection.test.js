import { cleanup, render, screen, waitFor } from '@testing-library/react'
import { afterEach } from 'node:test'
import '@testing-library/jest-dom'
import PronounSection from "../components/profile/PronounSection"
import GenderSection from '../components/profile/GenderSection'

afterEach(() => {
  cleanup()
})

describe ('Pronoun selection dropdown', () => {
  test ('check if pronouns dropdown renders successfully when no pronouns are selected', () => {
    const properties = {
      profilePronouns: '',
      updatePronoun: jest.fn()
    }

    render(<PronounSection {...properties}/>)
    const element = screen.getByText('Choose pronouns or type a custom pronouns')
    expect(element).toBeInTheDocument()
  })

  test ('check if pronouns dropdown renders successfully', () => {
    const properties = {
      profilePronouns: 'he/him',
      updatePronoun: jest.fn()
    }

    render(<PronounSection {...properties}/>)
    const element = screen.getByText('he/him')
    expect(element).toBeInTheDocument()
  })
})







