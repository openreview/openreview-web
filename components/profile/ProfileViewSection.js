import { Divider } from 'antd'

const ProfileViewSection = ({ title, instructions, children }) => (
  <section>
    <h3 style={{ marginBottom: '0.25em', color: '#8c1b13' }}>{title}</h3>
    <Divider styles={{ root: { margin: 0 } }} />
    <p className="instructions">{instructions}</p>
    <div className="section-content">{children}</div>
  </section>
)

export default ProfileViewSection
