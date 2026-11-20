import {
  RotateLeftOutlined,
  RotateRightOutlined,
  UndoOutlined,
  ZoomInOutlined,
  ZoomOutOutlined,
} from '@ant-design/icons'
import { Button, Flex, Image, Tooltip } from 'antd'
import { useState } from 'react'

import { colors } from '../lib/legacy-bootstrap-styles'

const zoomStep = 0.25
const minZoom = 0.25
const maxZoom = 5

const ImageViewer = ({ src, alt, height = '70vh' }) => {
  const [rotation, setRotation] = useState(0)
  const [zoom, setZoom] = useState(1)

  const isQuarterTurned = rotation % 180 !== 0
  const isUnchanged = rotation % 360 === 0 && zoom === 1

  const rotate = (degrees) => setRotation((p) => p + degrees)
  const changeZoom = (delta) =>
    setZoom((p) => Math.min(maxZoom, Math.max(minZoom, Number((p + delta).toFixed(2)))))
  const reset = () => {
    setRotation((p) => Math.round(p / 360) * 360)
    setZoom(1)
  }

  return (
    <div style={{ position: 'relative' }}>
      <Flex
        gap={4}
        align="center"
        style={{
          position: 'absolute',
          top: 8,
          right: 8,
          zIndex: 1,
          padding: '2px 6px',
          borderRadius: 4,
          border: '1px solid #f0f0f0',
          background: 'rgba(255, 255, 255, 0.92)',
          boxShadow: '0 1px 4px rgba(0, 0, 0, 0.12)',
        }}
      >
        <Tooltip title="Rotate left">
          <Button size="small" icon={<RotateLeftOutlined />} onClick={() => rotate(-90)} />
        </Tooltip>
        <Tooltip title="Rotate right">
          <Button size="small" icon={<RotateRightOutlined />} onClick={() => rotate(90)} />
        </Tooltip>
        <Tooltip title="Zoom out">
          <Button
            size="small"
            icon={<ZoomOutOutlined />}
            disabled={zoom <= minZoom}
            onClick={() => changeZoom(-zoomStep)}
          />
        </Tooltip>
        <Tooltip title="Zoom in">
          <Button
            size="small"
            icon={<ZoomInOutlined />}
            disabled={zoom >= maxZoom}
            onClick={() => changeZoom(zoomStep)}
          />
        </Tooltip>
        <Tooltip title="Reset">
          <Button
            size="small"
            icon={<UndoOutlined />}
            disabled={isUnchanged}
            onClick={reset}
          />
        </Tooltip>
        <small
          style={{ color: colors.textMuted, minWidth: '2.5rem', textAlign: 'right' }}
        >{`${Math.round(zoom * 100)}%`}</small>
      </Flex>

      <div
        style={{
          height,
          overflow: 'auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '1px solid #f0f0f0',
          borderRadius: 4,
          background: '#fff',
        }}
      >
        <Image
          src={src}
          alt={alt}
          styles={{
            root: {
              transform: `rotate(${rotation}deg) scale(${zoom})`,
              transformOrigin: 'center',
              transition: 'transform 0.15s ease',
            },
          }}
          style={{
            ...(isQuarterTurned
              ? { maxHeight: '100%', maxWidth: 'none', width: 'auto' }
              : { maxWidth: '100%', width: '100%' }),
            cursor: 'zoom-in',
          }}
        />
      </div>
    </div>
  )
}

export default ImageViewer
