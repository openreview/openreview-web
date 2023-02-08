import { useState } from 'react'

export default function ChatEditorForm({ onSubmit }) {
  const [message, setMessage] = useState('')

  return (
    <form>
      <div className="form-group">
        <textarea
          className="form-control"
          rows="3"
          value={message}
          onChange={setMessage}
        />
      </div>
    </form>
  )
}
