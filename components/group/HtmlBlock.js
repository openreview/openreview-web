export default function HtmlBlock({ html, containerStyle }) {
  return (
    <div
      style={containerStyle}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
