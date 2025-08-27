import { useState, useContext, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import WebFieldContext from '../WebFieldContext'
import ErrorAlert from '../ErrorAlert'
import Markdown from '../EditorComponents/Markdown'
import api from '../../lib/api-client'
import { prettyId } from '../../lib/utils'
import useUser from '../../hooks/useUser'
import LoadingSpinner from '../LoadingSpinner'

export default function GroupDirectory({ appContext }) {
  const { entity: group, title, subtitle, description, links } = useContext(WebFieldContext)
  const [childGroupIds, setChildGroupIds] = useState(null)
  const [error, setError] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const { accessToken } = useUser()
  const { setBannerContent } = appContext ?? {}
  const query = useSearchParams()

  useEffect(() => {
    if (query.get('referrer')) {
      setBannerContent({ type: 'referrerLink', value: query.get('referrer') })
    } else if (group.parent) {
      setBannerContent({ type: 'venueHomepageLink', value: group.parent })
    } else {
      setBannerContent({ type: null, value: null })
    }
  }, [query])

  useEffect(() => {
    const loadChildGroups = async () => {
      setIsLoading(true)
      try {
        const { groups } = await api.get('/groups', { parent: group.id }, { accessToken })
        if (groups?.length > 0) {
          setChildGroupIds(
            groups
              .map((g) => g.id)
              .sort((a, b) => {
                // Sort by year in descending order, or if year is not present sort alphabetically
                const yearA = a.match(/.*(\d{4})/)?.[1] ?? 0
                const yearB = b.match(/.*(\d{4})/)?.[1] ?? 0
                if ((!yearA && !yearB) || yearA === yearB) {
                  return prettyId(a).localeCompare(prettyId(b))
                }
                return yearA > yearB ? -1 : 1
              })
          )
        } else {
          setChildGroupIds([])
        }
      } catch (apiError) {
        setError(apiError)
        setChildGroupIds([])
      }
      setIsLoading(false)
    }

    if (links) {
      setChildGroupIds(links)
    } else {
      loadChildGroups()
    }
  }, [group.id])

  return (
    <>
      <div className="venue-header" id="header">
        <h1>{title || prettyId(group.id)}</h1>
        {subtitle && <h3>{subtitle}</h3>}
        {description && <Markdown text={description} />}
      </div>
      {isLoading && <LoadingSpinner />}

      <hr />

      {error && <ErrorAlert error={error} />}

      {childGroupIds && (
        <ul className="list-unstyled venues-list">
          {childGroupIds.length > 0 ? (
            childGroupIds.map((id) => (
              <li key={id}>
                <Link href={id.startsWith('~') ? `/profile?id=${id}` : `/group?id=${id}`}>
                  {prettyId(id)}
                </Link>
              </li>
            ))
          ) : (
            <li>
              <p className="empty-message">No groups found</p>
            </li>
          )}
        </ul>
      )}
    </>
  )
}
