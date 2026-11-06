'use client'

import { useState } from 'react'
import ErrorAlert from '../../components/ErrorAlert'
import Icon from '../../components/Icon'
import SpinnerButton from '../../components/SpinnerButton'
import MarkdownContent from '../../components/webfield/MarkdownContent'

import styles from './Contact.module.scss'

const exampleQuestions = [
  'Why is my profile limited and how do I activate it?',
  'How do I find a venue ID?',
  'How do I withdraw my submission?',
  'How do I recruit reviewers for my venue?',
]

export default function DocsSearch({ onNeedSupport, onSearched }) {
  const [question, setQuestion] = useState('')
  const [result, setResult] = useState(null)
  const [searching, setSearching] = useState(false)
  const [error, setError] = useState(null)
  const [feedback, setFeedback] = useState(null)

  const askDocs = async (questionToAsk) => {
    const trimmedQuestion = questionToAsk.trim()
    if (!trimmedQuestion || searching) return

    setSearching(true)
    setError(null)
    setResult(null)
    setFeedback(null)

    try {
      const response = await fetch('/contact/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: trimmedQuestion }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.message ?? 'Something went wrong.')
      setResult({ ...data, question: trimmedQuestion })
    } catch (apiError) {
      setError({ message: apiError.message })
    } finally {
      setSearching(false)
      onSearched()
    }
  }

  return (
    <div className={styles.docsSearch}>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          askDocs(question)
        }}
      >
        <div className="input-group">
          <input
            type="text"
            className="form-control"
            value={question}
            maxLength={500}
            placeholder="Ask a question, e.g. how do I add a program chair to my venue?"
            aria-label="Ask a question about OpenReview"
            onChange={(e) => setQuestion(e.target.value)}
          />
          <span className="input-group-btn">
            <SpinnerButton
              type="primary"
              size="md"
              loading={searching}
              disabled={!question.trim() || searching}
              onClick={() => askDocs(question)}
            >
              {searching ? 'Searching' : 'Search the docs'}
            </SpinnerButton>
          </span>
        </div>
      </form>

      <div className={styles.exampleQuestions}>
        {exampleQuestions.map((exampleQuestion) => (
          <button
            key={exampleQuestion}
            type="button"
            className={styles.exampleQuestion}
            disabled={searching}
            onClick={() => {
              setQuestion(exampleQuestion)
              askDocs(exampleQuestion)
            }}
          >
            {exampleQuestion}
          </button>
        ))}
      </div>

      {error && <ErrorAlert error={error} />}

      {result && (
        <div className={styles.answer} aria-live="polite">
          {result.answer ? (
            <MarkdownContent content={result.answer} />
          ) : (
            <p>
              The documentation does not have an answer for that. Try rewording your question,
              browse the documentation below, or submit a support request.
            </p>
          )}

          {result.sources?.length > 0 && (
            <>
              <h4>Documentation pages</h4>
              <ul className={styles.sources}>
                {result.sources.map((source) => (
                  <li key={source.url}>
                    <a href={source.url} target="_blank" rel="noreferrer">
                      {source.title}
                    </a>
                  </li>
                ))}
              </ul>
            </>
          )}

          <div className={styles.answerFeedback}>
            {feedback === 'helpful' ? (
              <p className={styles.answerResolved}>
                <Icon name="ok" /> Glad that helped.
              </p>
            ) : (
              <>
                <span>Did this answer your question?</span>
                <button
                  type="button"
                  className={styles.quietAction}
                  onClick={() => setFeedback('helpful')}
                >
                  Yes
                </button>
                <button
                  type="button"
                  className={styles.quietAction}
                  onClick={() => {
                    setFeedback('unhelpful')
                    onNeedSupport(result.question)
                  }}
                >
                  No
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
