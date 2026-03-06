import { Col, Flex, Pagination, Popover, Row, Space, Tag } from 'antd'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import { useMemo, useState } from 'react'
import { prettyId } from '../../../../lib/utils'
import Markdown from '../../../../components/EditorComponents/Markdown'

dayjs.extend(relativeTime)

const pageSize = 25

const VenueRequestList = ({ newRequestNotes }) => {
  const [pageNumber, setPageNumber] = useState(1)

  const newRequestNotesToDisplay = useMemo(() => {
    const start = (pageNumber - 1) * pageSize
    return newRequestNotes.slice(start, start + pageSize)
  }, [newRequestNotes, pageNumber])

  return (
    <>
      <Flex vertical gap="small" style={{ marginBottom: '1.5rem', minHeight: '400px' }}>
        {newRequestNotesToDisplay.map((newRequest) => {
          const { forum, abbreviatedName, latestComment, cdate, apiVersion, status } =
            newRequest
          return (
            <Row key={forum} align="middle" gutter={[15, 15]} className="venue-request-row">
              <Col xs={24} md={10} lg={9}>
                <a
                  className="request-name"
                  href={`/forum?id=${forum}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  {abbreviatedName}
                  {apiVersion === 2 && <Tag>workflow</Tag>}
                </a>
              </Col>

              <Col xs={24} md={9} lg={10}>
                <Space>
                  {latestComment ? (
                    <Popover
                      placement="right"
                      styles={{
                        container: { maxWidth: '600px' },
                      }}
                      content={
                        <Space orientation="vertical">
                          <Markdown
                            text={
                              apiVersion === 2
                                ? latestComment.content?.comment?.value
                                : latestComment.content?.comment
                            }
                          />

                          <a
                            href={`/forum?id=${forum}&noteId=${latestComment.id}`}
                            target="_blank"
                            rel="noreferrer"
                          >
                            View Comment
                          </a>
                        </Space>
                      }
                      title={`Posted ${dayjs(latestComment.cdate).fromNow()}`}
                    >
                      <Tag color="warning" variant="solid">
                        {prettyId(latestComment.signatures[0])}
                      </Tag>
                    </Popover>
                  ) : (
                    <Tag color="success" variant="solid">
                      No comment
                    </Tag>
                  )}
                  Created{dayjs(cdate).fromNow()}
                </Space>
              </Col>

              <Col xs={24} md={5} lg={5}>
                <Tag
                  style={{
                    maxWidth: '100%',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                  title={status}
                >
                  {status}
                </Tag>
              </Col>
            </Row>
          )
        })}
      </Flex>
      <Pagination
        align="center"
        current={pageNumber}
        pageSize={pageSize}
        total={newRequestNotes?.length || 0}
        onChange={(page, size) => {
          setPageNumber(page)
        }}
        hideOnSinglePage
        showSizeChanger={false}
      />
    </>
  )
}

export default VenueRequestList
