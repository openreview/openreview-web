'use client'

import { configureStore } from '@reduxjs/toolkit'
import rootReducer from './rootSlice'
import notificationReducer from './notificationSlice'

const store = configureStore({
  reducer: {
    root: rootReducer,
    notification: notificationReducer,
  },
})

export default store
