'use client'

import { configureStore } from '@reduxjs/toolkit'
import rootReducer from './rootSlice'

const store = configureStore({
  reducer: {
    root: rootReducer,
  },
})

export default store
