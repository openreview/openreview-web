import { useDispatch } from 'react-redux'
import { setUser } from '../rootSlice'
import api from '../lib/api-client'

const useAPI = () => {
  const dispatch = useDispatch()

  const dispatchUser = (e) => dispatch(setUser(e))
  const withDispatchUserOption =
    (fn) =>
    (...args) => {
      const options = args[args.length - 1]
      if (typeof options === 'object') {
        options.dispatchUser = dispatchUser
      }
      return fn(...args)
    }

  return {
    ...api,
    get: withDispatchUserOption(api.get),
    post: withDispatchUserOption(api.post),
    put: withDispatchUserOption(api.put),
    delete: withDispatchUserOption(api.delete),
    getCombined: withDispatchUserOption(api.getCombined),
    getAll: withDispatchUserOption(api.getAll),
  }
}

export default useAPI
