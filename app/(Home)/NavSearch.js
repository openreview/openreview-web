'use client'

import { useRouter } from 'next/navigation'
import { stringify } from 'query-string'
import AutoCompleteInput from '../../components/AutoCompleteInput'

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
      className={`or-nav-search-form${inDrawer ? ' or-nav-search-form-drawer' : ''}`}
    >
      <AutoCompleteInput
        inputClassName="or-nav-search-input"
        wrapperClassName="or-nav-search-wrapper"
        feedbackClassName="or-nav-search-feedback"
      />
      <input name="group" type="hidden" value="all" />
      <input name="content" type="hidden" value="all" />
      <input name="source" type="hidden" value="all" />
    </form>
  )
}
