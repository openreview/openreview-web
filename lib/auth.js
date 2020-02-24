import Router from 'next/router'
import Cookie from 'js-cookie'

export function login(token) {
  Cookie.set('token', token, { expires: 1 })
  Router.push('/')
}

export function auth(ctx) {
  return null
}
