import { createReducer } from '@reduxjs/toolkit';
import { showDialog, toggleMiniCart } from '../actions';

const initialState: iUI = {
  miniCartVisible: false,
  activeDialog: 'nodialog',
}

const uiReducer = createReducer(initialState, (builder) => {
  builder
  .addCase(toggleMiniCart, (state: iUI) => {
    // just flip the state
    state.miniCartVisible = !state.miniCartVisible
  })
  .addCase(showDialog, (state: iUI, action) => {
    state.activeDialog = action.payload
  })
  .addDefaultCase(() => initialState)
})

export default uiReducer