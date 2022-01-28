import _ from "lodash"
import { useState, useEffect } from "react"
import { Tabs, TabList, Tab, TabPanels, TabPanel } from "./Tabs"

// #region Table Cell Components
function CheckboxCell() {
  return (
    <label>
      <input type="checkbox" className="select-note-reviewers" />
    </label>
  )
}
function NumberCell({ data }) {
  return (
    <strong className="note-number">{data.number}</strong>
  )
}
function TodoCell({ data }) {
  return (
    <pre>{JSON.stringify(data, undefined, 4)}</pre>
  )
}
function StatusCell({ data }) {
  return (
    <h4>{data.status}</h4>
  )
}
// #endregion

export default function ActionEditorsConsole({
  groupId,
  Header,
  title,
  instructions,
  ActionEditorsTable,
  tableHeadings,
  options,
}) {
  const [combinedData, setCombinedData] = useState(null)

  useEffect(() => {
    const loadCombinedData = () => Promise.resolve({
      tableRows: [
        [{}, { number: 1 }, { title: 'Some paper title' }, {}, {}, { status: 'Test Status' }]
      ]
    })

    loadCombinedData().then(setCombinedData)
  }, [])

  return (
    <div>
      <Header
        title={title}
        instructions={instructions}
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
            <ActionEditorsTable
              tableHeadings={tableHeadings}
              rows={combinedData?.tableRows}
              RowComponents={[CheckboxCell, NumberCell, TodoCell, TodoCell, TodoCell, StatusCell]}
              columnWidths={['3%', '5%', '25%', '30%', '25%', '12%']}
            />
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
