/* globals promptError,MathJax: false */
import { useContext, useEffect, useState } from 'react'
import List from 'rc-virtual-list'
import { nanoid } from 'nanoid'
import dayjs from 'dayjs'
import { TabList, Tabs, Tab, TabPanels, TabPanel } from '../Tabs'
import BasicHeader from './BasicHeader'
import WebFieldContext from '../WebFieldContext'
import CodeEditor from '../CodeEditor'
import { NoteV2 } from '../Note'
import PaginationLinks from '../PaginationLinks'

import styles from '../../styles/components/NotesViewer.module.scss'
import ExportFile from '../ExportFile'
import { inflect } from '../../lib/utils'

const NotesViewer = () => {
  const { header } = useContext(WebFieldContext)
  const [value, setValue] = useState('[]')
  const [allNotes, setAllNotes] = useState([])
  const [notes, setNotes] = useState([])
  const [activeTabId, setActiveTabId] = useState('json')
  const [collapseContent, setCollapseContent] = useState(false)
  const [usePagination, setUsePagination] = useState(true)
  const [pageNumber, setPageNumber] = useState(1)
  const [selectedIds, setSelectedIds] = useState([])
  const pageSize = 25

  const showNotes = () => {
    if (!value.trim()?.length) return
    try {
      const parsed = JSON.parse(value)
      setAllNotes(parsed.map((note) => ({ ...note, uniqueId: nanoid() })))
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
              setSelectedIds([])
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
                <List data={notes} itemHeight={20} itemKey="uniqueId">
                  {(note) => (
                    <div className={styles.noteContainer}>
                      <input
                        type="checkbox"
                        className={styles.noteSelectInput}
                        checked={selectedIds.includes(note.uniqueId)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedIds((uniqueIds) => [...uniqueIds, note.uniqueId])
                            return
                          }
                          setSelectedIds((uniqueIds) =>
                            uniqueIds.filter((p) => p !== note.uniqueId)
                          )
                        }}
                      />
                      <NoteV2
                        note={note}
                        options={{
                          showContents: true,
                          showPrivateIcon: true,
                          collapse: collapseContent,
                          replyCount: true,
                        }}
                      />
                    </div>
                  )}
                </List>
                <div className={styles.exportContainer}>
                  {selectedIds.length > 0 && (
                    <ExportFile
                      fileName={`notes-${dayjs().format('YYYY-MM-DD-HH-mm-ss')}.json`}
                      buttonText={`Export ${inflect(selectedIds.length, 'row', 'rows', true)}`}
                      exportType="text/plain"
                      records={allNotes.flatMap((p) => {
                        if (!selectedIds.includes(p.uniqueId)) return []
                        const { uniqueId, ...rest } = p
                        return rest
                      })}
                      customTransformFn={(records) => [JSON.stringify(records, null, 2)]}
                    />
                  )}
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
              </div>
            )}
          </TabPanel>
        </TabPanels>
      </Tabs>
    </div>
  )
}

export default NotesViewer
