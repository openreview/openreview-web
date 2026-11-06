'use client'

import { Alert, Button, Card, Flex, Input, Space, Typography } from 'antd'
import { CloseCircleOutlined } from '@ant-design/icons'
import { useEffect, useRef, useState } from 'react'
import MarkdownContent from '../../components/webfield/MarkdownContent'

const exampleQuestions = [
  'Why is my profile limited and how do I activate it?',
  'How do I find a venue ID?',
  'How do I withdraw my submission?',
  'How do I recruit reviewers for my venue?',
]

const { Text, Link } = Typography

export default function DocsSearch({ onNeedSupport }) {
  const [question, setQuestion] = useState('')
  const [result, setResult] = useState(null)
  const [searching, setSearching] = useState(false)
  const [searched, setSearched] = useState(false)
  const [submittedQuestion, setSubmittedQuestion] = useState('')
  const [error, setError] = useState(null)
  const [helpState, setHelpState] = useState(null)
  const questionInputRef = useRef(null)
  const abortRef = useRef(null)

  useEffect(() => {
    setQuestion(questionInputRef.current.input.value)
    fetch('/contact/ask').catch(() => {})
  }, [])

  const askDocs = async (questionToAsk) => {
    const trimmedQuestion = questionToAsk.trim()
    if (!trimmedQuestion || searching) return

    const abortController = new AbortController()
    abortRef.current = abortController

    setSearching(true)
    setError(null)
    setResult(null)
    setHelpState(null)
    setSubmittedQuestion(trimmedQuestion)

    try {
      const response = await fetch('/contact/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: trimmedQuestion }),
        signal: abortController.signal,
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.message ?? 'Something went wrong.')
      setResult(data)
      setSearched(true)
    } catch (apiError) {
      if (apiError.name === 'AbortError') return
      setError(apiError.message)
      setSearched(true)
    } finally {
      if (abortRef.current === abortController) {
        abortRef.current = null
        setSearching(false)
      }
    }
  }

  const cancelSearch = () => {
    abortRef.current?.abort()
    abortRef.current = null
    setQuestion('')
    setSearching(false)
    setResult(null)
    setError(null)
    setSearched(false)
    setHelpState(null)
  }

  return (
    <Flex vertical gap={12} style={{ marginTop: '1rem' }}>
      <Input.Search
        value={question}
        maxLength={500}
        placeholder="Ask a question, e.g. how do I add a program chair to my venue?"
        aria-label="Ask a question about OpenReview"
        enterButton="Search the docs"
        loading={searching}
        ref={questionInputRef}
        suffix={
          <Button
            type="text"
            size="small"
            aria-label="Cancel"
            icon={<CloseCircleOutlined />}
            style={{ visibility: searching || result || error ? 'visible' : 'hidden' }}
            onClick={cancelSearch}
          />
        }
        onChange={(e) => setQuestion(e.target.value)}
        onSearch={askDocs}
      />

      <Flex wrap gap={8}>
        {exampleQuestions.map((exampleQuestion) => (
          <Button
            key={exampleQuestion}
            size="small"
            disabled={searching}
            onClick={() => {
              setQuestion(exampleQuestion)
              askDocs(exampleQuestion)
            }}
          >
            {exampleQuestion}
          </Button>
        ))}
      </Flex>

      {error && <Alert type="error" showIcon title={error} />}

      {result && (
        <Card size="small" aria-live="polite">
          {result.answer ? (
            <MarkdownContent content={result.answer} />
          ) : (
            <Text>The documentation does not have an answer for that.</Text>
          )}

          {result.sources?.length > 0 && (
            <>
              <Text type="secondary" strong style={{ display: 'block', marginTop: '1rem' }}>
                Documentation pages
              </Text>
              <Space vertical size={2} style={{ marginTop: '0.25rem' }}>
                {result.sources.map((source) => (
                  <Link key={source.url} href={source.url} target="_blank" rel="noreferrer">
                    {source.title}
                  </Link>
                ))}
              </Space>
            </>
          )}
        </Card>
      )}

      {searched && helpState !== 'needsHelp' && (
        <Flex align="center" gap={8}>
          {helpState === 'resolved' ? (
            <Text type="secondary">Glad that helped.</Text>
          ) : (
            <>
              <Text type="secondary">Still need help?</Text>
              <Button
                type="link"
                size="small"
                style={{ padding: 0 }}
                onClick={() => {
                  setHelpState('needsHelp')
                  onNeedSupport(submittedQuestion)
                }}
              >
                Yes
              </Button>
              <Button
                type="link"
                size="small"
                style={{ padding: 0 }}
                onClick={() => setHelpState('resolved')}
              >
                No
              </Button>
            </>
          )}
        </Flex>
      )}
    </Flex>
  )
}
