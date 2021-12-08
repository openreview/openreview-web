// eslint-disable-next-line arrow-body-style
const EditorSection = ({ getTitle, classes, children }) => {
  return (
    <section className={classes}>
      <h4>{getTitle()}</h4>
      {children}
    </section>
  )
}

export default EditorSection
