import {render, fireEvent, screen } from '@testing-library/react'
import { Provider } from 'react-redux';
import {setupServer} from 'msw/node'
import { rest } from 'msw';

import { resetState } from '../../actions';
import store from "../../store/index";

import { getApi } from '../../api';
import { fakeBasket, fakeUser } from '../fakes';
import { act } from 'react-dom/test-utils';
import { LoginForm } from '../../forms';
import { requestLogin } from '../../utils/user';
import { nameToLabel } from '../../utils';
import * as user_utils from '../../utils/user'
import { login } from '../../reducers/user_reducer';


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


test('requestLogin() - Should update store on success', async () => {
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
});

test("requestLogin() - Should return errors on failed server validation", async () => {
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
});

test("requestLogin() - Should return errors on authentication failed", async () => {
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
});

test("Should update store with user on success - Integration", async () => {
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
});

test("Should render errors on login failed - Integration", async () => {
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
});

test("Should reload basket after login", async () => {
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