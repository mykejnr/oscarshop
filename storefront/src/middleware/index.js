import { CART_ADD_ITEM } from "../constants/action-types"
import { updateCartItem  } from "../actions"


export const updateCartItemMiddleware = ({getState, dispatch}) => {
    return next => {
        return action => {
            const product = action.payload;
            if (action.type === CART_ADD_ITEM) {
                // if item is already added to the cart dispatch an action with the item's
                // index (posision), in the cart
                for (const [index, cart_product] of getState().cart.entries()) {
                    if (cart_product.id === product.id) {
                        return dispatch(updateCartItem({cart_index: index}))
                    }
                }
            }
            return next(action)
        }
    }
}