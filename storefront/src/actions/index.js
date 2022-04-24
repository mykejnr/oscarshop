import { createAction, createAsyncThunk } from "@reduxjs/toolkit";
import {CART_ADD_ITEM, CART_UPDATE_ITEM, CATALOGUE_FETCH_PRODUCTS} from '../constants/action-types'


export const addToCart = createAction(CART_ADD_ITEM);
export const updateCartItem = createAction(CART_UPDATE_ITEM);

export const getProducts = createAsyncThunk(CATALOGUE_FETCH_PRODUCTS, () => {
    return fetch("http://127.0.0.1:8000/api/products/")
            .then(response => response.json())
            .then(json => json)
});