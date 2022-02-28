/* globals DOMPurify,marked: false */

import { useEffect, useState } from 'react'
import kebabCase from 'lodash/kebabCase'
import { TabList, Tabs, Tab, TabPanels, TabPanel } from './Tabs'

const MarkdownPreviewTab = ({
  value,
  onValueChanged,
  firstTab = 'Write',
  secondTab = 'Preview',
  placeholder = '',
}) => {
  const [sanitizedHtml, setSanitizedHtml] = useState('')
  const firstTabId = kebabCase(firstTab)
  const secondTabId = kebabCase(secondTab)

  useEffect(() => {
    if (!value) {
      setSanitizedHtml('Nothing to preview')
      return
    }
    setSanitizedHtml(DOMPurify.sanitize(marked(value)))
  }, [value])

  return (
    <Tabs className="markdown-preview">
      <TabList>
        <Tab id={firstTabId} active>{firstTab}</Tab>
        <Tab id={secondTabId}>{secondTab}</Tab>
      </TabList>

      <TabPanels>
        <TabPanel id={firstTabId}>
          <textarea
            className="form-control"
            rows="6"
            placeholder={placeholder}
            value={value}
            required
            onChange={(e) => onValueChanged(e.target.value)}
          />
        </TabPanel>
        <TabPanel id={secondTabId}>
          {/* eslint-disable-next-line react/no-danger */}
          <div className="preview" dangerouslySetInnerHTML={{ __html: sanitizedHtml }} />
        </TabPanel>
      </TabPanels>
    </Tabs>
  )
}

export default MarkdownPreviewTab
