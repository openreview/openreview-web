import { Divider } from 'antd'

const ProfileViewSection = ({ title, instructions, children }) => (
  <section>
    <h4
      style={{
        // overwrite bootstrap style
        fontSize: '1rem',
        fontWeight: 'bold',
        marginBottom: '0.25em',
        color: '#8c1b13',
      }}
    >
      {title}
    </h4>
    <Divider styles={{ root: { margin: 0 } }} />
    <p className="instructions">{instructions}</p>
    <div className="section-content">{children}</div>
  </section>
)

export default ProfileViewSection
