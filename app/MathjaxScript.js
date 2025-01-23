import Script from 'next/script'

const setupMathJax = () => {
  window.typesetMathJax = function () {
    var runTypeset = function () {
      MathJax.startup.promise.then(MathJax.typesetPromise).catch(function (error) {
        // eslint-disable-next-line no-console
        console.warn('Could not typeset TeX content')
      })
    }
    if (MathJax.startup?.promise) {
      runTypeset()
    } else {
      setTimeout(function () {
        if (MathJax.startup?.promise) {
          runTypeset()
        } else {
          // eslint-disable-next-line no-console
          console.warn('Could not typeset TeX content')
        }
      }, 1500)
    }
  }
}

export default function MathjaxScript() {
  return (
    <Script
      src="https://cdn.jsdelivr.net/npm/mathjax@3.2.2/es5/tex-chtml-full.js"
      onLoad={setupMathJax}
    />
  )
}
