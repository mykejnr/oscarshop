import { createAsyncThunk } from "@reduxjs/toolkit";
import {CART_ADD_ITEM, CART_FETCH_BASKET } from '../constants/action-types'
import { getApi } from "../api";


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


export const fetchBasket = createAsyncThunk(CART_FETCH_BASKET, () => {
    const url = getApi("basket");

    return fetch(url, {method: 'GET'})
    .then(response => response.json())
    .then(json => json)
})