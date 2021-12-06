import EditorSection from '../../EditorSection'
import { GroupGeneralView } from '../GroupGeneral'

const GroupGeneralInfo = ({ group }) => (
    <EditorSection getTitle={() => 'General Info'} classes="general" >
      <GroupGeneralView group={group} showEditButton={false} />
    </EditorSection>
)

export default GroupGeneralInfo
