import { createSlice } from '@reduxjs/toolkit';
import { addToCart, fetchBasket } from "../actions";
import { CART } from '../constants/action-types';
import { WritableDraft } from 'immer/dist/internal';
import { IBasket, IAddToBasketReturn } from '../typedefs/basket';


// Shape of the reponse data from requesting for a
// basket (cart) from the api
const initialState: IBasket = {
  url: '',
  id: 0,
  status: 'EMPTY',
  total_price: 0,
  total_quantity: 0,
  lines: [] // A list of objects
}


/**
 * Not a reducer per se
 * Helper function: We move logic of adding data
 * to the cart to this function for clarity
 */
const _updateCart = (state: WritableDraft<IBasket>, payload: IAddToBasketReturn) => {
  const basket = payload
  if (!state.id) {
    // there is nothing in the basket
    state.url = basket.url
    state.id = basket.id
    state.status = basket.status
  }
  // update other keys in the basket
  state.total_price = basket.total_price
  state.total_quantity = basket.total_quantity

  if (basket.is_line_created) {
    // if the product (line) is not yet add to thte basket,
    // it was just created, add it to the basket
    state.lines.unshift(basket.line)
  } else {
    // just update the exisiting basket line item
    state.lines.forEach(line => {
      if (line.id === basket.line.id) {
        line.quantity = basket.line.quantity
      }
    });
  }
}


export const cartSlice = createSlice({
  name: CART,
  initialState,
  reducers: {
    clearCart() {
      return initialState
    }
  },
  extraReducers: (builder) => {
    builder.addCase(addToCart.fulfilled, (state, { payload }) => {
      _updateCart(state, payload)
    })
    .addCase(fetchBasket.fulfilled, (state, action) => {
      return action.payload // replace state with new basket
    })
    .addDefaultCase((state) => state)
  },
})


export const { clearCart } = cartSlice.actions
export const cartReducer = cartSlice.reducer