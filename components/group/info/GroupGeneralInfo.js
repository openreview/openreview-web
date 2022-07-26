import EditorSection from '../../EditorSection'
import { GroupGeneralView } from '../GroupGeneral'

const GroupGeneralInfo = ({ group }) => (
  <EditorSection title="General Info" className="general">
    <GroupGeneralView group={group} showEditButton={false} />
  </EditorSection>
)

export default GroupGeneralInfo
