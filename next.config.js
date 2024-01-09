const nextBuildId = require('next-build-id')

module.exports = {
  eslint: {
    dirs: ['pages', 'components', 'hooks', 'lib', 'tests', 'unitTests'],
  },
  env: {
    SERVER_ENV: process.env.NODE_ENV,
    API_URL: process.env.API_URL,
    API_V2_URL: process.env.API_V2_URL,
    ACCESS_TOKEN_NAME: process.env.ACCESS_TOKEN_NAME,
    SUPER_USER: process.env.SUPER_USER,
    USE_DBLP_VENUES: process.env.USE_DBLP_VENUES,
    GA_PROPERTY_ID: process.env.GA_PROPERTY_ID,
    TURNSTILE_SITEKEY: process.env.TURNSTILE_SITEKEY,
  },
  generateBuildId: () => nextBuildId({ dir: __dirname, describe: true }),
  poweredByHeader: false,
  transpilePackages: ['marked'],
}
