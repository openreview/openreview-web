import ProgramChairConsole from './ProgramChairConsole'
import TrackStatus from './ProgramChairConsole/TrackStatus'

const ARRProgramChairConsole = (props) => (
  <ProgramChairConsole
    {...props}
    extraTabs={[
      {
        tabId: 'track-status',
        tabName: 'Track Status',
        renderTab: () => <TrackStatus />,
      },
    ]}
  />
)

export default ARRProgramChairConsole
