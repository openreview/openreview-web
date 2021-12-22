export default function EditorSection({ title, className, children }) {
  return (
    <section className={className}>
      <h4>{title}</h4>
      {children}
    </section>
  )
}
