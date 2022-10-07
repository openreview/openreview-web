/* globals _: false */

module.exports = function mkStateManager() {
  var handlers = Object.create(null)
  var state = Object.create(null)

  function addHandler(name, funcMap) {
    var obj = {}
    obj[name] = funcMap
    handlers = _.assign(handlers, obj)

    _.forEach(funcMap, function (f, key) {
      f(state[key])
    })
  }

  function removeHandler(name) {
    handlers = _.omit(handlers, name)
  }

  function removeAllBut(name) {
    var newHandlers = Object.create(null)
    if (name in handlers) {
      newHandlers[name] = handlers[name]
    }

    handlers = newHandlers
  }

  function update(key, val) {
    var obj = Object.create(null)
    obj[key] = val
    state = _.assign(state, obj)

    _.forEach(handlers, function (funcMap) {
      if (funcMap[key]) {
        funcMap[key](val)
      }
    })
  }

  function has(key) {
    return _.has(state, key)
  }

  function get(key) {
    return _.cloneDeep(state[key])
  }

  function keys() {
    return _.keys(state)
  }

  function clean() {
    state = Object.create(null)
  }

  return {
    addHandler: addHandler,
    removeHandler: removeHandler,
    removeAllBut: removeAllBut,
    update: update,
    has: has,
    get: get,
    keys: keys,
    clean: clean,
  }
}
