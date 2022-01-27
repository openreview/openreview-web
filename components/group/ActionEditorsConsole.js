import BasicHeader from "./BasicHeader"
import { Tabs, TabList, Tab, TabPanels, TabPanel } from "./Tabs"

export default function ActionEditorsConsole({
  groupId,
  header,
  options,
}) {
  return (
    <div>
      <BasicHeader
        title={header.title}
        instructions={header.instructions}
      />

      <Tabs>
        <TabList>
          <Tab id="assigned-papers">Assigned Papers</Tab>

          {options.showTasksTab && (
            <Tab id="ae-tasks">Action Editors Tasks</Tab>
          )}
        </TabList>

        <TabPanels>
          <TabPanel id="assigned-papers">
            <p>this is content</p>
          </TabPanel>

          {options.showTasksTab && (
            <TabPanel id="ae-tasks">
              <p>TODO...</p>
            </TabPanel>
          )}
        </TabPanels>
      </Tabs>
    </div>
  )
}
