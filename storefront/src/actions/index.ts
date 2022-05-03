import { createAction, createAsyncThunk } from "@reduxjs/toolkit";
import {CART_ADD_ITEM, CART_UPDATE_ITEM, CATALOGUE_FETCH_PRODUCTS, DATA_RESET_STATE} from '../constants/action-types'
import { getApi } from "../api";


// export const addToCart = createAction(CART_ADD_ITEM);
export const updateCartItem = createAction(CART_UPDATE_ITEM);
export const resetState = createAction(DATA_RESET_STATE);

export const getProducts = createAsyncThunk(CATALOGUE_FETCH_PRODUCTS, () => {
    return fetch(getApi("products"), {
        credentials: 'include',
    })
    .then(response => response.json())
    .then(json => json)
});

export const addToCart = createAsyncThunk(CART_ADD_ITEM, (product: IProduct) => {
    const url = getApi("basketAdd");
    const data: IBasketAddProducOptions = {
        product_id: product.id,
        quantity: 1
    }

    return fetch(url, {
        method: 'POST',
        credentials: 'include',
        body: JSON.stringify(data),
        headers: {
            'Content-Type': 'application/json',
        }
    })
    .then(response => response.json())
    .then(json => json)
});