const withLess = require('@zeit/next-less')

// Without CSS Modules, with PostCSS
module.exports = withLess({
  import: true,
  lessLoaderOptions: {
    javascriptEnabled: true,
  },
})
