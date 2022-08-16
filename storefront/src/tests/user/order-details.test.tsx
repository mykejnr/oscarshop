import { IDetailedOrder, IListedOrder, IOrderLine, IOrdersRequestResults, TOrder } from "../../typedefs/order"
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
import { IShippingAddress } from "../../typedefs/address";
import UserOrder from "../../routes/user/UserOrder";


const getOrder = (): TOrder => ({
    url: '/api/path/to/order/',
    number: '10003',
    basket: 'path/to/basket',
    items: 5,
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
    date_placed: '2022-06-06',
})


const getShipAddress = (): IShippingAddress => ({
  first_name: 'Michael',
  last_name: 'Mensah',
  state: 'Ashanti',
  line4: 'Obuasi Kunka',
  line1: 'Obuasi',
  postcode: '+233',
  phone_number: '248352555',
  country: 'GH',
  notes: 'Notes to the deliverer',
})


const getOrderLine = (): IOrderLine => ({
  id: 1,
  title: 'School bak',
  quantity: 3,
  unit_price_incl_tax: 21,
  unit_price_excl_tax: 20,
  line_price_incl_tax: 63,
  line_price_excl_tax: 60,
  line_price_before_discounts_incl_tax: 63,
  line_price_before_discounts_excl_tax: 60,
  image: '/path/to/image'
})


const getDetailedOrder = (): IDetailedOrder => ({
  ...getOrder(),
  shipping_address: getShipAddress(),
  lines: [getOrderLine(), {...getOrderLine(), id: 3}]
})


const server = setupServer(
  rest.get(getApi('orderDetails', getOrder().number), (req, res, ctx) => {
    return res(ctx.json(getDetailedOrder()))
  })
)
beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())


const renderPage = (history: MemoryHistory = createMemoryHistory()): [MemoryHistory, RenderResult] => {
  const url = '/account/orders/' + getOrder().number
  history.push(url)
  const renderResult = render(
    <Provider store={store}>
    <RecoilRoot>
      <Router location={url} navigator={history}>
        <Routes>
          <Route path='/account/orders/:orderNumber/' element={<UserOrder />}/>
        </Routes>
      </Router>
    </RecoilRoot>
    </Provider>
  )

  return [history, renderResult]
}


test("Should request and render order details", async () => {
  renderPage()
  const lines = await screen.findAllByRole('row')
  expect(lines.length).toBe(getDetailedOrder().lines.length)
  expect(lines[0].children[1].textContent).toBe(getOrderLine().title)
})


test("Should render error on request for other user's order", async () => {
  server.use(
    rest.get(getApi('orderDetails', '10003'), (req, res, ctx) => {
      return res(ctx.status(403)) // status - forbidden
    })
  )
  await act(() => renderPage() as never)
  const errElem = (await screen.findByTestId('failed-retry-container')).children[0]
  expect( errElem.textContent).toBe("An unexpected error occurred.")
})


test("Should render error on requested order not found", async () => {
  const oNumber = '10003'
  server.use(
    rest.get(getApi('orderDetails', oNumber), (req, res, ctx) => {
      return res(ctx.status(404)) // status - forbidden
    })
  )
  await act(() => renderPage() as never)
  const errElem = (await screen.findByTestId('failed-retry-container')).children[0]
  expect( errElem.textContent).toBe(`Sorry! Order #${oNumber} does not exist, or might have been deleted.`)
})


test("Should render error message for all other unknown request error", async () => {
  server.use(
    rest.get(getApi('orderDetails', '10003'), (req, res, ctx) => {
      return res(ctx.status(599)) // status - forbidden
    })
  )
  await act(() => renderPage() as never)
  const errElem = (await screen.findByTestId('failed-retry-container')).children[0]
  expect( errElem.textContent).toBe("Sorry! An unexpected error occurred. We are working to fix this issue.")
})