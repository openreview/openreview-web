import { useEffect, useRef, useState } from 'react'
import { orderBy } from 'lodash'
import { motion } from 'framer-motion'
import dayjs from 'dayjs'
import useUser from '../../hooks/useUser'
import api from '../../lib/api-client'
import { inflect } from '../../lib/utils'
import Icon from '../Icon'

const OtherVersions = ({ note }) => {
  const { accessToken, isRefreshing } = useUser()
  const [otherVersions, setOtherVersions] = useState(null)
  const containerRef = useRef(null)

  const loadOtherVersions = async () => {
    try {
      const result = await api.get(
        '/notes',
        {
          paperhash: note.content.paperhash.value,
        },
        { accessToken }
      )

      const otherNoteVersions = orderBy(
        result.notes.flatMap((p) => {
          if (!p.content?.venue?.value) return []
          return {
            ...p,
            privatelyRevealed: !note.readers.includes('everyone'),
          }
        }),
        [(p) => p.pdate ?? p.cdate],
        'desc'
      )
      setOtherVersions(otherNoteVersions)
    } catch (_) {
      /* empty */
    }
  }

  useEffect(() => {
    if (!note?.content?.paperhash?.value || isRefreshing) return
    loadOtherVersions()
  }, [note?.id, isRefreshing])

  if (!otherVersions?.length || otherVersions.length === 1) return null

  return (
    <motion.div
      ref={containerRef}
      initial={{ height: 0, overflow: 'hidden' }}
      animate={{ height: 'auto' }}
      transition={{
        height: { duration: 0.25, ease: 'easeIn' },
      }}
      onAnimationComplete={() => {
        if (containerRef.current) containerRef.current.style.overflow = 'visible'
      }}
    >
      <div className="btn-group">
        <button
          type="button"
          className="btn btn-xs dropdown-toggle"
          data-toggle="dropdown"
          aria-haspopup="true"
          aria-expanded="false"
        >
          {otherVersions.length} {inflect(otherVersions.length, 'Version', 'Versions')}{' '}
          <span className="caret" />
        </button>
        <ul className="dropdown-menu">
          {otherVersions?.map((otherVersionNote) => (
            <li
              key={otherVersionNote.id}
              className={otherVersionNote.id === note.id ? 'disabled' : undefined}
            >
              <a href={`/forum?id=${otherVersionNote.id}`}>
                {otherVersionNote.privatelyRevealed && (
                  <Icon
                    name="eye-close"
                    extraClasses="mr-2"
                    tooltip="Privately revealed to you"
                  />
                )}
                {otherVersionNote.content.venue.value} (
                {dayjs(otherVersionNote.pdate ?? otherVersionNote.cdate).format('LL')})
              </a>
            </li>
          ))}
        </ul>
      </div>
    </motion.div>
  )
}

export default OtherVersions
