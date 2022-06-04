import {render, fireEvent, screen } from '@testing-library/react'
import { act } from 'react-dom/test-utils';
import { Provider } from 'react-redux';
import {setupServer} from 'msw/node'
import { rest } from 'msw';

import { fetchBasket, resetState } from '../../actions';
import store from "../../store/index";

import { getApi } from '../../api';
import * as user_utils from '../../utils/user'
import * as http_utils from '../../utils/http'
import { ChangePasswordForm } from '../../forms';
import { login } from '../../reducers/user_reducer';
import { fakeBasket } from '../fakes';

const server = setupServer()

beforeAll(() => {
    server.listen()
})

beforeEach(() => {
    store.dispatch(resetState())
    jest.restoreAllMocks()
    server.use(
        rest.post(getApi('changePassword'), (req, res, ctx) => {
            return res()
        }),
    )
})
afterEach(() => server.resetHandlers())
afterAll(() => server.close())


const renderForm = () => {
    render(
        <Provider store={store}>
            <ChangePasswordForm />
        </Provider>
    )
}

const getPasswordData = () => ({
    old_password: 'oldPas@red',
    new_password: 'newPassw$#D',
    confirm_password: 'newPassw$#D'
})


test("requestChangePassword() - Should return ok when successefull", async () => {
    const res = await user_utils.requestChangePassword(getPasswordData(), store.dispatch)
    expect(res.ok).toBeTruthy()
});

test("requestChangePassword() - Should invoke 'post' with rigth args", async () => {
    const postMock = jest.spyOn(http_utils, 'post')
    await user_utils.requestChangePassword(getPasswordData(), store.dispatch)

    expect(postMock).toHaveBeenCalledWith({
        url: getApi('changePassword'),
        ignore_errors: [400],
        dispatch: store.dispatch,
        data: getPasswordData()
    })
});

test("reqeustChangePassword() - Should return errors on failure", async () => {
    const errs = {
        old_password: ['Password incorrect']
    }
    server.use(
        rest.post(getApi('changePassword'), (req, res, ctx) => {
            return res(ctx.json(errs), ctx.status(400))
        })
    )
    const res = await user_utils.requestChangePassword(getPasswordData(), store.dispatch)

    expect(res.ok).toStrictEqual(false)
    expect(res.errors).toEqual(errs)
});

test("Should display success message after change - Integration", async () => {
    jest.spyOn(user_utils, 'requestChangePassword').mockImplementation(
        (data, dispatch) => new Promise((rs, rj) => {
            rs({ok: true})
        })
    )

    renderForm()


    const inputOl = screen.getByPlaceholderText('Old password')
    const inputNw = screen.getByPlaceholderText('New password')
    const inputCp = screen.getByPlaceholderText('Confirm password')
    fireEvent.change(inputOl, {target: {value: '*******'}})
    fireEvent.change(inputNw, {target: {value: '######'}})
    fireEvent.change(inputCp, {target: {value: '######'}})


    const btnEl = screen.getByTestId('genform-submit')
    await act(() => fireEvent.click(btnEl) as never)

    const U: iUI = store.getState().ui
    expect(U.popupMessage).toEqual({
      title: "Password change successful",
      message: "You have been logged out. You must log back in."
    })
})

test("Should clear user from store after change - Integration", async () => {
    jest.spyOn(user_utils, 'requestChangePassword').mockImplementation(
        (data, dispatch) => new Promise((rs, rj) => {
            rs({ok: true})
        })
    )

    renderForm()
    store.dispatch(login({
        first_name: '',
        last_name: '',
        email: ''
    }))

    const inputOl = screen.getByPlaceholderText('Old password')
    const inputNw = screen.getByPlaceholderText('New password')
    const inputCp = screen.getByPlaceholderText('Confirm password')
    fireEvent.change(inputOl, {target: {value: '*******'}})
    fireEvent.change(inputNw, {target: {value: '######'}})
    fireEvent.change(inputCp, {target: {value: '######'}})


    const btnEl = screen.getByTestId('genform-submit')
    await act(() => fireEvent.click(btnEl) as never)

    const U: IUser = store.getState().user
    expect(U.auth).toStrictEqual(false)
    expect(U.profile).toStrictEqual(undefined)
})

test("Should clear cart from store after change - Integration", async () => {
    server.use(
        rest.get(getApi('basket'), (req, res, ctx) => {
        return res(ctx.json(fakeBasket))
    })

    )
    jest.spyOn(user_utils, 'requestChangePassword').mockImplementation(
        (data, dispatch) => new Promise((rs, rj) => {
            rs({ok: true})
        })
    )

    renderForm()
    // populate store cart
    await store.dispatch(fetchBasket())

    const inputOl = screen.getByPlaceholderText('Old password')
    const inputNw = screen.getByPlaceholderText('New password')
    const inputCp = screen.getByPlaceholderText('Confirm password')
    fireEvent.change(inputOl, {target: {value: '*******'}})
    fireEvent.change(inputNw, {target: {value: '######'}})
    fireEvent.change(inputCp, {target: {value: '######'}})


    const btnEl = screen.getByTestId('genform-submit')
    await act(() => fireEvent.click(btnEl) as never)

    // expect store cart to be cleared
    const B: IBasket = store.getState().cart
    expect(B.url).toStrictEqual(undefined)
    expect(B.lines).toStrictEqual([])
})