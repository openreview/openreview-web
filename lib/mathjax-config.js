/* globals MathJax: false */

const mathjaxConfig = {
  loader: { load: ['ui/safe'] },
  options: {
    ignoreHtmlClass: 'disable-tex-rendering', // class that marks tags not to search
  },
  tex: {
    inlineMath: [
      ['$', '$'],
      ['\\(', '\\)'],
    ],
  },
  chtml: {
    scale: 1, // global scaling factor for all expressions
    minScale: 0.5, // smallest scaling factor to use
    matchFontHeight: true, // true to match ex-height of surrounding font
    mtextInheritFont: false, // true to make mtext elements use surrounding font
    merrorInheritFont: true, // true to make merror text use surrounding font
    mathmlSpacing: false, // true for MathML spacing rules, false for TeX rules
    skipAttributes: {}, // RFDa and other attributes NOT to copy to the output
    exFactor: 0.5, // default size of ex in em units
    displayAlign: 'left', // default for indentalign when set to 'auto'
    displayIndent: '0', // default for indentshift when set to 'auto'
  },
  startup: {
    typeset: false, // don't perform initial typeset
    ready() {
      MathJax.startup.defaultReady()
      const { safe } = MathJax.startup.document
      safe.filterAttributes.set('fontfamily', 'filterFamily')
      safe.filterMethods.filterFamily = (_safe, family) => family.split(/;/)[0]
    },
  },
}

export default mathjaxConfig
