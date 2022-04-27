import { combineReducers } from 'redux';
import { createReducer, createSlice } from '@reduxjs/toolkit';
import { CATALOGUE, DATA_RESET_STATE } from "../constants/action-types";
import { addToCart, getProducts, resetState, updateCartItem } from "../actions";


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


const cartReducer = createReducer([], (builder) => {
  builder
    .addCase(addToCart, (state, action) => {
        const product = {...action.payload, quantity: 1};
        state.unshift(product)
    })
    .addCase(updateCartItem, (state, { payload }) => {
        // add +1 to the product at index "payload.cart_index"
        ++state[payload.cart_index].quantity;
    })
    .addDefaultCase((state) => state)
});


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
})

export default (state, action) => {
    if (action.type === DATA_RESET_STATE) {
        state = {}
    }
    return _combinedReducer(state, action);
}