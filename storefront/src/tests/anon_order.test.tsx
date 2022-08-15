import Order from "../routes/Order"
import {render, fireEvent, screen} from '@testing-library/react'
import { IAnonymousOrder, IOrderLine, TOrder } from "../typedefs/order"
import { IShippingAddress } from "../typedefs/address"
import { rest } from 'msw';
import {setupServer} from 'msw/node'
import { getApi } from "../api";
import store from "../store";
import { Provider } from "react-redux";
import { RecoilRoot } from "recoil";
import { act } from "react-dom/test-utils";



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


const getAnonOrder = (): IAnonymousOrder => ({
  ...getOrder(),
  shipping_address: getShipAddress(),
  lines: [getOrderLine(), {...getOrderLine(), id: 3}]
})


const server = setupServer(
  rest.post(getApi('anonymousOrder'), (req, res, ctx) => {
    return res(ctx.json(getAnonOrder()))
  })
)
beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())


const renderOrder = () => {
  return render(
    <Provider store={store}>
    <RecoilRoot>
      <Order/>
    </RecoilRoot>
    </Provider>
  )
}

test("Should indicate loading... on mount", () => {
  server.use(
    rest.post(getApi('anonymousOrder'), (req, res, ctx) => {
      return res(ctx.status(500))
    })
  )
  renderOrder()
  const alert = screen.getByRole('alert')
  expect(alert.textContent).toBe('Retrieving contents. Just a moment...')
})


test("Should display order lines", async () => {
  renderOrder()
  const lines = await screen.findAllByRole('row')
  expect(lines.length).toBe(getAnonOrder().lines.length)
  expect(lines[0].children[1].textContent).toBe(getOrderLine().title)
})


test("Shoud report on invalid url", async () => {
  server.use(
    rest.post(getApi('anonymousOrder'), (req, res, ctx) => {
      return res(ctx.status(404))
    })
  )
  await act(() => renderOrder() as never)
  const errElem = (await screen.findByTestId('failed-retry-container')).children[0]
  expect( errElem.textContent).toBe(
    "The url is either incorrect or the order you requested might no longer exist. Please contact customer support for further assistance."
  )
})


test("Should report on wrong token", async () => {
  server.use(
    rest.post(getApi('anonymousOrder'), (req, res, ctx) => {
      return res(ctx.status(403))
    })
  )
  await act(() => renderOrder() as never)
  const errElem = (await screen.findByTestId('failed-retry-container')).children[0]
  expect( errElem.textContent).toBe("The url is incorrect.")
})


test("Should report on failed server data validation.", async () => {
  server.use(
    rest.post(getApi('anonymousOrder'), (req, res, ctx) => {
      return res(ctx.status(400))
    })
  )
  await act(() => renderOrder() as never)
  const errElem = (await screen.findByTestId('failed-retry-container')).children[0]
  expect( errElem.textContent).toBe("Something happened while requesting order. Please try again or contact customer support.")
})


test("Should report on all order errors.", async () => {
  server.use(
    rest.post(getApi('anonymousOrder'), (req, res, ctx) => {
      return res(ctx.status(500))
    })
  )
  await act(() => renderOrder() as never)
  const errElem = (await screen.findByTestId('failed-retry-container')).children[0]
  expect( errElem.textContent).toBe("An unexpected error occured. We are working to fix this issue.")
})


test("Should allow retry on error", async () => {
  server.use(
    rest.post(getApi('anonymousOrder'), (req, res, ctx) => {
      return res(ctx.status(500))
    })
  )
  await act(() => renderOrder() as never)
  const btnElem = (await screen.findByTestId('failed-retry'))

  server.use(
    rest.post(getApi('anonymousOrder'), (req, res, ctx) => {
      return res(ctx.json(getAnonOrder()))
    })
  )

  await act(() => fireEvent.click(btnElem) as never)

  const lines = await screen.findAllByRole('row')
  expect(lines.length).toBe(getAnonOrder().lines.length)
})