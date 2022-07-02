import {render, fireEvent, screen, waitFor } from '@testing-library/react'
import { act } from 'react-dom/test-utils';
import { Router, Routes, Route } from 'react-router-dom';
import { Provider } from 'react-redux';
import {setupServer} from 'msw/node'
import { rest } from 'msw';

import { resetState } from '../actions';
import * as cart_reduder from '../reducers/cart_reducer';
import store from "../store/index";

import { getApi } from '../api';
import * as checkout_utils from '../utils/requests/checkout'
import * as http_utils from '../utils/http'
import * as request_utils from '../utils/requests'
import Checkout from '../routes/Checkout';
import { createMemoryHistory } from 'history';
import userEvent from '@testing-library/user-event';
import { TOrder } from '../routes/Order';


const server = setupServer()

beforeAll(() => {
    server.listen()
})

beforeEach(() => {
    store.dispatch(resetState())
    jest.restoreAllMocks()
    server.use(
        rest.post(getApi('checkout'), (req, res, ctx) => {
            return res(ctx.json(getOrder()))
        }),
    )
})
afterEach(() => server.resetHandlers())
afterAll(() => server.close())


const renderCheckoutPage = () => {
    const history = createMemoryHistory()
    const url = '/checkout'
    history.push(url)

    return [history, render(
        <Provider store={store}>
            <Router location={url} navigator={history}>
                <Routes>
                    <Route path='/checkout' element={<Checkout />}/>
                    <Route path='/order/:uuid/:token' element={<div data-testid='test-order'></div>}/>
                </Routes>
            </Router>
        </Provider>
    )]
}


const getCheckoutData = () => ({
    guest_email: 'mykejnr4@gmail.com',
    shipping_method: 'free_shipping',
    payment_method: 'momo',
    shipping_address: {
        first_name: 'Michael',
        last_name: 'Mensah',
        state: 'Ashanti',
        line4: 'Obuasi Kunka',
        line1: 'Obuasi',
        postcode: '+233',
        phone_number: '248352555',
        country: 'GH',
        notes: 'Notes to the deliverer',
    }
})


const getOrder = (): TOrder => ({
    url: '/api/path/to/order/',
    number: '10003',
    basket: 'path/to/basket',
    user: '/path/to/user/',
    currency: 'GHS',
    total_excl_tax: 33.33,
    total_incl_tax: 36.33,
    shipping_excl_tax: 2.00,
    shipping_incl_tax: 3.00,
    shipping_method: 'free-shipping',
    shipping_code: 'code-for-shipping',
    status: 'SHIPPED',
    guest_email: 'mykejnr4@gmail.com',
    date_placed: '06/06/2022',
    anonnymous: {
        uuid: '2SDDRDJKLxdOIi98',
        token: 'EKKE@DDERETKOOWKD'
    }
})


const populateForm = () => {
    // const paymethod = screen.getByLabelText('payment_method')
    const sa = getCheckoutData().shipping_address
    const buttonElem = screen.getByTestId('chonext')

    // enter values for shipping method
    Object.keys(sa).forEach((key) => {
        const elem = document.getElementsByName(`shipping_address.${key}`)[0]
        fireEvent.change(elem, {target: {value: sa[key as keyof typeof sa]}})
    })

    // next section - shipping method
    fireEvent.click(buttonElem)
    const shipmethod = document.getElementsByName('shipping_method')[0]
    userEvent.click(shipmethod)

    // next section - payment method
    fireEvent.click(buttonElem)
    const paymethod = document.getElementsByName('payment_method')[0]
    userEvent.click(paymethod)

    // next section - payment submit
    fireEvent.click(buttonElem)
}


test("requestCheckout() - Should return ok when successefull", async () => {
    const res = await checkout_utils.requestCheckout(getCheckoutData(), store.dispatch)
    expect(res.ok).toBeTruthy()
});

test("requestCheckout() - Should invoke 'post' with rigth args", async () => {
    const postMock = jest.spyOn(http_utils, 'post')
    await checkout_utils.requestCheckout(getCheckoutData(), store.dispatch)

    expect(postMock).toHaveBeenCalledWith({
        url: getApi('checkout'),
        ignore_errors: [400],
        dispatch: store.dispatch,
        data: getCheckoutData()
    })
});

test("reqeustCheckout() - Should return errors on failure", async () => {
    const errs = {
        shipping_method: ['Shipping method not applicable']
    }
    server.use(
        rest.post(getApi('checkout'), (req, res, ctx) => {
            return res(ctx.json(errs), ctx.status(400))
        })
    )
    const res = await checkout_utils.requestCheckout(getCheckoutData(), store.dispatch)

    expect(res.ok).toStrictEqual(false)
    expect(res.errors).toEqual(errs)
});


test("Should display success message after submission - Integration", async () => {
    jest.spyOn(request_utils, 'submitForm').mockImplementation(
        ({data, dispatch}) => new Promise((rs, rj) => {
            rs({ok: true, response_data: getOrder()})
        })
    )

    renderCheckoutPage()
    populateForm()
    await act(() => fireEvent.click(screen.getByTestId('chosubmit')) as never)

    const popupMessage = store.getState().ui.popupMessage as IPopupMessage
    expect(popupMessage.title).toEqual('Order Placed')
    expect(popupMessage.type).toEqual('html')
})


test("Should redirect to order page after checkout - Integration", async () => {
    jest.spyOn(request_utils, 'submitForm').mockImplementation(
        ({data, dispatch}) => new Promise((rs, rj) => {
            rs({ok: true, response_data: getOrder()})
        })
    )

    let history: any
    [history, ] = renderCheckoutPage()
    populateForm()
    await act(() => fireEvent.click(screen.getByTestId('chosubmit')) as never)

    const anm = getOrder().anonnymous
    expect(history.location.pathname).toBe(`/order/${anm?.uuid}/${anm?.token}`)
})


test("Should clear basket from store after checkout - Integration", async () => {
    jest.spyOn(request_utils, 'submitForm').mockImplementation(
        ({data, dispatch}) => new Promise((rs, rj) => {
            rs({ok: true, response_data: getOrder()})
        })
    )
    const cartSpy = jest.spyOn(cart_reduder, 'clearCart')

    renderCheckoutPage()
    populateForm()
    await act(() => fireEvent.click(screen.getByTestId('chosubmit')) as never)

    expect(cartSpy).toBeCalled()
})


test("Should render shipping address errors if checkout fails - Ingegration", async () => {
    const err_msg = 'Error - Firstname is required'
    jest.spyOn(request_utils, 'submitForm').mockImplementation(
        ({data, dispatch}) => new Promise((rs, rj) => {
            rs({
                ok: false,
                errors: {
                    shipping_address: {first_name: [err_msg]}
                }
            })
        })
    )
    const cartSpy = jest.spyOn(cart_reduder, 'clearCart')

    renderCheckoutPage()
    populateForm()
    await act(() => fireEvent.click(screen.getByTestId('chosubmit')) as never)

    await waitFor(() => screen.findByText(err_msg))
})