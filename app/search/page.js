import { Suspense } from 'react'
import styles from './Search.module.scss'
import serverAuth from '../auth'
import api from '../../lib/api-client'
import Search from './Search'
import FilterForm from './FilterForm'
import { prettyId } from '../../lib/utils'

export const metadata = {
  title: 'Search | OpenReview',
}

export const dynamic = 'force-dynamic'

const sourceOptions = { all: 'All', forum: 'Papers Only', reply: 'Replies Only' }

export default async function page({ searchParams }) {
  const { token } = await serverAuth()
  const query = await searchParams
  const { term, content, group, source } = query
  console.log('search page', query)

  if (!term) throw new Error('Missing search term or query')

  const loadSearchResultsP = api.getCombined(
    '/notes/search',
    {
      term,
      type: 'terms',
      content: content || 'all',
      group: group || 'all',
      source: Object.keys(sourceOptions).includes(source) ? source : 'all',
      sort: 'tmdate:desc',
      limit: 1000,
    },
    null,
    { accessToken: token, resultsKey: 'notes' }
  )

  const groupOptions = await api.get('/groups', { id: 'host' }).then((response) => {
    const groups = response.groups
    const members = groups?.[0]?.members?.map((groupId) => ({
      value: groupId,
      label: prettyId(groupId),
    }))
    return members.sort((a, b) => a.label.localeCompare(b.label))
  })

  return (
    <div className={styles.search}>
      <Suspense>
        <FilterForm
          searchQuery={query}
          sourceOptions={sourceOptions}
          groupOptions={groupOptions}
        />
        <Search loadSearchResultsP={loadSearchResultsP} />
      </Suspense>
    </div>
  )
}
