'use client'

import { useRouter } from 'next/navigation'
import { stringify } from 'query-string'
import AutoCompleteInput from '../../components/AutoCompleteInput'

import legacyNavStyles from '../../styles/components/legacy-bootstrap-nav.module.scss'

export default function NavSearch({ inDrawer = false }) {
  const router = useRouter()

  const handleSearch = (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)
    const query = {}
    formData.forEach((value, name) => {
      query[name] = value
    })
    router.push(`/search?${stringify(query)}`)
  }

  return (
    <form
      role="search"
      onSubmit={handleSearch}
      className={`${legacyNavStyles.navSearchForm}${inDrawer ? ` ${legacyNavStyles.navSearchFormDrawer}` : ''}`}
    >
      <AutoCompleteInput />
      <input name="group" type="hidden" value="all" />
      <input name="content" type="hidden" value="all" />
      <input name="source" type="hidden" value="all" />
    </form>
  )
}
