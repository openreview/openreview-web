export default function ProfileSection({ title, instructions, children }) {
  return (
    <section>
      <h4>{title}</h4>
      <p className="instructions">{instructions}</p>

      {children}
    </section>
  )
}
