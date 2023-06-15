/* globals DOMPurify,marked,MathJax: false */

import { useEffect, useState } from 'react'
import kebabCase from 'lodash/kebabCase'
import { TabList, Tabs, Tab, TabPanels, TabPanel } from './Tabs'

const MarkdownPreviewTab = ({
  value,
  onValueChanged,
  firstTab = 'Write',
  secondTab = 'Preview',
  placeholder = '',
  textAreaClass = '',
  fieldName = '',
  rows=6
}) => {
  const [sanitizedHtml, setSanitizedHtml] = useState('')
  const firstTabId = kebabCase(firstTab)
  const secondTabId = kebabCase(secondTab)

  useEffect(() => {
    if (!value) {
      setSanitizedHtml('<em>Nothing to preview</em>')
      document.querySelector(`a[href="#${fieldName}${firstTabId}"]`).click()
      return
    }
    setSanitizedHtml(DOMPurify.sanitize(marked(value)))
  }, [value])

  return (
    <Tabs className="markdown-preview">
      <TabList>
        <Tab id={`${fieldName}${firstTabId}`} active>
          {firstTab}
        </Tab>
        <Tab id={`${fieldName}${secondTabId}`} onClick={() => MathJax.typesetPromise()}>
          {secondTab}
        </Tab>
      </TabList>

      <TabPanels>
        <TabPanel id={`${fieldName}${firstTabId}`}>
          <textarea
            className={`form-control ${textAreaClass}`}
            rows={`${rows}`}
            placeholder={placeholder}
            value={value}
            required
            onChange={(e) => onValueChanged(e.target.value)}
          />
        </TabPanel>
        <TabPanel id={`${fieldName}${secondTabId}`}>
          {/* eslint-disable-next-line react/no-danger */}
          <div className="preview" dangerouslySetInnerHTML={{ __html: sanitizedHtml }} />
        </TabPanel>
      </TabPanels>
    </Tabs>
  )
}

export default MarkdownPreviewTab
