export default function ProfileSection({ title, instructions, children }) {
  return (
    <section>
      <h4>{title}</h4>
      <div className="instructions">{instructions}</div>

      {children}
    </section>
  )
}
