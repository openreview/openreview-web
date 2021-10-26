import { useEffect, useRef } from 'react'
import { EditorState, basicSetup } from '@codemirror/basic-setup'
import { EditorView, keymap } from '@codemirror/view'
import { defaultKeymap, indentWithTab } from '@codemirror/commands'
import { javascript } from '@codemirror/lang-javascript'

const CodeEditor = ({
  code, minHeight = '200px', maxHeight = '600px', wrap = true, onChange = undefined,
}) => {
  const editorRef = useRef(null)

  useEffect(() => {
    const extensions = [basicSetup, keymap.of([defaultKeymap, indentWithTab]), javascript(), EditorView.theme({
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
    const view = new EditorView({
      state,
      parent: editorRef.current,
    })
    return () => view.destroy()
  }, [])

  return (
    <div ref={editorRef} />
  )
}

export default CodeEditor
