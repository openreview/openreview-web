import ProgramChairConsole from './ProgramChairConsole'
import TrackStatus from './ProgramChairConsole/TrackStatus'
import FlagStatus from './ProgramChairConsole/FlagStatus'

const ARRProgramChairConsole = (props) => (
  <ProgramChairConsole
    {...props}
    extraTabs={[
      {
        tabId: 'track-status',
        tabName: 'Track Status',
        renderTab: () => <TrackStatus />,
      },
      {
        tabId: 'desk-reject-status',
        tabName: 'Flagged for Desk Reject Verification',
        renderTab: () => <FlagStatus />,
      },
    ]}
  />
)

export default ARRProgramChairConsole
