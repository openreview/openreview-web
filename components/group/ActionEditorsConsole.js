import Tabs from "./Tabs"

export default function ActionEditorsConsole({
  groupId,
  venueId,
  header,
  tabs,
}) {
  const sections = (Array.isArray(tabs) ? tabs : []).map((title) => ({
    heading: title,
    id: title.replace(/\s/g, '-').toLowerCase(),
    content: <p className="empty-message">Loading...</p>,
    extraClasses: 'horizontal-scroll'
  }))

  return (
    <>
      {header}

      <Tabs sections={sections} />
    </>
  )
}
