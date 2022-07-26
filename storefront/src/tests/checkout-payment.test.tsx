import {render, fireEvent, screen, waitFor } from '@testing-library/react'
import { RecoilRoot } from "recoil";
import { Router, Routes, Route } from 'react-router-dom';
import { Provider } from 'react-redux';

import store from "../store/index";

import { createMemoryHistory } from 'history';
import WSMock from 'jest-websocket-mock'
import { orderState, PaymentRequest } from '../routes/Checkout'
import userEvent from '@testing-library/user-event';
import { TOrder } from '../typedefs/order';
import { act } from 'react-dom/test-utils';
import { getWsApi } from '../api';


class WS extends WSMock {
  error(code: number = 1000, reason: string = "") {
    act(() => {
      this.server.emit("error", null)
    })
    this.server.close({wasClean: false, code, reason})
  }
}

beforeEach(() => {
  // const url = `ws://${window.location.host}/wbs/pay/`
  // const ws = new WS(url)
})

afterEach(() => {
  WS.clean()
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
    anonymous: {
        uuid: '2SDDRDJKLxdOIi98',
        token: 'EKKE@DDERETKOOWKD'
    }
})


const renderPaymentRequest = () => {
    const history = createMemoryHistory()
    const url = '/checkout'
    history.push(url)

    return [history, render(
        <Provider store={store}>
        <RecoilRoot initializeState={(snap) => snap.set(orderState, getOrder())}>
            <Router location={url} navigator={history}>
                <Routes>
                    <Route path='/checkout' element={<PaymentRequest />}/>
                    <Route path='/order/:uuid/:token' element={<div data-testid='test-order'></div>}/>
                </Routes>
            </Router>
        </RecoilRoot>
        </Provider>
    )]
}

const renderAndPopulate = (phoneNumber?: string) => {
  const rvalue = renderPaymentRequest()
  const inpElem = screen.getAllByRole('textbox')[1]
  fireEvent.change(inpElem, {target: {value: phoneNumber || '0248352555'}})
  return rvalue
}


test("Should validate number", async () => {
  renderPaymentRequest()
  const inpElem = screen.getAllByRole('textbox')[1]
  fireEvent.change(inpElem, {target: {value: '023eerew3'}})

  const btnElem = screen.getByRole('button')
  userEvent.click(btnElem)

  await screen.findByText("Enter a valid phone number. Eg. (0248352555)")
})


test("Should connect websocket", async () => {
  const phNumber = '0503802162'
  const server = new WS(getWsApi('payCheckout'), {jsonProtocol: true})
  renderAndPopulate(phNumber)
  const btnElem = screen.getByRole('button')
  userEvent.click(btnElem)

  await server.connected

  await expect(server).toReceiveMessage({
    order_number: getOrder().number,
    momo_number: Number(phNumber)
  })

  // check status message
  const statMsg =  screen.getByRole('status')
  expect(statMsg.textContent).toEqual("(CONNECTING) Connecting to server...")
})


test("Should report on server status responses", async () => {
  const server = new WS(getWsApi('payCheckout'), {jsonProtocol: true})
  renderAndPopulate()
  const btnElem = screen.getByRole('button')
  userEvent.click(btnElem)

  const client = await server.connected
  await act(() => client.send(JSON.stringify({
      status: 102,
      status_text: 'WAITING',
      message: 'Please check your phone for an authorization prompt for confirmation.'
    })) as never
  )

  // check status message
  const statMsg =  screen.getByRole('status')
  expect(statMsg.textContent).toEqual("(WAITING) Please check your phone for an authorization prompt for confirmation.")
})


test("Should report on successful payment and redirect", async () => {
  const server = new WS(getWsApi('payCheckout'), {jsonProtocol: true});
  let history: any
  [history, ] = renderAndPopulate()
  const btnElem = screen.getByRole('button')
  userEvent.click(btnElem)

  const client = await server.connected
  await act(() => client.send(JSON.stringify({
      status: 200,
      status_text: 'AUTHORIZED',
      message: 'Payment has been authorized. Thank your'
    })) as never
  )

  const popupMessage = store.getState().ui.popupMessage as IPopupMessage
  expect(popupMessage.title).toEqual('Order Successfully Placed.')
  expect(popupMessage.type).toEqual('html')

  const anm = getOrder().anonymous
  expect(history.location.pathname).toBe(`/order/${anm?.uuid}/${anm?.token}`)
})


test("Should should report websocket error event", async () => {
  const server = new WS(getWsApi('payCheckout'), {jsonProtocol: true})
  renderAndPopulate()
  const btnElem = screen.getByRole('button')
  userEvent.click(btnElem)

  await server.connected
  await act(() => server.error(1001) as never)

  // check status message
  const statMsg =  screen.getByRole('status')
  expect(statMsg.textContent).toEqual("(ERROR) Sorry! An unexpected error occured. We will fix this issue shortly.")
})


test("Should should report network connection error event", async () => {
  const server = new WS(getWsApi('payCheckout'), {jsonProtocol: true})
  jest.spyOn(navigator, "onLine", "get").mockReturnValueOnce(false)
  renderAndPopulate()
  const btnElem = screen.getByRole('button')
  userEvent.click(btnElem)

  await server.connected
  await act(() => server.error(1001) as never)

  // check status message
  const statMsg =  screen.getByRole('status')
  expect(statMsg.textContent).toEqual("(ERROR) Network connectivity error. Please check your internet connection.")
})


test("Should should report timeout error event", async () => {
  const server = new WS(getWsApi('payCheckout'), {jsonProtocol: true})
  jest.spyOn(navigator, "onLine", "get").mockReturnValueOnce(false)
  renderAndPopulate()
  const btnElem = screen.getByRole('button')
  userEvent.click(btnElem)

  await server.connected
  await act(() => server.error(4008) as never)

  // check status message
  const statMsg =  screen.getByRole('status')
  expect(statMsg.textContent).toEqual("(TIMEOUT) Timed out waiting for payment confirmation.")
})