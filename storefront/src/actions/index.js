import {CART_ADD_ITEM, CART_FETCH_PRODUCTS, CART_UPDATE_ITEM} from '../constants/action-types'

export const addToCart = (payload) => (
    {
        type: CART_ADD_ITEM,
        payload
    }
);


export const updateCartItem = (payload) => {
    console.log(payload);
    return {
        type: CART_UPDATE_ITEM,
        payload
    }
};


export const getProducts = () => {
    return (dispatch) => {
        return fetch("http://127.0.0.1:8000/api/products/")
            .then(response => response.json())
            .then(json => dispatch({type: CART_FETCH_PRODUCTS, payload: json}))
    }
}