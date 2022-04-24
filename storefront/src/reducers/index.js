import { combineReducers } from 'redux';
import { createReducer, createSlice } from '@reduxjs/toolkit';
import { CATALOGUE } from "../constants/action-types";
import { addToCart, getProducts, updateCartItem } from "../actions";


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
        state.push(product)
    })
    .addCase(updateCartItem, (state, action) => {
        let cart = state;
        const cart_product = cart[action.payload.cart_index]
        const updated_product = {...cart_product, quantity: cart_product.quantity + 1}

        cart[action.payload.cart_index] = updated_product;
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


export default combineReducers({
  cart: cartReducer,
  products: productListingSlice.reducer,
  global: globalReducer,
})