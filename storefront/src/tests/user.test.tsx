import {render, fireEvent, screen } from '@testing-library/react'
import { Provider } from 'react-redux';
import {setupServer} from 'msw/node'
import { rest } from 'msw';

import { getUser, resetState } from '../actions';
import store from "../store/index";

import { getApi } from '../api';
import { fakeBasket, fakeUser } from './fakes';
import { act } from 'react-dom/test-utils';
import { MiniButtons } from '../components/header';


const server = setupServer(
    rest.get(getApi('user'), (req, res, ctx) => {
      return res(ctx.json(fakeUser))
    }),
    rest.get(getApi('basket'), (req, res, ctx) => {
            return res(ctx.json(fakeBasket))
    })
)

beforeAll(() => server.listen())
beforeEach(() => {
    store.dispatch(resetState())
    jest.restoreAllMocks()
})
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

const renderHeader = () => (
  render(
    <Provider store={store}>
        <MiniButtons />
    </Provider>
  )
)


test("getUser action 400", async () => {
    await store.dispatch(getUser())
    const user = store.getState().user
    expect(user.auth).toBeTruthy()
    expect(user.profile).toEqual(fakeUser)
})


test("getUser action 403", async () => {
    server.use(
        rest.get(getApi('user'), (req, res, ctx) => {
        return res(ctx.status(403))
        })
    )

    await store.dispatch(getUser())
    const user = store.getState().user
    expect(user.auth).toBeFalsy()

})


test("Fetch and render user info on mount - Integratoin test", async () => {
    const fetchSpy = jest.spyOn(global, "fetch") as jest.Mock
    fetchSpy.mockImplementation(
        () => Promise.resolve({
            json: () => Promise.resolve(fakeUser),
            status: 200,
            ok: true,
        })
    )

    await act(() => Promise.resolve(renderHeader() as never))
    const U = store.getState().user
    
    // user state has been updated
    expect(U.auth).toBeTruthy()

    // show Mini profile info popup
    const btnElem = screen.getByTestId('show-user')
    fireEvent.click(btnElem)

    const username = screen.getByTestId('username')
    expect(username.textContent).toBe(
        `${fakeUser.first_name} ${fakeUser.last_name}`.trim()
    )
})

test("Render no user if request returns 403 - integration test", async () => {
    const fetchSpy = jest.spyOn(global, "fetch") as jest.Mock
    fetchSpy.mockImplementation(
        () => Promise.resolve({
            json: () => Promise.resolve(),
            status: 403,
        })
    )

    await act(() => Promise.resolve(renderHeader() as never))
    const U = store.getState().user
    
    // user state has been updated
    expect(U.auth).toBeFalsy()

    // show Mini profile info popup
    const btnElem = screen.getByTestId('show-user')
    fireEvent.click(btnElem)

    const username = screen.getByTestId('username')
    expect(username.textContent).toBe("Oops!")

})
