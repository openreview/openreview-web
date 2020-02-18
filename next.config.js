const withLess = require('@zeit/next-less')

require('dotenv').config()

// Without CSS Modules, with PostCSS
module.exports = withLess({
  import: true,
  lessLoaderOptions: {
    javascriptEnabled: true,
  },
  env: {
    NEXT_PORT: process.env.NEXT_PORT,
    API_URL: process.env.API_URL,
    SECURE_ACTIVATION: false,
    USER_MODERATION: false,
    SUPER_USER: 'OpenReview.net',
    FEEDBACK_EMAIL: 'info@openreview.net',
    ERROR_EMAIL: 'errors@openreview.net',
  },
  poweredByHeader: false,
})
