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
import { SignupForm } from '../forms';
import { requestSignup } from '../utils/user';
import { nameToLabel } from '../utils';
import * as user_utils from '../utils/user'
import { signup } from '../reducers/user_reducer';


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

const renderSignupForm = () => {
    render(
        <Provider store={store}>
            <SignupForm />
        </Provider>
    )
}

const getSignupInit = () => ({
    first_name: "James",
    last_name: "Yeboah",
    email: "jamesyeb@gmail.com",
    password: "1233addf!",
    confirm_password: "1233addf!",
})


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


test("Signup - update store with user info after signup", async () => {
    const data = getSignupInit()
    const profile = {
        first_name: data.first_name,
        last_name: data.last_name,
        email: data.email,
    }
    server.use(
        rest.post(getApi('signup'), (req, res, ctx) => {
            return res(ctx.json(profile))
        })
    )

    const res = await requestSignup(data, store.dispatch)
    const U = store.getState().user

    expect(U.auth).toBeTruthy()
    expect(U.profile).toEqual(profile)
    expect(res.ok).toBeTruthy()
})


test("Signup - return server errors for bad request", async () => {
    const data = getSignupInit()
    const errs: ISignupResponseErrors = {
        email: ['The email address is incorrect.']
    }
    server.use(
        rest.post(getApi('signup'), (req, res, ctx) => {
            return res(ctx.json(errs), ctx.status(400))
        })
    )

    const res = await requestSignup(data, store.dispatch)

    expect(res.ok).toBeFalsy()
    expect(res.errors).toEqual(errs)
})

test("Signup - update store with user - Integrated test", async () => {
    const data = getSignupInit();
    const profile = {
        first_name: data.first_name,
        last_name: data.last_name,
        email: data.email,
    }
    server.use(
        rest.post(getApi('signup'), (req, res, ctx) => {
            return res(ctx.json(profile))
        })
    )
    jest.spyOn(user_utils, 'requestSignup').mockImplementation(
        (data, dispatch) => new Promise((rs, rj) => {
            dispatch(signup(profile))
            rs({ok: true})
        })
    )
    renderSignupForm();

    for (const key in data) {
        const pHolder = nameToLabel(key)
        const value = data[key as keyof typeof data]
        fireEvent.change(screen.getByPlaceholderText(pHolder),{target: {value}})
    }

    const elem = screen.getByTestId('signup-submit')
    await act(() => fireEvent.click(elem) as never)

    const U = store.getState().user

    expect(U.auth).toBeTruthy()
    expect(U.profile).toEqual(profile)
})

test('Signup - Render errors on signup fail', async () => {
    const data = getSignupInit();
    const email_err = 'Email not unique'
    const first_err = "Firstname required"

    jest.spyOn(user_utils, 'requestSignup').mockImplementation(
        (data, dispatch) => new Promise((rs, rj) => {
            rs({
                ok: false,
                errors: {
                    'email': [email_err],
                    'first_name': [first_err]
                }
            })
        })
    )

    renderSignupForm()

    for (const key in data) {
        const pHolder = nameToLabel(key)
        const value = data[key as keyof typeof data]
        fireEvent.change(screen.getByPlaceholderText(pHolder),{target: {value}})
    }

    const elem = screen.getByTestId('signup-submit')
    await act(() => fireEvent.click(elem) as never)

    screen.getByText(email_err)
})