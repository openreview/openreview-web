/* eslint-disable arrow-body-style */
import {
  useContext,
} from 'react'
import withError from '../../components/withError'
import UserContext from '../../components/UserContext'
import { auth } from '../../lib/auth'

const Assignments = ({
  props,
}) => {
  return <table>123</table>
}

Assignments.getInitialProps = async (context) => {
  if (!context.query.group && !context.query.venue) {
    return { statusCode: 404, message: 'Could not list generated assignments. Missing parameter group.' }
  }
  if (!context.query.group && context.query.venue) {
    context.res.writeHead(301, { Location: `/assignments?group=${context.query.venue}` })
    context.res.end()
  }
  return {}
}

export default withError(Assignments)
