import { createAction, createAsyncThunk } from "@reduxjs/toolkit";
import {CART_UPDATE_ITEM, CATALOGUE_FETCH_PRODUCTS, DATA_RESET_STATE, MESSAGE_NEW, UI_SHOW_DIALOG, UI_SHOW_POPUP, UI_TOGGLE_MINI_CART, UI_TOGGLE_MINI_USER} from '../constants/action-types';
import { getApi } from "../api";
import { TDialogName } from "../dialog/dialog";

export { addToCart, fetchBasket } from "./cart-action"


export const updateCartItem = createAction(CART_UPDATE_ITEM);
export const resetState = createAction(DATA_RESET_STATE);

export const getProducts = createAsyncThunk(CATALOGUE_FETCH_PRODUCTS, () => {
    return fetch(getApi("products"), {
        credentials: 'include',
    })
    .then(response => response.json())
    .then(json => json)
});


export const toggleMiniCart = createAction(UI_TOGGLE_MINI_CART);
export const toggleMiniUser = createAction(UI_TOGGLE_MINI_USER);
export const showDialog = createAction<TDialogName>(UI_SHOW_DIALOG);
export const showPopup = createAction<TPopupMessage>(UI_SHOW_POPUP)

export { getUser } from "./user-action"

export const newMessage = createAction<string>(MESSAGE_NEW)