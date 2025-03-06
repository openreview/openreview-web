import { useEffect, useRef } from 'react'
import LoadingSpinner from './LoadingSpinner'

export default function PDFCanvas({ pageContent }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    if (!canvasRef.current || !pageContent) return
    const canvasContext = canvasRef.current.getContext('2d')
    canvasRef.current.width = pageContent.width
    canvasRef.current.height = pageContent.height
    canvasRef.current.zoom = 96
    canvasContext.putImageData(pageContent, 0, 0)
  }, [canvasRef.current])

  if (!pageContent) return <LoadingSpinner />
  return <canvas ref={canvasRef}></canvas>
}
