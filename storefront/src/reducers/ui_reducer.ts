import { createReducer } from '@reduxjs/toolkit';
import { toggleMiniCart } from '../actions';

const initialState = {
  miniCartVisible: false,
}

const uiReducer = createReducer(initialState, (builder) => {
  builder
  .addCase(toggleMiniCart, (state: iUI, action) => {
    // just flip the state
    state.miniCartVisible = !state.miniCartVisible
  })
  .addDefaultCase(() => initialState)
})

export default uiReducer