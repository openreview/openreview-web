const ProfileViewSection = ({ name, title, instructions, actionLink, children }) => (
  <section className={name}>
    <h4>{title}</h4>
    <p className="instructions">{instructions}</p>
    <div className="section-content">{children}</div>
    {actionLink && (
      <ul className="actions list-inline">
        <li>
          <a className="suggest">{actionLink}</a>
        </li>
      </ul>
    )}
  </section>
)

export default ProfileViewSection
