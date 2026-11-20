import debounce from 'lodash/debounce'
import { useCallback, useEffect, useRef, useState } from 'react'
import useBreakpoint from '../hooks/useBreakPoint'
import { AntdTabs } from './Tabs'

const MarkdownPreviewTab = ({
  value,
  onValueChanged,
  firstTab = 'Write',
  secondTab = 'Preview',
  thirdTab = 'Split view',
  enableSplitView = false,
  placeholder = '',
  textAreaClass = '',
  rows = 6,
}) => {
  const [activeKey, setActiveKey] = useState(firstTab)
  const [splitViewMaxWidth, setSplitViewMaxWidth] = useState()
  const panesRef = useRef(null)
  const previewRef = useRef(null)
  const showSplitView = useBreakpoint('xl') && enableSplitView
  const activeTab = !showSplitView && activeKey === thirdTab ? firstTab : activeKey
  const isSplitView = activeTab === thirdTab

  const renderPreview = (markdown) => {
    const { scrollTop } = previewRef.current
    MathJax.typesetClear?.([previewRef.current])
    previewRef.current.innerHTML = markdown
      ? DOMPurify.sanitize(marked(markdown))
      : '<em>Nothing to preview</em>'
    MathJax.typesetPromise?.([previewRef.current]).catch(() => {
      // oxlint-disable-next-line no-console
      console.warn('Could not typeset TeX content')
    })
    previewRef.current.scrollTop = scrollTop
  }

  const delayPreview = useCallback(debounce(renderPreview, 300), [])

  useEffect(() => {
    if (!value) setActiveKey((key) => (key === secondTab ? firstTab : key))
    if (activeTab !== firstTab) delayPreview(value)
    return delayPreview.cancel
  }, [value])

  useEffect(() => {
    if (activeTab === firstTab) return
    delayPreview.cancel()
    renderPreview(value)
  }, [activeTab])

  useEffect(() => {
    if (!isSplitView) return undefined
    const fitWindow = () =>
      setSplitViewMaxWidth(
        document.documentElement.clientWidth -
          panesRef.current.getBoundingClientRect().left -
          15
      )
    fitWindow()
    window.addEventListener('resize', fitWindow)
    return () => window.removeEventListener('resize', fitWindow)
  }, [isSplitView])

  return (
    <div className={`markdown-preview ${isSplitView ? 'markdown-preview--split-view' : ''}`}>
      <AntdTabs
        type="card"
        activeKey={activeTab}
        onChange={setActiveKey}
        styles={{
          header: { marginBottom: 0 },
          item: { fontSize: '0.75rem' },
        }}
        items={[firstTab, secondTab, ...(showSplitView ? [thirdTab] : [])].map((tab) => ({
          key: tab,
          label: tab,
        }))}
      />
      <div
        className="markdown-preview__panes"
        ref={panesRef}
        style={{ maxWidth: isSplitView ? splitViewMaxWidth : undefined }}
      >
        <div className="markdown-preview__textarea" hidden={activeTab === secondTab}>
          <textarea
            className={`form-control ${textAreaClass}`}
            rows={`${rows}`}
            placeholder={placeholder}
            value={value}
            required
            onChange={(e) => onValueChanged(e.target.value)}
          />
          <div className="markdown-preview__doc-link" hidden={isSplitView}>
            <a
              href="https://docs.openreview.net/reference/openreview-tex"
              target="_blank"
              rel="nofollow noreferrer"
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
        <div className="preview" ref={previewRef} hidden={activeTab === firstTab} />
      </div>
    </div>
  )
}

export default MarkdownPreviewTab
