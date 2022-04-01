export default function EditorSection({ title, className, children }) {
  if (!title) return <section className={className}>{children}</section>
  return (
    <section className={className}>
      <h4>{title}</h4>
      {children}
    </section>
  )
}
