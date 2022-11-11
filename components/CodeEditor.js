import { useEffect, useRef } from 'react'
import { basicSetup } from 'codemirror'
import { EditorState, Compartment } from '@codemirror/state'
import { EditorView, keymap } from '@codemirror/view'
import { defaultKeymap, indentWithTab } from '@codemirror/commands'
import { javascript, esLint, javascriptLanguage } from '@codemirror/lang-javascript'
import { python } from '@codemirror/lang-python'
import { json, jsonParseLinter } from '@codemirror/lang-json'
import { linter, lintGutter } from '@codemirror/lint'
import Linter from 'eslint4b-prebuilt'

const CodeEditor = ({
  code,
  minHeight = '200px',
  maxHeight = '600px',
  wrap = true,
  onChange = undefined,
  isJson = false,
  isPython = false,
  scrollIntoView = false,
  readOnly = false,
  defaultToMinHeight = false,
}) => {
  const containerRef = useRef(null)
  const editorRef = useRef(null)
  const lint = new Compartment()
  const language = new Compartment()
  const languageRef = useRef(null)

  const getLanguage = () => {
    if (isJson) {
      languageRef.current = 'json'
      return [lint.of(linter(jsonParseLinter())), language.of(json())]
    }
    if (code?.startsWith('def process') || isPython) {
      languageRef.current = 'python'
      return [language.of(python())]
    }
    languageRef.current = 'javascript'

    return [lint.of(linter(esLint(new Linter()))), language.of(javascript())]
  }

  const setLanguage = EditorState.transactionExtender.of((tr) => {
    const firstLine = editorRef.current.state?.doc?.lineAt(0)?.text
    if (languageRef.current === 'json') return null
    if (firstLine?.startsWith('def process') && languageRef.current !== 'python') {
      languageRef.current = 'python'
      return {
        effects: language.reconfigure(python()),
      }
    }
    if (!firstLine?.startsWith('def process') && languageRef.current !== 'javascript') {
      console.log('change languageref')
      languageRef.current = 'javascript'
      return {
        effects: language.reconfigure(javascript()),
      }
    }
    return null
  })

  const setLint = EditorState.transactionExtender.of((tr) => {
    const firstLine = editorRef.current.state?.doc?.toString()
    if (languageRef.current === 'json') return null
    if (firstLine?.startsWith('def process') && languageRef.current !== 'python') {
      return {
        effects: lint.reconfigure(null),
      }
    }
    if (!firstLine?.startsWith('def process') && languageRef.current !== 'javascript') {
      return {
        effects: lint.reconfigure(linter(esLint(new Linter()))),
      }
    }
    return null
  })

  useEffect(() => {
    const extensions = [
      basicSetup,
      keymap.of([defaultKeymap, indentWithTab]),
      ...getLanguage(),
      setLanguage,
      setLint,
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
    ]

    if (wrap) extensions.push(EditorView.lineWrapping)
    if (readOnly) extensions.push(EditorView.editable.of(false))
    if (onChange && typeof onChange === 'function') {
      extensions.push(
        EditorView.updateListener.of((view) => {
          const value = view.state.doc.toString()
          onChange(value)
        })
      )
    }

    const state = EditorState.create({
      doc: code,
      extensions,
    })
    editorRef.current = new EditorView({
      state,
      parent: containerRef.current,
    })
    if (scrollIntoView) {
      containerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
    return () => editorRef.current?.destroy()
  }, [])

  return <div className="code-editor" ref={containerRef} />
}

export default CodeEditor
