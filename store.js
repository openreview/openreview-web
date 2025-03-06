'use client'

import { configureStore } from '@reduxjs/toolkit'
import notificationReducer from './notificationSlice'
import bannerReducer from './bannerSlice'

const store = configureStore({
  reducer: {
    notification: notificationReducer,
    banner: bannerReducer,
  },
})

export default store
