/* globals promptError,MathJax: false */
import { useContext, useEffect, useState } from 'react'
import List from 'rc-virtual-list'
import { TabList, Tabs, Tab, TabPanels, TabPanel } from '../Tabs'
import BasicHeader from './BasicHeader'
import WebFieldContext from '../WebFieldContext'
import CodeEditor from '../CodeEditor'
import { NoteV2 } from '../Note'
import PaginationLinks from '../PaginationLinks'

import styles from '../../styles/components/NotesViewer.module.scss'

const NotesViewer = () => {
  const { header } = useContext(WebFieldContext)
  const [value, setValue] = useState('[]')
  const [allNotes, setAllNotes] = useState([])
  const [notes, setNotes] = useState([])
  const [activeTabId, setActiveTabId] = useState('json')
  const [collapseContent, setCollapseContent] = useState(false)
  const [usePagination, setUsePagination] = useState(true)
  const [pageNumber, setPageNumber] = useState(1)
  const pageSize = 25

  const showNotes = () => {
    if (!value.trim()?.length) return
    try {
      const parsed = JSON.parse(value)
      setAllNotes(parsed)
      MathJax.typesetPromise()
    } catch (error) {
      promptError(error.message)
    }
  }

  useEffect(() => {
    if (!usePagination) {
      setNotes(allNotes)
      return
    }
    setNotes(
      allNotes.slice(pageSize * (pageNumber - 1), pageSize * (pageNumber - 1) + pageSize)
    )
  }, [pageNumber, allNotes])

  return (
    <div className={styles.notesViewerContainer}>
      <BasicHeader title={header?.title} instructions={header.instructions} />
      <Tabs>
        <TabList>
          <Tab
            id="json"
            active={activeTabId === 'json' ? true : undefined}
            onClick={() => setActiveTabId('json')}
          >
            Json Array
          </Tab>
          <Tab
            id="notes"
            onClick={() => {
              setActiveTabId('notes')
              showNotes()
            }}
            active={activeTabId === 'notes' ? true : undefined}
          >
            View
          </Tab>
        </TabList>

        <TabPanels>
          <TabPanel id="json" className={styles.tab}>
            {activeTabId === 'json' && (
              <>
                <CodeEditor code={value} minHeight="40vh" onChange={setValue} isJson />
                <div className={styles.optionContainer}>
                  <div className={styles.option}>
                    <label htmlFor="collapseContentCheckbox">Collapse Note Content:</label>
                    <input
                      id="collapseContentCheckbox"
                      type="checkbox"
                      checked={collapseContent}
                      onChange={(e) => setCollapseContent(e.target.checked)}
                    />
                  </div>
                  <div className={styles.option}>
                    <label htmlFor="collapseContentCheckbox">Use pagination:</label>
                    <input
                      id="collapseContentCheckbox"
                      type="checkbox"
                      checked={usePagination}
                      onChange={(e) => setUsePagination(e.target.checked)}
                    />
                  </div>
                </div>
              </>
            )}
          </TabPanel>
          <TabPanel id="notes" className={styles.tab}>
            {activeTabId === 'notes' && (
              <div className="submissions-list">
                <List data={notes} itemHeight={20} itemKey="id">
                  {(note) => (
                    <NoteV2
                      note={note}
                      options={{
                        showContents: true,
                        showPrivateIcon: true,
                        collapse: collapseContent,
                        replyCount: true,
                        extraClasses: 'arbitrary-note-list',
                      }}
                    />
                  )}
                </List>
                {usePagination && (
                  <PaginationLinks
                    currentPage={pageNumber}
                    itemsPerPage={pageSize}
                    totalCount={allNotes.length}
                    setCurrentPage={setPageNumber}
                    options={{ showCount: true }}
                  />
                )}
              </div>
            )}
          </TabPanel>
        </TabPanels>
      </Tabs>
    </div>
  )
}

export default NotesViewer
