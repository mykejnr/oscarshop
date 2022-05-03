import { rest } from 'msw';
import {setupServer} from 'msw/node'
import {render, fireEvent, waitFor, screen} from '@testing-library/react'
import '@testing-library/jest-dom'
import { getApi } from '../api';

import Catalog, { Product } from '../routes/Catalog';
import store from '../store'
import { Provider } from 'react-redux';
import { addToCart, resetState } from '../actions';

import { fakeAddToCartResponse, fakeProducts } from './fakes';


const server = setupServer(
  rest.get(getApi('products'), (req, res, ctx) => {
    return res(ctx.json(fakeProducts))
  })
)

beforeAll(() => server.listen())
beforeEach(() => store.dispatch(resetState()))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

const renderCatalog = () => (
  render(
    <Provider store={store}>
      <Catalog />
    </Provider>
  )
)


test("Fetch and displays products", async () => {
  renderCatalog();

  const product_count = fakeProducts.results.count
  expect(
    // screen.getAllByTestId("product").count
    await screen.findAllByTestId("product").count
  ).toBe(product_count)
})

test("Render individual product correctly", async () => {
  const product = fakeProducts.results[1];

  render(
    <Provider store={store}>
      <Product product={product} />
    </Provider>
  )

  expect(screen.getByTitle(product.title)).toBeTruthy();
  expect(screen.getByText(product.title)).toBeTruthy();
  expect(
    screen.getByTestId("product-image")
    .getAttribute('src')
  ).toBe(product.image)
})


test("Add product to cart when button clicked", async () => {
  const product = fakeProducts.results[1];
  fakeAddToCartResponse.line.product.id = product.id

  server.use(
    rest.post(getApi("basketAdd"), (req, res, ctx ) => {
      return res(ctx.json(fakeAddToCartResponse))
    })
  )

  await store.dispatch(addToCart(product))

  const cart = store.getState().cart
  expect(cart.lines.length).toBe(1)
  expect(cart.lines[0].product.id).toBe(product.id)

  expect(cart.status).toBe(fakeAddToCartResponse.status)
  expect(cart.id).toBe(fakeAddToCartResponse.id)
  expect(cart.url).toBe(fakeAddToCartResponse.url)
  expect(cart.total_price).toBe(fakeAddToCartResponse.total_price)
  expect(cart.total_quantity).toBe(fakeAddToCartResponse.total_quantity)
})


test("Update quantity product if already in cart", async () => {
  const product = fakeProducts.results[1];
  fakeAddToCartResponse.line.product.id = product.id

  server.use(
    rest.post(getApi("basketAdd"), (req, res, ctx ) => {
      return res(ctx.json(fakeAddToCartResponse))
    })
  )

  // Add the same product twice
  await store.dispatch(addToCart(product))
  fakeAddToCartResponse.is_line_created = false
  fakeAddToCartResponse.line.quantity = 3
  await store.dispatch(addToCart(product))

  const cart = store.getState().cart
  expect(cart.lines.length).toBe(1)
  expect(cart.lines[0].product.id).toBe(product.id)
  expect(cart.lines[0].quantity).toBe(fakeAddToCartResponse.line.quantity)
})