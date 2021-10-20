const withLess = require('@zeit/next-less')
const nextBuildId = require('next-build-id')

// Without CSS Modules, with PostCSS
module.exports = withLess({
  import: true,
  env: {
    IS_PRODUCTION: process.env.NODE_ENV === 'production',
    IS_STAGING: process.env.NODE_ENV === 'staging',
    API_URL: process.env.API_URL,
    API_V2_URL: process.env.API_V2_URL,
    SUPER_USER: process.env.SUPER_USER,
    USE_DBLP_VENUES: process.env.USE_DBLP_VENUES === 'true',
    GA_PROPERTY_ID: process.env.GA_PROPERTY_ID,
  },
  generateBuildId: () => nextBuildId({ dir: __dirname, describe: true }),
  poweredByHeader: false,
})
