const nextBuildId = require('next-build-id')

module.exports = {
  swcMinify: false,
  eslint: {
    dirs: ['pages', 'components', 'hooks', 'lib', 'tests', 'unitTests'],
  },
  env: {
    IS_PRODUCTION: process.env.NODE_ENV === 'production',
    IS_STAGING: process.env.NODE_ENV === 'staging',
    API_URL: process.env.API_URL,
    API_V2_URL: process.env.API_V2_URL,
    ACCESS_TOKEN_NAME: process.env.ACCESS_TOKEN_NAME,
    SUPER_USER: process.env.SUPER_USER,
    USE_DBLP_VENUES: process.env.USE_DBLP_VENUES === 'true',
    USE_PARALLEL_UPLOAD: process.env.USE_PARALLEL_UPLOAD === 'true',
    GA_PROPERTY_ID: process.env.GA_PROPERTY_ID,
    TURNSTILE_SITEKEY: process.env.TURNSTILE_SITEKEY
  },
  generateBuildId: () => nextBuildId({ dir: __dirname, describe: true }),
  poweredByHeader: false,
}
