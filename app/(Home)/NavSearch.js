'use client'

import { useRouter } from 'next/navigation'
import { stringify } from 'query-string'
import AutoCompleteInput from '../../components/AutoCompleteInput'

export default function NavSearch() {
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
      className="navbar-form navbar-left profile-search"
      role="search"
      onSubmit={handleSearch}
    >
      <AutoCompleteInput />
      <input name="group" type="hidden" value="all" />
      <input name="content" type="hidden" value="all" />
      <input name="source" type="hidden" value="all" />
    </form>
  )
}
