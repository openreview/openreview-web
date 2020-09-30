# OpenReview Web

[![Next.js CI](https://github.com/openreview/openreview-web/workflows/Next.js%20CI/badge.svg?branch=master)](https://github.com/openreview/openreview-web/actions)

The next-generation web interface to the [OpenReview API](https://github.com/openreview/openreview/),
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

Finally, copy the sample `.env` file and replace the dummy values with the correct
values for your environment:

```bash
cp .env.sample .env
```

## Development

To run the development server, run:

```bash
npm run dev
```

This will watch for any changes and rebuild the page. The OpenReview API server
also has to be running at the same time, and accessible at the URL specified by
the `$API_URL` env var.

After editing any Handlebars template file, make sure to run:

```bash
npm run templates
```

This command compiles all the .hbs files found in the `client/templates` dir and
builds the file client/templates.js which is used by the legacy frontend code.

To check for ESLint errors, run:

```bash
npm run lint
```

## Testing

OpenReview Web uses [TestCafe](https://devexpress.github.io/testcafe/) to run
end-to-end tests of the UI. To run the test suite, first start openreview-api
in test mode:

```bash
NODE_ENV=circleci node scripts/clean_start_app.js
```

Then create a production build of the frontend using the proper value for the `$SUPER_USER`
env var and start the Next.js server:

```bash
SUPER_USER=openreview.net npm run build
npm run start
```

Finally, run the tests:

```bash
npm run test
```

To run specific tests, pass the `-f` option to TestCafe to only run a specific
fixture. For example:

```bash
npm run test -- -f "Invitation page"
```

Any option supported by the TestCafe CLI can be passed in after the "`--`", a full
list of flags can be found in the [TestCafe docs](https://devexpress.github.io/testcafe/documentation/reference/command-line-interface.html#-f-name---fixture-name).

Note that you may need to run the spcial setup test before running specific tests
if the test data has not already been generated:

```bash
npm run test-setup
```

## Deployment

To create an optimized production build of the application run:

```bash
npm run build
```

To start the production server running execute:

```bash
npm run start
```
