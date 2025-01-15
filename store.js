'use client'

import { configureStore } from '@reduxjs/toolkit'
import rootReducer from './rootSlice'
import notificationReducer from './notificationSlice'
import bannerReducer from './bannerSlice'

const store = configureStore({
  reducer: {
    // root: rootReducer,
    notification: notificationReducer,
    banner: bannerReducer,
  },
})

export default store
