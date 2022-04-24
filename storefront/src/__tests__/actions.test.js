import fetchMock from 'jest-fetch-mock';
fetchMock.enableMocks();

import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';

import { addToCart, getProducts, updateCartItem } from '../actions/index';
import { CART_ADD_ITEM, CART_UPDATE_ITEM } from '../constants/action-types';


const middlewares = [ thunk ];
const mockStore = configureMockStore(middlewares);


describe("addToCart", () => {
    it("Should return correct action type", () => {
        const action = addToCart({});
        expect(action.type).toEqual(CART_ADD_ITEM);
    });

    it("Should add payload to action object", () => {
        const payload = "randomPayload";
        const action = addToCart(payload);
        expect(action.payload).toEqual(payload);
    });
});


describe("updateCartItem", () => {
    it("Should return correct action type", () => {
        const action = updateCartItem({});
        expect(action.type).toEqual(CART_UPDATE_ITEM);
    });

    it("Should add payload to action object", () => {
        const payload = "randomPayload";
        const action = updateCartItem(payload);
        expect(action.payload).toEqual(payload);
    });
});


describe("getProducts", () => {
    beforeEach(() => {
        fetchMock.doMock()
    });

    it("Should fetch at the given url", () => {
        fetchMock.mockOnce()
        const store = mockStore({});

        return store.dispatch(getProducts())
            .then(() => {
                console.log(store.getActions())
                expect(fetch).toHaveBeenCalledWith("/a,sdfdsddjaj/");
            })
    });

    // it("Should return correct action type", () => {
    //     fetch.mockResponse
    //     const store = mockStore({});
    //     return store.dispatch(getProducts())
    //         .then(() => {
    //             console.log(store.getActions())
    //         })
    // })
})