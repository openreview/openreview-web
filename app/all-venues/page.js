'use client'

import { Divider, Flex } from 'antd'
import { useEffect, useState } from 'react'
import VenueListItem from '../(Home)/VenueListItem'
import LoadingSpinner from '../../components/LoadingSpinner'
import api from '../../lib/api-client'
import { deburrString, formatGroupResults, prettyId } from '../../lib/utils'

import styles from './AllVenues.module.scss'

const sortAlpha = (arr) =>
  arr.sort((a, b) => prettyId(a.groupId).localeCompare(prettyId(b.groupId)))

const deburrFirstLetter = (venue) => {
  if (!venue) {
    return ''
  }

  return deburrString(prettyId(venue.groupId).charAt(0), true)
}

const groupVenuesByLetter = (venues) => {
  const groups = []
  venues.forEach((venue) => {
    const letter = deburrFirstLetter(venue)
    const lastGroup = groups[groups.length - 1]
    if (lastGroup && lastGroup.letter === letter) {
      lastGroup.venues.push(venue)
    } else {
      groups.push({ letter, venues: [venue] })
    }
  })
  return groups
}

export default function Page() {
  const [venues, setVenues] = useState(null)

  const getAllVenuesGroups = async () => {
    try {
      const result = await api
        .get('/groups', { id: 'host' })
        .then(formatGroupResults)
        .then(sortAlpha)
        .then(groupVenuesByLetter)

      setVenues(result)
    } catch (error) {
      promptError(error.message)
    }
  }

  useEffect(() => {
    getAllVenuesGroups()
  }, [])

  if (!venues) return <LoadingSpinner />
  return (
    <Flex vertical gap="small">
      <h1>All Venues</h1>
      <Divider style={{ marginTop: 0 }} />
      {venues.map((venuesOfLetter) => (
        <ul className={styles.row} key={venuesOfLetter.letter}>
          {venuesOfLetter.venues.map((venue) => (
            <VenueListItem
              key={venue.groupId}
              groupId={venue.groupId}
              dueDate={venue.dueDate}
            />
          ))}
        </ul>
      ))}
    </Flex>
  )
}
