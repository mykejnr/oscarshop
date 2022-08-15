import {render, fireEvent, screen, waitFor } from '@testing-library/react'
import { RecoilRoot } from "recoil";
import { act } from 'react-dom/test-utils';
import { Router, Routes, Route } from 'react-router-dom';
import { Provider } from 'react-redux';
import {setupServer} from 'msw/node'
import { rest } from 'msw';
import WS from 'jest-websocket-mock'

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
import { TOrder } from '../typedefs/order';
import { IPaymentMethod, IShippingMethod, TFormSection } from '../typedefs/checkout';


const server = setupServer()

beforeAll(() => {
    server.listen()
    const url = `ws://${window.location.host}/wbs/pay/`
    const ws = new WS(url)
})

afterAll(() => {
    WS.clean()
})

const getShipData = (): IShippingMethod[] => ([
    {code: 'noshipping', name: 'firstname', description: 'first desc', price: 23.3},
    {code: 'shippingreq', name: 'secname', description: 'sec desc', price: 33.3},
])

const getPayData = (): IPaymentMethod[] => ([
    {label: 'momo', name: 'MTN MOMO', description: 'mobile money', icon: 'momo.jpg'},
    {label: 'vfcash', name: 'VF Cash', description: 'voda cash', icon: 'vfc.jpg'},
])

beforeEach(() => {
    store.dispatch(resetState())
    jest.restoreAllMocks()
    server.use(
        rest.post(getApi('checkout'), (req, res, ctx) => {
            return res(ctx.json(getOrder()))
        }),
        rest.post(getApi('shippingMethods'), (req, res, ctx) => {
            return res(ctx.json(getShipData()))
        }),
        rest.post(getApi('paymentMethods'), (req, res, ctx) => {
            return res(ctx.json(getPayData()))
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
        <RecoilRoot>
            <Router location={url} navigator={history}>
                <Routes>
                    <Route path='/checkout' element={<Checkout />}/>
                    <Route path='/order/:uuid/:token' element={<div data-testid='test-order'></div>}/>
                </Routes>
            </Router>
        </RecoilRoot>
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
    items: 3,
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
    anonymous: {
        uuid: '2SDDRDJKLxdOIi98',
        token: 'EKKE@DDERETKOOWKD'
    }
})


const populateForm = async (section: TFormSection = 'review') => {
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
    const shipmethod = (await screen.findAllByRole('radio'))[0]
    userEvent.click(shipmethod)
    if (section === 'ship_method') return

    // next section - payment method
    fireEvent.click(buttonElem)
    const paymethod = (await screen.findAllByRole('radio'))[0]
    // const paymethod = document.getElementsByName('payment_method')[0]
    userEvent.click(paymethod)
    if (section === 'pay_method') return

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


test("Should clear basket from store after checkout - Integration", async () => {
    jest.spyOn(request_utils, 'submitForm').mockImplementation(
        ({data, dispatch}) => new Promise((rs, rj) => {
            rs({ok: true, response_data: getOrder(), status: 200})
        })
    )
    const cartSpy = jest.spyOn(cart_reduder, 'clearCart')

    renderCheckoutPage()
    await populateForm()
    await act(() => fireEvent.click(screen.getByTestId('button-spinner')) as never)

    expect(cartSpy).toBeCalled()
})


test("Should render shipping address errors if checkout fails - Ingegration", async () => {
    const err_msg = 'Error - Firstname is required'
    jest.spyOn(request_utils, 'submitForm').mockImplementation(
        ({data, dispatch}) => new Promise((rs, rj) => {
            rs({
                ok: false,
                status: 500,
                errors: {
                    shipping_address: {first_name: [err_msg]}
                }
            })
        })
    )
    const cartSpy = jest.spyOn(cart_reduder, 'clearCart')

    renderCheckoutPage()
    await populateForm()
    await act(() => fireEvent.click(screen.getByTestId('button-spinner')) as never)

    await waitFor(() => screen.findByText(err_msg))
})


test("Should request and render shipping methods on mount - Integration", async () => {
    renderCheckoutPage()
    await populateForm('ship_method')
    const options = screen.getAllByRole('radio')
    const option1 = options[0] as HTMLInputElement

    expect(option1.value).toBe(getShipData()[0].code)
    expect(options.length).toBe(getShipData().length)
})


test("Should request and render payment methods on mount - Integration", async () => {
    renderCheckoutPage()
    await populateForm('pay_method')
    const options = screen.getAllByRole('radio')
    const option1 = options[0] as HTMLInputElement

    expect(option1.value).toBe(getPayData()[0].label)
    expect(options.length).toBe(getPayData().length)
})


test("Should render errors if shipping methods request fails - Integration", async () => {
    server.use(
        rest.post(getApi('shippingMethods'), (req, res, ctx) => res(ctx.status(599)))
    )
    renderCheckoutPage()
    const buttonElem = screen.getByTestId('chonext')

    // next section - shipping method
    fireEvent.click(buttonElem)

    await screen.findByText("Fetching items failed. Please contact customer support if problem persists.")
})


test("Should render errors if payment methods request fails - Integration", async () => {
    server.use(
        rest.post(getApi('paymentMethods'), (req, res, ctx) => res(ctx.status(599)))
    )
    renderCheckoutPage()
    const buttonElem = screen.getByTestId('chonext')

    // next section - shipping method
    fireEvent.click(buttonElem)
    // next section - payment method
    fireEvent.click(buttonElem)

    await screen.findByText("Fetching items failed. Please contact customer support if problem persists.")
})


test("Should refetch if shipping methods on request fail - Integration", async () => {
    server.use(
        rest.post(getApi('shippingMethods'), (req, res, ctx) => res(ctx.status(599)))
    )
    renderCheckoutPage()
    const buttonElem = screen.getByTestId('chonext')

    // next section - shipping method
    fireEvent.click(buttonElem)
    const refethBtn = await screen.findByTestId('failed-retry')
    server.use(
        rest.post(getApi('shippingMethods'), (req, res, ctx) => res(ctx.json(getShipData())))
    )

    await act(() => fireEvent.click(refethBtn) as never)

    const options = await screen.findAllByRole('radio')
    const option1 = options[0] as HTMLInputElement

    expect(option1.value).toBe(getShipData()[0].code)
    expect(options.length).toBe(getShipData().length)
})


test("Should refetch if payent methods on request fail - Integration", async () => {
    server.use(
        rest.post(getApi('paymentMethods'), (req, res, ctx) => res(ctx.status(599)))
    )
    renderCheckoutPage()
    const buttonElem = screen.getByTestId('chonext')

    // next section - shipping method
    fireEvent.click(buttonElem)
    // next section - payment method
    fireEvent.click(buttonElem)

    const refethBtn = await screen.findByTestId('failed-retry')
    server.use(
        rest.post(getApi('paymentMethods'), (req, res, ctx) => res(ctx.json(getPayData())))
    )

    await act(() => fireEvent.click(refethBtn) as never)

    const options = await screen.findAllByRole('radio')
    const option1 = options[0] as HTMLInputElement

    expect(option1.value).toBe(getPayData()[0].label)
    expect(options.length).toBe(getPayData().length)
})


test("Should show payment request page after successful order", async () => {
    jest.spyOn(request_utils, 'submitForm').mockImplementation(
        ({data, dispatch}) => new Promise((rs, rj) => {
            rs({ok: true, response_data: getOrder(), status: 200})
        })
    )

    renderCheckoutPage()
    await populateForm()
    await act(() => fireEvent.click(screen.getByTestId('button-spinner')) as never)

    await screen.findByText("Make Payment")
})