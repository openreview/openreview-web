import { useEffect, useRef, useState } from 'react'
import { EditorView, basicSetup } from 'codemirror'
import { StateEffect } from '@codemirror/state'
import { keymap } from '@codemirror/view'
import { indentWithTab } from '@codemirror/commands'
import { LanguageSupport } from '@codemirror/language'
import { jsonLanguage, jsonParseLinter } from '@codemirror/lang-json'
import { javascriptLanguage, esLint } from '@codemirror/lang-javascript'
import { pythonLanguage } from '@codemirror/lang-python'
import { linter } from '@codemirror/lint'
import Linter from 'eslint4b-prebuilt'

const CodeEditor = ({
  code,
  minHeight = '200px',
  maxHeight = '600px',
  wrap = true,
  onChange = undefined,
  isJson = false,
  isPython = false,
  isText = false,
  scrollIntoView = false,
  readOnly = false,
  defaultToMinHeight = false,
}) => {
  const containerRef = useRef(null)
  const editorRef = useRef(null)
  const [extensions, setExtensions] = useState(null)
  const [isVisible, setIsVisible] = useState(false)

  const languageSupports = {
    json: [new LanguageSupport(jsonLanguage), linter(jsonParseLinter())],
    python: [new LanguageSupport(pythonLanguage), linter(() => [])],
    javascript: [new LanguageSupport(javascriptLanguage), linter(esLint(new Linter()))],
    text: [],
  }

  const getDefaultLanguage = () => {
    if (isJson) return 'json'
    if (isText) return 'text'
    if (code?.startsWith('def process') || isPython) return 'python'
    return 'javascript'
  }
  const [language, setLanguage] = useState(getDefaultLanguage())

  useEffect(() => {
    if (scrollIntoView) {
      containerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting)
      },
      {
        rootMargin: '0px',
        threshold: 0.1,
      }
    )

    if (containerRef.current) {
      observer.observe(containerRef.current)
    }

    return () => {
      if (containerRef.current) {
        observer.unobserve(containerRef.current)
      }
    }
  }, [])

  useEffect(() => {
    if (!extensions) return

    if (!editorRef.current) {
      editorRef.current = new EditorView({
        doc: code,
        extensions,
        parent: containerRef.current,
      })
    } else {
      editorRef.current.dispatch({
        effects: StateEffect.reconfigure.of(extensions),
      })
    }
  }, [extensions])

  useEffect(() => {
    if (readOnly && !isVisible) return

    setExtensions([
      basicSetup,
      keymap.of([indentWithTab]),
      ...languageSupports[language],
      ...(wrap ? [EditorView.lineWrapping] : []),
      ...(readOnly
        ? [EditorView.editable.of(false)]
        : [
            EditorView.updateListener.of((view) => {
              const value = view.state.doc.toString()

              // Detect if the user starts typing a process function, and if so change language  to python
              if (language !== 'json' && language !== 'text') {
                if (value.startsWith('def process') && language !== 'python') {
                  setLanguage('python')
                }
                if (!value.startsWith('def process') && language !== 'javascript') {
                  setLanguage('javascript')
                }
              }

              if (typeof onChange === 'function') {
                onChange(value)
              }
            }),
          ]),
      EditorView.theme({
        '&': {
          minHeight,
          maxHeight,
          ...(defaultToMinHeight && { height: minHeight }),
          border: '1px solid #eee',
          fontFamily: 'Monaco, Menlo, "Ubuntu Mono", Consolas',
          ...(!readOnly && { fontSize: '13px' }),
        },
      }),
    ])
  }, [language, isVisible])

  return <div className="code-editor" ref={containerRef} />
}

export default CodeEditor
