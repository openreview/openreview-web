import { Col, Flex, Pagination, Popover, Row, Space, Tag } from 'antd'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import { useMemo, useState } from 'react'
import { inflect, prettyId } from '../../../../lib/utils'
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
      <Flex vertical gap="small" style={{ marginBottom: '1.5rem' }}>
        {newRequestNotesToDisplay.map((newRequest) => {
          const {
            forum,
            abbreviatedName,
            unrepliedPcComments,
            tauthor,
            tcdate,
            signature,
            apiVersion,
          } = newRequest
          return (
            <Row key={forum} align="middle" gutter={[15, 15]} className="venue-request-row">
              <Col xs={10} md={10} lg={9}>
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

              <Col xs={14} md={9} lg={10}>
                <Space>
                  {unrepliedPcComments.length > 0 ? (
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
                                ? unrepliedPcComments[0].content?.comment?.value
                                : unrepliedPcComments[0].content?.comment
                            }
                          />

                          <a
                            href={`/forum?id=${forum}&noteId=${unrepliedPcComments[0].id}`}
                            target="_blank"
                            rel="noreferrer"
                          >
                            View Comment
                          </a>
                        </Space>
                      }
                      title={`Posted ${dayjs(unrepliedPcComments[0].tcdate).fromNow()}`}
                    >
                      <Tag
                        color="warning"
                        variant="solid"
                      >{`${inflect(unrepliedPcComments.length, 'comment', 'comments', true)}`}</Tag>
                    </Popover>
                  ) : (
                    <Tag color="success" variant="solid">
                      No comment
                    </Tag>
                  )}
                  Created{dayjs(tcdate).fromNow()}
                </Space>
              </Col>

              <Col xs={24} md={5} lg={5}>
                {apiVersion === 2 ? (
                  <a href={`/profile?id=${signature}`} target="_blank" rel="noreferrer">
                    {prettyId(signature)}
                  </a>
                ) : (
                  <a href={`/profile?email=${tauthor}`} target="_blank" rel="noreferrer">
                    {prettyId(tauthor)}
                  </a>
                )}
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
      />
    </>
  )
}

export default VenueRequestList
