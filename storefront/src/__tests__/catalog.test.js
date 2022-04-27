import { rest } from 'msw';
import {setupServer} from 'msw/node'
import {render, fireEvent, waitFor, screen} from '@testing-library/react'
import '@testing-library/jest-dom'

import Catalog, { Product } from '../routes/Catalog';
import store from '../store'
import { Provider } from 'react-redux';
import { resetState } from '../actions';


const fakeProducts = {
  count: 2,
  next: null,
  previous: null,
  results: [
    {
      url: "path/to/product/details",
      id: 1,
      title: "Product 1",
      rating: null,
      price: 233.32,
      availability: true,
      is_parent: false,
      image: "path/to/image/url"
    },
    {
      url: "path/to/product/details",
      id: 2,
      title: "Product 1",
      rating: null,
      price: 233.32,
      availability: true,
      is_parent: false,
      image: "path/to/image/url"
    },
  ]
}

const server = setupServer(
  rest.get("http://127.0.0.1:8000/api/products/", (req, res, ctx) => {
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


test("Add product to cart when button clicked", () => {
  const product = fakeProducts.results[1];

  render(
    <Provider store={store}>
      <Product product={product} />
    </Provider>
  )

  fireEvent.click(screen.getByRole("button"))

  const cart = store.getState().cart
  expect(cart.length).toBe(1)
  expect(cart[0].id).toBe(product.id)
})


test("Update quantity product if already in cart", () => {
  const product = fakeProducts.results[1];

  render(
    <Provider store={store}>
      <Product product={product} />
    </Provider>
  )

  // Add product to cart
  fireEvent.click(screen.getByRole("button"))
  // Add it again
  fireEvent.click(screen.getByRole("button"))

  const cart = store.getState().cart
  expect(cart.length).toBe(1)
  expect(cart[0].quantity).toBe(2)
})