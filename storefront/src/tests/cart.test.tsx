import {render, fireEvent, screen} from '@testing-library/react'
import { Provider } from 'react-redux';
import {setupServer} from 'msw/node'
import { rest } from 'msw';
import { Router, Routes, Route } from 'react-router-dom';
import { createMemoryHistory } from 'history';

import { resetState } from '../actions';
import store from "../store/index";

import MiniCart from '../components/mini-cart';
import { getApi } from '../api';
import { fakeBasket } from './fakes';


const server = setupServer(
    rest.get(getApi('basket'), (req, res, ctx) => {
      return res(ctx.json(fakeBasket))
    })
)

beforeAll(() => server.listen())
beforeEach(() => store.dispatch(resetState()))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

const renderCart = () => (
  render(
    <Provider store={store}>
      <Router location="/" navigator={createMemoryHistory()}>
        <Routes>
          <Route path='/' element={<MiniCart />} />
        </Routes>
      </Router>
    </Provider>
  )
)

test("Should get and render cart items on mount", async () => {
  renderCart();

  expect(
    (await screen.findAllByTestId("mini-cart-item")).length
  ).toBe(fakeBasket.lines.length)
})

test("Should correctly toogle mini cart", () => {
  renderCart()

  // show mini cart
  fireEvent.click(screen.getByTestId("toogle-mini-cart"))
  let state = store.getState()
  expect(state.ui.miniCartVisible).toStrictEqual(true)

  // hide mini cart
  fireEvent.click(screen.getByTestId("toogle-mini-cart"))
  state = store.getState()
  expect(state.ui.miniCartVisible).toStrictEqual(false)
})