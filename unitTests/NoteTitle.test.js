import { screen, render } from '@testing-library/react'
import { NoteTitleV2 } from '../components/NoteTitle'

jest.mock('nanoid', () => ({ nanoid: () => 'some id' }))
import '@testing-library/jest-dom'

describe('NoteTitleV2 pdf link', () => {
  const props = {
    id: 'someid',
    forum: 'someid',
    invitation: 'thecvf.com/CVPR/2026/Conference/-/Submission',
    signatures: ['thecvf.com/CVPR/2026/Conference/Submission1/Authors'],
    options: { pdfLink: true },
  }

  test('show internal pdf link to /attachment', () => {
    render(
      <NoteTitleV2
        {...props}
        content={{ title: { value: 'Some title' }, pdf: { value: '/pdf/abc123.pdf' } }}
      />
    )

    const pdfLink = screen.getByTitle('Download PDF')
    expect(pdfLink).toHaveAttribute('href', '/attachment?id=someid&name=pdf')
    expect(pdfLink).toHaveAttribute('target', '_blank')
    expect(pdfLink).toHaveAttribute('rel', 'noopener noreferrer')
  })

  test('show external pdf link as direct link, not through /attachment', () => {
    render(
      <NoteTitleV2
        {...props}
        content={{
          title: { value: 'Some title' },
          pdf: {
            value: 'https://openaccess.thecvf.com/content/CVPR2026/papers/some_title.pdf',
          },
        }}
      />
    )

    const pdfLink = screen.getByTitle('Download PDF')
    expect(pdfLink).toHaveAttribute(
      'href',
      'https://openaccess.thecvf.com/content/CVPR2026/papers/some_title.pdf'
    )
    expect(pdfLink).toHaveAttribute('target', '_blank')
    expect(pdfLink).toHaveAttribute('rel', 'noopener noreferrer')
  })
})
