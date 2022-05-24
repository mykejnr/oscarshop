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
import { LoginForm, SignupForm } from '../forms';
import { requestSignup, requestLogin } from '../utils/user';
import { nameToLabel } from '../utils';
import * as user_utils from '../utils/user'
import { login, signup } from '../reducers/user_reducer';


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

const renderLoginForm = () => {
    render(
        <Provider store={store}>
            <LoginForm />
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

const getLoginInit = () => ({
    email: 'mykejnr4@ma.com',
    password: 'PasW$ed'
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

    const elem = screen.getByTestId('genform-submit')
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

    const elem = screen.getByTestId('genform-submit')
    await act(() => fireEvent.click(elem) as never)

    screen.getByText(email_err)
})

test('requestLogin update store on success', async () => {
    const data = getSignupInit()
    const profile = {
        first_name: data.first_name,
        last_name: data.last_name,
        email: data.email,
    }

    server.use(
        rest.post(getApi('login'), (req, res, ctx) => {
            return res(ctx.json(profile))
        })
    )

    const loginData = getLoginInit()
    const res = await requestLogin(loginData, store.dispatch)
    const U = store.getState().user

    expect(U.auth).toBeTruthy()
    expect(U.profile).toEqual(profile)
    expect(res.ok).toBeTruthy()
})

test("requestLogin failed server validation", async () => {
    const err = {
        email: ['Email incorrect']
    }

    server.use(
        rest.post(getApi('login'), (req, res, ctx) => {
            return res(ctx.json(err), ctx.status(400))
        })
    )

    const loginData = getLoginInit()
    const res = await requestLogin(loginData, store.dispatch)

    expect(res.ok).toBeFalsy()
    expect(res.errors).toEqual(err)
})

test("requestLogin authentication failed", async () => {
    const d = {email: 'jame@mail.com', password: 'ddd'}
    const err = {
        message: 'Login Failed. Incorrect email or password.'
    }

    server.use(
        rest.post(getApi('login'), (req, res, ctx) => {
            return res(ctx.json(err), ctx.status(401))
        })
    )

    const res = await requestLogin(d, store.dispatch)

    expect(res.ok).toBeFalsy()
    expect(res.errors).toEqual({'password': [err.message]})
})

test("Login - update store with user - Integrated test", async () => {
    const data = getSignupInit();
    const profile = {
        first_name: data.first_name,
        last_name: data.last_name,
        email: data.email,
    }
    server.use(
        rest.post(getApi('login'), (req, res, ctx) => {
            return res(ctx.json(profile))
        })
    )
    jest.spyOn(user_utils, 'requestLogin').mockImplementation(
        (data, dispatch) => new Promise((rs, rj) => {
            dispatch(login(profile))
            rs({ok: true})
        })
    )
    renderLoginForm();

    const lg = getLoginInit()
    for (const key in lg) {
        const pHolder = nameToLabel(key)
        const value = lg[key as keyof typeof lg]
        fireEvent.change(screen.getByPlaceholderText(pHolder),{target: {value}})
    }

    const elem = screen.getByTestId('genform-submit')
    await act(() => fireEvent.click(elem) as never)

    const U = store.getState().user

    expect(U.auth).toBeTruthy()
    expect(U.profile).toEqual(profile)
})

test("Login - Login failed render errors- Integrated test", async () => {
    const data = getSignupInit();
    const err_msg = 'Not a valid email address'
    const err_res = {
        email: [err_msg]
    }
    server.use(
        rest.post(getApi('login'), (req, res, ctx) => {
            return res(ctx.json(err_res), ctx.status(400))
        })
    )
    jest.spyOn(user_utils, 'requestLogin').mockImplementation(
        (data, dispatch) => new Promise((rs, rj) => {
            rs({ok: false, errors: err_res})
        })
    )
    renderLoginForm();

    const lg = getLoginInit()
    for (const key in lg) {
        const pHolder = nameToLabel(key)
        const value = lg[key as keyof typeof lg]
        fireEvent.change(screen.getByPlaceholderText(pHolder),{target: {value}})
    }

    const elem = screen.getByTestId('genform-submit')
    await act(() => fireEvent.click(elem) as never)

    const U = store.getState().user

    expect(U.auth).toBeFalsy()
    screen.getByText(err_msg)
})

test("Refresh basket after login", async () => {
    const data = getSignupInit();
    const profile = {
        first_name: data.first_name,
        last_name: data.last_name,
        email: data.email,
    }
    server.use(
        rest.post(getApi('login'), (req, res, ctx) => {
            return res(ctx.json(profile))
        })
    )
    server.use(
        rest.get(getApi('basket'), (req, res, ctx) => {
        return res(ctx.json(fakeBasket))
        })
    )
    jest.spyOn(user_utils, 'requestLogin').mockImplementation(
        (data, dispatch) => new Promise((rs, rj) => {
            dispatch(login(profile))
            rs({ok: true})
        })
    )
    renderLoginForm();

    const lg = getLoginInit()
    for (const key in lg) {
        const pHolder = nameToLabel(key)
        const value = lg[key as keyof typeof lg]
        fireEvent.change(screen.getByPlaceholderText(pHolder),{target: {value}})
    }

    const elem = screen.getByTestId('genform-submit')
    await act(() => fireEvent.click(elem) as never)

    const B: IBasket = store.getState().cart

    expect(B).toEqual(fakeBasket)
})