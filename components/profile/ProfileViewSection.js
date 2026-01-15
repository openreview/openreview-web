const ProfileViewSection = ({ title, instructions, children }) => (
  <section>
    <h4>{title}</h4>
    <p className="instructions">{instructions}</p>
    <div className="section-content">{children}</div>
  </section>
)

export default ProfileViewSection
