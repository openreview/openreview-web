export default function EditorSection({ title, classes, children }) {
  return (
    <section className={classes}>
      <h4>{title}</h4>
      {children}
    </section>
  )
}
