# OpenReview Web

## E2E Tests (TestCafe)

### Prerequisites

Two OpenReview API instances must be running before executing e2e tests:

- **API1**: runs on port `3000`
- **API2**: runs on port `3001`

API project paths vary by developer. Set them via environment variables:

```sh
export OPENREVIEW_API_V1_DIR=
export OPENREVIEW_API_V2_DIR=
```

The web app must also be running (`npm run dev`).

Set `SUPER_USER=openreview.net` (lowercase) in `.env.local` for tests to work.

### Starting the APIs

Always kill existing API instances on ports 3000/3001 and run a fresh `cleanStart` before running tests — even if APIs appear to be running, they may not be in a clean state. Start API v1 first and wait for it to complete before starting API v2 (v2 depends on v1). Run `npm run cleanStart` in each API project directory. The API is ready when it outputs:

```
Setup Complete!
```

Both API processes must remain running while the web app and TestCafe tests are running. Do not kill them after setup completes.

API startup takes time. When running `cleanStart` in the background, periodically check output and report progress to the user (e.g. "Setting up Venue Request", "Setting up Profile Management", waiting for "Setup Complete!").

### Running Tests

Setup tests must run first before any e2e suite. Test suites: `tests/e2e_1`, `tests/e2e_2`, `tests/e2e_3`. Tests are TypeScript files. Shared helpers and test constants are in `tests/utils/api-helper.js`.

```sh
# Run setup tests first (required before other test suites)
testcafe chrome tests/setup

# Run a specific test suite
testcafe chrome tests/e2e_1

# Run unit tests
npm run unit-test
```

Note: The `npm run test` script uses headless firefox with concurrency/parallelism for CI. For local development, run test suites individually with `chrome` instead.
