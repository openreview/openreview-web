export default function EditorSection({ title, className, children }) {
  return (
    <section className={className}>
      {title ? <h4>{title}</h4> : null}

      {children}
    </section>
  )
}
