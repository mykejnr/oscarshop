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
import { ForgotPasswordForm, LoginForm, SignupForm } from '../forms';
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


describe("Fetch user data from api", () => {

    describe("getUser action", () => {

        test("Should update store with user on success", async () => {
            await store.dispatch(getUser())
            const user = store.getState().user
            expect(user.auth).toBeTruthy()
            expect(user.profile).toEqual(fakeUser)
        });

        test("Should not update store with user on failure", async () => {
            server.use(
                rest.get(getApi('user'), (req, res, ctx) => {
                return res(ctx.status(403))
                })
            )

            await store.dispatch(getUser())
            const user = store.getState().user
            expect(user.auth).toBeFalsy()
        });
    });

    describe("Fetch user integration tests", () => {

        test("Should fetch and render user info on mount", async () => {
            const fakeResponse = {
                json: () => Promise.resolve(fakeUser),
                status: 200,
                ok: true,
            }
            const fetchSpy = jest.spyOn(global, "fetch") as jest.Mock
            fetchSpy.mockImplementation(
                () => Promise.resolve({...fakeResponse, clone: () => fakeResponse})
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
        });

        test("Should render no user if request returns 403t", async () => {
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
        });
    });
});


describe("User signup", () => {
    test("Should update store with user info after signup", async () => {
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
    });

    test("Should return server errors for bad request", async () => {
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
    });

    test("Should update store with user - Integrated test", async () => {
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
    });

    test('Should render errors on signup fail', async () => {
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
})

describe("Initiate forgot password", () => {

    describe("requestPasswordReset", () => {

        test("Should return success message", async () => {
            const msg = {
                message: 'Message has been sent to your mail'
            }

            server.use(
                rest.post(getApi('resetPassword'), (req, res, ctx) => {
                    return res(ctx.json(msg))
                })
            )

            const loginData = {email: 'myke@mail.com'}
            const res = await user_utils.requestPasswordReset(loginData, store.dispatch)

            expect(res.ok).toBeTruthy()
            expect(res.response_data?.message).toEqual(msg.message)
        });

        test("Should return errors on failed server validation", async () => {
            const err = {
                email: ['Email incorrect']
            }
            server.use(
                rest.post(getApi('resetPassword'), (req, res, ctx) => {
                    return res(ctx.json(err), ctx.status(400))
                })
            )

            const loginData = {email: 'myke@mail.com'}
            const res = await user_utils.requestPasswordReset(loginData, store.dispatch)

            expect(res.ok).toBeFalsy()
            expect(res.errors).toEqual(err)
        });

        test("Should return errors on 404 email not found", async () => {
            const msg = {
                message: 'No user with this email was found'
            }
            const err = {
                email: [msg.message]
            }
            server.use(
                rest.post(getApi('resetPassword'), (req, res, ctx) => {
                    return res(ctx.json(msg), ctx.status(404))
                })
            )

            const reqData = {email: 'myke@mail.com'}
            const res = await user_utils.requestPasswordReset(reqData, store.dispatch)

            expect(res.ok).toBeFalsy()
            expect(res.errors).toEqual(err)
        });
    })

    describe("Initiate forgot password - integraion test", () => {

        test("Should update store with success message", async () => {
            const data = {email: 'myke@mail.com'};
            const msg = {
                message: 'Message has been sent to your mail'
            }
            server.use(
                rest.post(getApi('resetPassword'), (req, res, ctx) => {
                    return res(ctx.json(msg))
                })
            )
            jest.spyOn(user_utils, 'requestPasswordReset').mockImplementation(
                (data, dispatch) => new Promise((rs, rj) => {
                    rs({ok: true, response_data: msg})
                })
            )
            render(
                <Provider store={store}>
                    <ForgotPasswordForm />
                </Provider>
            )

            const value = data.email
            fireEvent.change(screen.getByPlaceholderText('Email'),{target: {value}})

            const elem = screen.getByTestId('genform-submit')
            await act(() => fireEvent.click(elem) as never)

            const U = store.getState().ui
            expect(U.popupMessage).toEqual(msg.message)
        });

        test("Should render errors on email not found", async () => {
            const data = {email: 'myke@mail.com'};
            const msg = {
                message: 'No user with the provided email'
            }
            server.use(
                rest.post(getApi('resetPassword'), (req, res, ctx) => {
                    return res(ctx.json(msg), ctx.status(404))
                })
            )
            jest.spyOn(user_utils, 'requestPasswordReset').mockImplementation(
                (data, dispatch) => new Promise((rs, rj) => {
                    rs({ok: false, errors: {email: [msg.message]}})
                })
            )
            render(
                <Provider store={store}>
                    <ForgotPasswordForm />
                </Provider>
            )

            const value = data.email
            fireEvent.change(screen.getByPlaceholderText('Email'),{target: {value}})

            const elem = screen.getByTestId('genform-submit')
            await act(() => fireEvent.click(elem) as never)

            const U = store.getState().ui
            const errElem = screen.getByTestId('field-error')

            expect(errElem.textContent).toEqual(msg.message)
        });
    });
})