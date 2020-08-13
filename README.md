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

To check for ESLint errors, run:

```bash
npm run lint
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
