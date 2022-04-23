import {
    CART_ADD_ITEM,
    CART_FETCH_PRODUCTS,
    CART_UPDATE_ITEM
} from "../constants/action-types";

const initialState = {
    products: {
        // The shape of the object (json response) we expect
        /**
         * count: 5,
         * next: http//next/page/url,
         * previous: http//previous/page/url,
         * results: [{...product}, {...product}]
         */
        // Since this is an empty object, the next url will be the first page
    },
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
    cart: []
};


const rootReducer = (state = initialState, action) => {
    if (action.type === CART_ADD_ITEM) {
        const product = {...action.payload, quantity: 1};
        return {...state, cart: state.cart.concat(product)}
    }
    if (action.type === CART_UPDATE_ITEM) {
        // Item is already added to the cart, (determined by middle ware),...
        // ...Update the item count in the cart
        // The middleware (updateCartMiddleware) add a paylod {cart_index: i} to
        // this action. We use the index to get the item from the cart, and then
        // updates its quantity
        const cart = state.cart;
        const cart_product = cart[action.payload.cart_index]
        const updated_product = {...cart_product, quantity: cart_product.quantity + 1}

        const i = action.payload.cart_index;
        const new_cart = [...cart.slice(0, i), updated_product, ...cart.slice(i+1)]
        return {...state, cart: new_cart}
    }
    if (action.type === CART_FETCH_PRODUCTS) {
        return {...state, products: action.payload}
    }
    return state
};

export default rootReducer;