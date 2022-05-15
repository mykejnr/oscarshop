import { createReducer } from '@reduxjs/toolkit';
import { showDialog, toggleMiniCart, toggleMiniUser } from '../actions';

const initialState: iUI = {
  miniCartVisible: false,
  miniUserVisible: false,
  activeDialog: 'nodialog',
}

const uiReducer = createReducer(initialState, (builder) => {
  builder
  .addCase(toggleMiniCart, (state: iUI) => {
    // just flip the state
    state.miniCartVisible = !state.miniCartVisible
  })
  .addCase(toggleMiniUser, (state) => {
    state.miniUserVisible = !state.miniUserVisible
  })
  .addCase(showDialog, (state: iUI, action) => {
    state.activeDialog = action.payload
  })
  .addDefaultCase(() => initialState)
})

export default uiReducer