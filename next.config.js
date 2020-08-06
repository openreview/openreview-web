const withLess = require('@zeit/next-less')

require('dotenv').config()

// Without CSS Modules, with PostCSS
module.exports = withLess({
  import: true,
  env: {
    IS_PRODUCTION: process.env.NODE_ENV === 'production',
    IS_STAGING: process.env.NODE_ENV === 'staging',
    NEXT_PORT: process.env.NEXT_PORT,
    API_URL: process.env.API_URL,
    SECURE_ACTIVATION: false,
    USER_MODERATION: false,
    SUPER_USER: process.env.SUPER_USER,
    FEEDBACK_EMAIL: 'info@openreview.net',
    ERROR_EMAIL: 'errors@openreview.net',
    GA_PROPERTY_ID: process.env.GA_PROPERTY_ID,
  },
  poweredByHeader: false,
})
