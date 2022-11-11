import { useEffect, useRef, useState } from 'react'
import { EditorView, basicSetup } from 'codemirror'
import { Compartment, StateEffect } from '@codemirror/state'
import { indentOnInput, LanguageSupport } from '@codemirror/language'
import { jsonLanguage } from '@codemirror/lang-json'
import { javascriptLanguage, esLint } from '@codemirror/lang-javascript'
import { pythonLanguage } from '@codemirror/lang-python'
import { linter, lintGutter } from '@codemirror/lint'
import Linter from 'eslint4b-prebuilt'

const CodeEditorNew = ({
  code,
  minHeight = '200px',
  maxHeight = '600px',
  wrap = true,
  onChange = undefined,
  isJson = false,
  isPython = false,
  defaultToMinHeight = false,
}) => {
  const containerRef = useRef(null)
  const editorRef = useRef(null)
  const [extensions, setExtensions] = useState(null)

  const languageSupports = {
    json: [new LanguageSupport(jsonLanguage)],
    python: [new LanguageSupport(pythonLanguage)],
    javascript: [new LanguageSupport(javascriptLanguage), linter(esLint(new Linter()))],
  }

  const getLanguage = () => {
    if (isJson) return 'json'
    if (code?.startsWith('def process') || isPython) return 'python'
    return 'javascript'
  }
  const [language, setLanguage] = useState(getLanguage())

  useEffect(() => {}, [])

  useEffect(() => {
    if (!extensions) return
    if (!editorRef.current) {
      editorRef.current = new EditorView({
        doc: code,
        extensions,
        parent: containerRef.current,
      })
    } else {
      console.log('displatch reconfigure')
      editorRef.current.dispatch({
        effects: StateEffect.reconfigure.of(extensions),
      })
    }
  }, [extensions])

  useEffect(() => {
    console.log('language changed', language)
    setExtensions([
      basicSetup,
      ...languageSupports[language],
      ...(wrap ? [EditorView.lineWrapping] : []),
      ...(onChange && typeof onChange === 'function'
        ? [
            EditorView.updateListener.of((view) => {
              const value = view.state.doc.toString()
              onChange(value)
            }),
          ]
        : []),
      EditorView.theme({
        '&': {
          minHeight,
          maxHeight,
          ...(defaultToMinHeight && { height: minHeight }),
          border: '1px solid #eee',
          fontFamily: 'Monaco, Menlo, "Ubuntu Mono", Consolas',
          fontSize: '13px',
        },
      }),
    ])
  }, [language])

  useEffect(() => {
    const firstLine = editorRef.current?.viewState?.state?.doc?.lineAt(0)?.text
    if (language === 'json') return
    if (firstLine?.startsWith('def process') && language !== 'python') {
      console.log('set language to python')
      setLanguage('python')
    }
    if (!firstLine?.startsWith('def process') && language !== 'javascript') {
      setLanguage('javascript')
    }
  })

  return <div className="code-editor" ref={containerRef} />
}

export default CodeEditorNew
