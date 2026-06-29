export default function ProfileSection({ title, instructions, children }) {
  return (
    <section>
      <h4>{title}</h4>
      {instructions && <div className="instructions">{instructions}</div>}

      {children}
    </section>
  )
}
