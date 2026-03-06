import { Col, Flex, Pagination, Popover, Row, Space, Tag } from 'antd'
import dayjs from 'dayjs'
import { useMemo, useState } from 'react'
import { prettyId } from '../../../../lib/utils'
import Markdown from '../../../../components/EditorComponents/Markdown'

const pageSize = 25

const VenuesList = ({ venueRequestNotes }) => {
  const [pageNumber, setPageNumber] = useState(1)

  const venueRequestNotesToDisplay = useMemo(() => {
    const start = (pageNumber - 1) * pageSize
    return venueRequestNotes.slice(start, start + pageSize)
  }, [venueRequestNotes, pageNumber])

  return (
    <>
      <Flex vertical gap="small" style={{ marginBottom: '1.5rem', minHeight: '400px' }}>
        {venueRequestNotesToDisplay.map((venueRequestNote) => {
          const { forum, cdate, abbreviatedName, latestComment, apiVersion, status } =
            venueRequestNote

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
                {latestComment ? (
                  <Space>
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

                    {dayjs(latestComment.cdate).fromNow()}
                  </Space>
                ) : (
                  <>{dayjs(cdate).fromNow()}</>
                )}
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
        total={venueRequestNotes?.length || 0}
        onChange={(page, size) => {
          setPageNumber(page)
        }}
        hideOnSinglePage
        showSizeChanger={false}
      />
    </>
  )
}

export default VenuesList
