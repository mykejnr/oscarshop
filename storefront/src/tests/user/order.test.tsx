import { IListedOrder, IOrdersRequestResults } from "../../typedefs/order"
import {render, fireEvent, screen, RenderResult} from '@testing-library/react'
import { rest } from 'msw';
import {setupServer} from 'msw/node'
import { getApi } from "../../api";
import store from "../../store";
import { Provider } from "react-redux";
import { RecoilRoot } from "recoil";
import { act } from "react-dom/test-utils";
import UserOrderList from "../../routes/user/OrderList";
import { Router, Routes, Route } from 'react-router-dom';
import { createMemoryHistory, MemoryHistory } from 'history';
import { fmtDate, strAddress } from "../../utils";


const getOrder = (number: string = '10003'): IListedOrder => ({
  number,
  url: '/api/path/to/order/',
  basket: 'path/to/basket',
  user: '/path/to/user/',
  items: 5,
  currency: 'GHS',
  total_excl_tax: 33.33,
  total_incl_tax: 36.33,
  shipping_excl_tax: 2.00,
  shipping_incl_tax: 3.00,
  shipping_method: 'free-shipping',
  shipping_code: 'code-for-shipping',
  status: 'SHIPPED',
  guest_email: 'mykejnr4@gmail.com',
  date_placed: '2022-06-06',
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


const getOrders = (numbers: string[]): IOrdersRequestResults => {
  return {
    count: numbers.length,
    next: null,
    previous: null,
    results: numbers.map((num) => getOrder(num))

  }
}


const server = setupServer(
  rest.get(getApi('orders'), (req, res, ctx) => {
    return res(ctx.json(([getOrder()])))
  })
)
beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())


const renderOrder = (history: MemoryHistory = createMemoryHistory()): [MemoryHistory, RenderResult] => {
  const url = '/account/orders/'
  history.push(url)
  const renderResult = render(
    <Provider store={store}>
    <RecoilRoot>
      <Router location={url} navigator={history}>
        <Routes>
          <Route path='/account/orders/:orderNumber/' element={<div></div>}/>
          <Route path='/account/orders/' element={<UserOrderList/>}/>
        </Routes>
      </Router>
    </RecoilRoot>
    </Provider>
  )

  return [history, renderResult]
}

test("Should request and render orders on mount", async () => {
  const numbers = ['100034', '1234534']
  server.use(
    rest.get(getApi('orders'), (req, res, ctx) => {
      return res(ctx.json(getOrders(numbers)))
    })
  )
  await act(() => renderOrder() as never)
  const rows = await screen.findAllByTestId('order-row-item')
  expect(rows.length).toEqual(numbers.length)
})


test("Should render cell data correctly", async () => {
  const orders = getOrders(['100034', '1234534']).results
  const order = orders[0]
  server.use(
    rest.get(getApi('orders'), (req, res, ctx) => {
      return res(ctx.json(orders))
    })
  )
  await act(() => renderOrder() as never)
  const row = (await screen.findAllByTestId('order-row-item'))[0]
  expect(row.children[0].textContent).toBe(order.number)
  expect(row.children[1].textContent).toBe(order.status)
  expect(row.children[2].textContent).toBe(String(order.total_incl_tax))
  expect(row.children[3].textContent).toBe(String(order.items))
  expect(row.children[4].textContent).toBe(strAddress(order.shipping_address))
  expect(row.children[5].textContent).toBe(fmtDate(order.date_placed))
})


test("Should navigate to order details page on click", async () => {
  const orders = getOrders(['100034', '1234534']).results
  server.use(
    rest.get(getApi('orders'), (req, res, ctx) => {
      return res(ctx.json(orders))
    })
  )
  
  let history = createMemoryHistory()
  await act(() => renderOrder(history) as never)
  const row = (await screen.findAllByTestId('order-row-item'))[0]

  const anchorElem = row.children[0].children[0]
  await act(() => fireEvent.click(anchorElem) as never)

  expect(history.location.pathname).toBe(`/account/orders/${orders[0].number}`)
})


test("Should indicate loading state on mount", async () => {
  await act(() => renderOrder() as never)
  const alert = screen.getByRole('alert')
  expect(alert.textContent).toBe('Retrieving contents. Just a moment...')
})


test("Should announce empyt order list", async () => {
  server.use(
    rest.get(getApi('orders'), (req, res, ctx) => {
      return res(ctx.status(204)) // 204 - no content
    })
  )
  await act(() => renderOrder() as never)
  const alert = await screen.findByTestId('notify-noorders')
  expect(alert.textContent).toBe("You haven't made any orders.")
})


test("Should report on unexpted unauthenticated user request", async () => {
  server.use(
    rest.get(getApi('orders'), (req, res, ctx) => {
      return res(ctx.status(403)) // 403 - forbidden - user is not logged in
    })
  )
  await act(() => renderOrder() as never)
  const errElem = (await screen.findByTestId('failed-retry-container')).children[0]
  expect( errElem.textContent).toBe("An unexpected error occured. Please contact customer support for assistance.")
})


test("Should report on all other unknown errors", async () => {
  server.use(
    rest.get(getApi('orders'), (req, res, ctx) => {
      return res(ctx.status(599)) // 403 - forbidden - user is not logged in
    })
  )
  await act(() => renderOrder() as never)
  const errElem = (await screen.findByTestId('failed-retry-container')).children[0]
  expect( errElem.textContent).toBe("Sorry! An unexpected error occured.")
})


test("Should allow retry for unknown errors", async () => {
  server.use(
    rest.get(getApi('orders'), (req, res, ctx) => {
      return res(ctx.status(599)) // 403 - forbidden - user is not logged in
    })
  )
  await act(() => renderOrder() as never)
  const errElemBtn = await screen.findByTestId('failed-retry')
  expect(errElemBtn.textContent).toBe('Retry')
})