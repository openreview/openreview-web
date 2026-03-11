import { Col, Flex, Input, Pagination, Popover, Row, Space, Tag, Tooltip } from 'antd'
import dayjs from 'dayjs'
import { useMemo, useState } from 'react'
import { prettyId } from '../../../../lib/utils'
import Markdown from '../../../../components/EditorComponents/Markdown'

const pageSize = 25

const VenuesList = ({ venueRequestNotes }) => {
  const [pageNumber, setPageNumber] = useState(1)
  const [searchTerm, setSearchTerm] = useState('')

  const filteredVenueRequestNotes = useMemo(() => {
    if (!searchTerm) return venueRequestNotes
    return venueRequestNotes.filter((note) =>
      note.abbreviatedName.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [venueRequestNotes, searchTerm])

  const venueRequestNotesToDisplay = useMemo(() => {
    const start = (pageNumber - 1) * pageSize
    return filteredVenueRequestNotes.slice(start, start + pageSize)
  }, [filteredVenueRequestNotes, pageNumber])

  return (
    <Flex vertical gap="large" >
      {venueRequestNotes.length > 0 &&
        <Input
          placeholder="Search venue"
          value={searchTerm}
          allowClear
          onChange={(e) => {
            setSearchTerm(e.target.value)
            setPageNumber(1)
          }}
          style={{ width: '100%', maxWidth: '400px' }}
        />}
      <Flex vertical gap="small" style={{ marginBottom: '1.5rem', minHeight: '400px' }}>
        {venueRequestNotesToDisplay.map((venueRequestNote) => {
          const { forum, cdate, abbreviatedName, latestComment, apiVersion, status } =
            venueRequestNote

          return (
            <Row key={forum} align="middle" gutter={[15, 15]} className="venue-request-row">
              <Col xs={24} md={9} lg={9}>
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
              <Col xs={24} md={9} lg={9}>
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
              <Col xs={24} md={6} lg={6}>
                <Tooltip title={status}>
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
                </Tooltip>
              </Col>
            </Row>
          )
        })}
      </Flex>
      <Pagination
        align="center"
        current={pageNumber}
        pageSize={pageSize}
        total={filteredVenueRequestNotes?.length || 0}
        onChange={(page, _size) => {
          setPageNumber(page)
        }}
        hideOnSinglePage
        showSizeChanger={false}
      />
    </Flex>
  )
}

export default VenuesList
