import Icon from './Icon'
import { prettyId } from '../lib/utils'

const NoteReaders = ({ readers }) => {
  if (readers.includes('everyone')) {
    return [<Icon name="globe" />, ' ', 'Everyone']
  }

  return readers.map(reader => (
    <span title={reader} data-toggle="tooltip" data-placement="top">
      {prettyId(reader, true)}
    </span>
  )).reduce((accu, elem) => (accu === null ? [elem] : [...accu, ', ', elem]), null)
}

export default NoteReaders
