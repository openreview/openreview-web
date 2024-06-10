import {render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import PronounSection from "../components/profile/PronounSection"


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







