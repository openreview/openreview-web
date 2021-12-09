const nextBuildId = require('next-build-id')

module.exports = {
  swcMinify: false,
  eslint: {
    dirs: ['pages', 'components', 'hooks', 'lib', 'tests'],
  },
  env: {
    IS_PRODUCTION: process.env.NODE_ENV === 'production',
    IS_STAGING: process.env.NODE_ENV === 'staging',
    API_URL: process.env.API_URL,
    API_V2_URL: process.env.API_V2_URL,
    SUPER_USER: process.env.SUPER_USER,
    USE_DBLP_VENUES: process.env.USE_DBLP_VENUES === 'true',
    USE_NEW_PROFILE_PAGE: process.env.USE_NEW_PROFILE_PAGE === 'true',
    GA_PROPERTY_ID: process.env.GA_PROPERTY_ID,
  },
  generateBuildId: () => nextBuildId({ dir: __dirname, describe: true }),
  poweredByHeader: false,
}
