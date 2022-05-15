import { CombinedState, combineReducers } from 'redux';
import { createReducer, createSlice } from '@reduxjs/toolkit';
import { CATALOGUE, DATA_RESET_STATE } from "../constants/action-types";
import { getProducts } from "../actions";
import { cartReducer } from './cart_reducer';
import { userReducer } from './user_reducer';
import uiReducer from './ui_reducer';


const globalState = {
    product_types: [
        {
            id: 1,
            name: 'Bag',
        },
        {
            id: 2,
            name: 'Dresses',
        },
        {
            id: 3,
            name: 'Suite',
        },
        {
            id: 4,
            name: 'Shoes',
        },
        {
            id: 5,
            name: 'Slippers',
        },
    ],
    categories: [
        {
            id: 1,
            name: 'Ladies'
        },
        {
            id: 2,
            name: 'Official'
        },
        {
            id: 3,
            name: 'School'
        },
        {
            id: 4,
            name: 'Casual'
        },
        {
            id: 5,
            name: 'Kids'
        },
        {
            id: 6,
            name: 'Weddings'
        },
        {
            id: 7,
            name: 'Nighties'
        },
        {
            id: 8,
            name: 'Underwares'
        },
    ],

}


const globalReducer = createReducer(globalState, (builder) => {
  builder
    .addDefaultCase(() => globalState)
})


const productListingSlice = createSlice({
  name: CATALOGUE,
  initialState: {},
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(getProducts.fulfilled, (state, action) => {
      return action.payload;
    });
  },
})


const _combinedReducer = combineReducers({
  cart: cartReducer,
  products: productListingSlice.reducer,
  global: globalReducer,
  ui: uiReducer,
  user: userReducer,
})

const rootReducer = (state: any, action: any) => {
    if (action.type === DATA_RESET_STATE) {
        state = {}
    }
    return _combinedReducer(state, action);
}


export default rootReducer