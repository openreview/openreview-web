# OpenReview Web

[![Next.js CI](https://github.com/openreview/openreview-web/actions/workflows/build.yml/badge.svg?branch=master)](https://github.com/openreview/openreview-web/actions)

The official web interface to the [OpenReview API](https://github.com/openreview/openreview/),
built with React and Next.js.

## Installation

Clone this repository into a new directory, then from inside that directory run:

```bash
npm install
```

Next set the port that the Next.js server will listen on, or add it to your shell configuration:

```bash
export NEXT_PORT=3030
```

Finally, copy the sample config file and replace the default values with the correct
values for your environment:

```bash
cp .env.example .env.local
```

You may not need to change any of these variables, unless you have a non-standard configuration.

## Development

To run the development server, run:

```bash
npm run dev
```

This will watch for any changes and rebuild the page. The OpenReview API server
also has to be running at the same time, and accessible at the URL specified by
the `$API_URL` env var.

After editing any Handlebars template file (deprecated), make sure to run:

```bash
npm run templates
```

This command compiles all the .hbs files found in the `client/templates` dir and
builds the file client/templates.js which is used by the legacy frontend code.

To check for ESLint errors, run:

```bash
npm run lint
```

To build and run in release mode, run:

```bash
npm run prod
```

## Unit Testing

OpenReview Web uses [Jest](https://jestjs.io/) and [Testing Library](https://testing-library.com/) to run unit tests, use the following command to execute all unit tests defined in unitTests folder:

```bash
npm run unit-test
```

Use the following command to check test coverage:

```bash
npx jest --collectCoverage
```

## Integration Testing

OpenReview Web uses [TestCafe](https://devexpress.github.io/testcafe/) to run
end-to-end tests of the UI. To run the test suite, first start openreview-api-v1 and openreview-api
in test mode:

```bash
npm run cleanStart
```

Then create a production build of the frontend using the proper value for the `$SUPER_USER`
env var and start the Next.js server:

```bash
NODE_ENV=production SUPER_USER=openreview.net npm run build
NODE_ENV=production SUPER_USER=openreview.net npm run start
```

Finally, run the tests:

```bash
npm run test
```

To run specific tests, pass the path of the test file to testcafe. For example:

```bash
testcafe chrome tests/e2e_1/profilePage.ts
```

Note that you may need to run the special setup test before running specific tests
if the test data has not already been generated:

```bash
npm run test-setup
```

## Deployment

To create an optimized production build of the application make sure `NODE_ENV` is
set to `production` and run:

```bash
npm run build
```

To start the production server running execute:

```bash
npm run start
```

## License

Openreview-web is open source under the GNU Affero General Public License Version 3 (AGPLv3) or any later version. The full license [can be found here](https://github.com/openreview/openreview-web/blob/master/LICENSE.md). The code is provided "as is" without warranty of any kind.

Copyright © 2019-2026 OpenReview
