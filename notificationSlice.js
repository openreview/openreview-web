import { createSlice } from '@reduxjs/toolkit'

const notificationSlice = createSlice({
  name: 'notification',
  initialState: {
    count: null,
  },
  reducers: {
    setNotificationCount: (state, action) => {
      state.count = action.payload
    },
    decrementNotificationCount: (state, action) => {
      const updatedCount = state.count - action.payload
      state.count = updatedCount < 0 ? 0 : updatedCount
    },
  },
})

export const { setNotificationCount, decrementNotificationCount } = notificationSlice.actions
export default notificationSlice.reducer
