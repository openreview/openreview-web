'use client'

import { configureStore } from '@reduxjs/toolkit'
import notificationReducer from './notificationSlice'
import bannerReducer from './bannerSlice'
import versionReducer from './versionSlice'

const store = configureStore({
  reducer: {
    notification: notificationReducer,
    banner: bannerReducer,
    version: versionReducer,
  },
})

export default store
