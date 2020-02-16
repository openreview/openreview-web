import React from 'react'
import Link from 'next/link'

const NavUserMenu = ({ user }) => {
  if (!user) {
    return <li id="user-menu"><Link href="/login"><a>Login</a></Link></li>
  }

  return (
    <li id="user-menu" className="dropdown">
      <a href="#" className="dropdown-toggle" data-toggle="dropdown" role="button" aria-haspopup="true" aria-expanded="false">
        <span>{user.first} {user.middle} {user.last}</span> <span className="caret"></span>
      </a>
      <ul className="dropdown-menu">
        <li>
          <Link href="/profile?id={user.id}"><a>Profile</a></Link>
        </li>
        <li className="visible-sm-block">
          <Link href="/activity"><a>Activity</a></Link>
        </li>
        <li className="visible-sm-block">
          <Link href="/tasks"><a>Tasks</a></Link>
        </li>
        <li role="separator" className="divider hidden-xs"></li>
        <li>
          <Link href="/logout"><a>Logout</a></Link>
        </li>
      </ul>
    </li>
  )
}

export default NavUserMenu
