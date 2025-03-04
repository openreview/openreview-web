import Script from 'next/script'

const onMathJaxLoaded = () => {
  window.isMathJaxLoaded = true
}

export default function MathjaxScript() {
  return (
    <Script
      src="https://cdn.jsdelivr.net/npm/mathjax@3.2.2/es5/tex-chtml-full.js"
      onLoad={onMathJaxLoaded}
    />
  )
}
