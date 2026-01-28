/* globals DOMPurify,marked,MathJax: false */

import { useEffect, useState } from 'react'
import kebabCase from 'lodash/kebabCase'
// import { TabList, Tabs, Tab, TabPanels, TabPanel } from './Tabs'
import Tabs from 'components/Tabs'

const MarkdownPreviewTab = ({
  value,
  onValueChanged,
  firstTab = 'Write',
  secondTab = 'Preview',
  placeholder = '',
  textAreaClass = '',
  fieldName = '',
  rows = 6,
}) => {
  const [sanitizedHtml, setSanitizedHtml] = useState('')
  const firstTabId = kebabCase(firstTab)
  const secondTabId = kebabCase(secondTab)

  // useEffect(() => {
  //   if (!value) {
  //     setSanitizedHtml('<em>Nothing to preview</em>')
  //     document.querySelector(`a[href="#${fieldName}${firstTabId}"]`).click()
  //     return
  //   }
  //   setSanitizedHtml(DOMPurify.sanitize(marked(value)))
  // }, [value])

  const items = [
    {
      key: 'textarea',
      label: firstTab,
      children: (
        <div className="markdown-preview__textarea">
          <textarea
            className={`form-control ${textAreaClass}`}
            rows={`${rows}`}
            placeholder={placeholder}
            value={value}
            required
            onChange={(e) => onValueChanged(e.target.value)}
          />
          <div className="markdown-preview__doc-link">
            <a
              href="https://docs.openreview.net/reference/openreview-tex"
              target="_blank"
              rel="nofloow noreferrer"
            >
              <svg width="16px" height="14px" viewBox="0 0 16 10" version="1.1">
                <g id="surface1">
                  <path
                    fill="none"
                    strokeWidth={10}
                    stroke="black"
                    d="M 14.980469 5 L 193.019531 5 C 198.503906 5 203.023438 9.5 203.023438 15 L 203.023438 113 C 203.023438 118.5 198.503906 123 193.019531 123 L 14.980469 123 C 9.496094 123 4.976562 118.5 4.976562 113 L 4.976562 15 C 4.976562 9.5 9.496094 5 14.980469 5 Z M 14.980469 5 "
                    transform="matrix(0.0769231,0,0,0.078125,0,0)"
                  />
                  <path d="M 2.308594 7.65625 L 2.308594 2.34375 L 3.847656 2.34375 L 5.382812 4.296875 L 6.921875 2.34375 L 8.460938 2.34375 L 8.460938 7.65625 L 6.921875 7.65625 L 6.921875 4.609375 L 5.382812 6.5625 L 3.847656 4.609375 L 3.847656 7.65625 Z M 11.921875 7.65625 L 9.617188 5.078125 L 11.152344 5.078125 L 11.152344 2.34375 L 12.691406 2.34375 L 12.691406 5.078125 L 14.230469 5.078125 Z M 11.921875 7.65625 " />
                </g>
              </svg>
              TeX is supported
            </a>
          </div>
        </div>
      ),
    },
    {
      key: 'preview',
      label: secondTab,
      children: (
        <div className="preview" dangerouslySetInnerHTML={{ __html: sanitizedHtml }} />
      ),
    },
  ]

  return <Tabs items={items} />

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
          <div className="markdown-preview__textarea">
            <textarea
              className={`form-control ${textAreaClass}`}
              rows={`${rows}`}
              placeholder={placeholder}
              value={value}
              required
              onChange={(e) => onValueChanged(e.target.value)}
            />
            <div className="markdown-preview__doc-link">
              <a
                href="https://docs.openreview.net/reference/openreview-tex"
                target="_blank"
                rel="nofloow noreferrer"
              >
                <svg width="16px" height="14px" viewBox="0 0 16 10" version="1.1">
                  <g id="surface1">
                    <path
                      fill="none"
                      strokeWidth={10}
                      stroke="black"
                      d="M 14.980469 5 L 193.019531 5 C 198.503906 5 203.023438 9.5 203.023438 15 L 203.023438 113 C 203.023438 118.5 198.503906 123 193.019531 123 L 14.980469 123 C 9.496094 123 4.976562 118.5 4.976562 113 L 4.976562 15 C 4.976562 9.5 9.496094 5 14.980469 5 Z M 14.980469 5 "
                      transform="matrix(0.0769231,0,0,0.078125,0,0)"
                    />
                    <path d="M 2.308594 7.65625 L 2.308594 2.34375 L 3.847656 2.34375 L 5.382812 4.296875 L 6.921875 2.34375 L 8.460938 2.34375 L 8.460938 7.65625 L 6.921875 7.65625 L 6.921875 4.609375 L 5.382812 6.5625 L 3.847656 4.609375 L 3.847656 7.65625 Z M 11.921875 7.65625 L 9.617188 5.078125 L 11.152344 5.078125 L 11.152344 2.34375 L 12.691406 2.34375 L 12.691406 5.078125 L 14.230469 5.078125 Z M 11.921875 7.65625 " />
                  </g>
                </svg>
                TeX is supported
              </a>
            </div>
          </div>
        </TabPanel>
        <TabPanel id={`${fieldName}${secondTabId}`}>
          <div className="preview" dangerouslySetInnerHTML={{ __html: sanitizedHtml }} />
        </TabPanel>
      </TabPanels>
    </Tabs>
  )
}

export default MarkdownPreviewTab
