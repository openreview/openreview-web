import { useRouter } from 'next/router'

// Returns the page query, or null if the page is not yet hydrated. This is useful
// because router.query returns an empty object while the page is loading, making
// it difficult to know when it is safe to use the query params.
// For more info see https://github.com/vercel/next.js/issues/8259
export default function useQuery() {
  const router = useRouter()

  const hasQueryParams = /\[.+\]/.test(router.route) || /\?./.test(router.asPath)
  const ready = !hasQueryParams || Object.keys(router.query).length > 0

  if (!ready) return null

  return router.query
}
