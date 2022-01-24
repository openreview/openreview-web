/**
 * Parse component code into a JS object
 *
 * @param {object} group - group object
 * @param {object} user - user object
 * @param {object} args - url query parameters
 * @returns object
 */
export function parseComponentCode(group, user, args) {
  if (!group.component) return null

  try {
    // eslint-disable-next-line no-new-func
    return Function('group', 'user', 'args', `'use strict'; return (${group.component})`)(group, user, args)
  } catch (error) {
    return null
  }
}

/**
 * Generate complete code to run from a basic webfield string
 *
 * @param {object} group - group object
 * @param {object} user - user object
 * @param {object} args - url query parameters
 * @returns string
 */
export function generateWebfieldCode(group, user, args) {
  if (!group.web) return null

  const userOrGuest = user || { id: `guest_${Date.now()}`, isGuest: true }
  const groupObjSlim = { id: group.id }
  return `// Webfield Code for ${groupObjSlim.id}
window.user = ${JSON.stringify(userOrGuest)};
$(function() {
var args = ${JSON.stringify(args)};
var group = ${JSON.stringify(groupObjSlim)};
var document = null;
var window = null;

// TODO: remove these vars when all old webfields have been archived
var model = {
  tokenPayload: function() {
    return { user: user }
  }
};
var controller = {
  get: Webfield.get,
  addHandler: function(name, funcMap) {
    Object.values(funcMap).forEach(function(func) {
      func();
    });
  },
};

$('#group-container').empty();
${group.details?.writable ? 'Webfield.editModeBanner(group.id, args.mode);' : ''}

${group.web}
});
//# sourceURL=webfieldCode.js`
}
