import { useEffect, useRef } from 'react'
import { EditorState, basicSetup } from '@codemirror/basic-setup'
import { Compartment } from '@codemirror/state'
import { EditorView, keymap } from '@codemirror/view'
import { defaultKeymap, indentWithTab } from '@codemirror/commands'
import { javascript, esLint } from '@codemirror/lang-javascript'
import { python } from '@codemirror/lang-python'
import { json, jsonParseLinter } from '@codemirror/lang-json'
import { linter } from '@codemirror/lint'
import Linter from 'eslint4b-prebuilt'

const CodeEditor = ({
  code, minHeight = '200px', maxHeight = '600px', wrap = true, onChange = undefined, isJson = false, isJavascript = false, scrollIntoView = false,
}) => {
  const containerRef = useRef(null)
  const editorRef = useRef(null)
  const lint = new Compartment()
  const language = new Compartment()
  const languageRef = useRef(null)
  // const getLint
  const getLanguage = () => {
    if (isJson) {
      languageRef.current = 'json'
      return [lint.of(linter(jsonParseLinter())), language.of(json())]
    }
    if (code?.startsWith('//javascript') || isJavascript) {
      languageRef.current = 'javascript'
      return [lint.of(linter(esLint(new Linter()))), language.of(javascript())]
    }
    languageRef.current = 'python'
    return [language.of(python())]
  }

  const setLanguage = EditorState.transactionExtender.of((tr) => {
    const firstLine = editorRef.current.state?.doc?.toString()
    if (firstLine?.startsWith('//javascript') && languageRef.current !== 'javascript') {
      languageRef.current = 'javascript'
      return {
        effects: language.reconfigure(javascript()),
      }
    }
    if (firstLine?.startsWith('#python') && languageRef.current !== 'python') {
      languageRef.current = 'python'
      return {
        effects: language.reconfigure(python()),
      }
    }
    return null
  })

  const setLint = EditorState.transactionExtender.of((tr) => {
    const firstLine = editorRef.current.state?.doc?.toString()
    if (firstLine?.startsWith('//javascript') && languageRef.current !== 'javascript') {
      return {
        effects: lint.reconfigure(linter(esLint(new Linter()))),
      }
    }
    if (firstLine?.startsWith('#python') && languageRef.current !== 'python') {
      return {
        effects: lint.reconfigure(null),
      }
    }
    return null
  })

  useEffect(() => {
    // eslint-disable-next-line max-len
    const extensions = [basicSetup, keymap.of([defaultKeymap, indentWithTab]), ...getLanguage(), setLanguage, setLint, EditorView.theme({
      '&': {
        minHeight,
        maxHeight,
        border: '1px solid #eee',
        fontFamily: 'Monaco, Menlo, "Ubuntu Mono", Consolas',
      },
    })]
    if (wrap) extensions.push(EditorView.lineWrapping)
    if (onChange && typeof onChange === 'function') {
      extensions.push(EditorView.updateListener.of((view) => {
        const value = view.state.doc.toString()
        onChange(value)
      }))
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

  return (
    <div ref={containerRef} />
  )
}

export default CodeEditor
