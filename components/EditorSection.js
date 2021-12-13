export default function EditorSection({ getTitle, classes, children }) {
  return (
    <section className={classes}>
      <h4>{getTitle()}</h4>
      {children}
    </section>
  )
}
