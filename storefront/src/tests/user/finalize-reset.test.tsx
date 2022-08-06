import {render, fireEvent, screen } from '@testing-library/react'
import { act } from 'react-dom/test-utils';
import { Provider } from 'react-redux';
import {setupServer} from 'msw/node'
import { rest } from 'msw';
import { Router, Routes, Route } from 'react-router-dom';
import { createMemoryHistory } from 'history';

import { resetState } from '../../actions';
import store from "../../store/index";

import { getApi } from '../../api';
import * as user_utils from '../../utils/requests/user'
import * as http_utils from '../../utils/http'
import ResetPassword from '../../routes/ResetPassword';

const server = setupServer()

beforeAll(() => {
    server.listen()
})

beforeEach(() => {
    store.dispatch(resetState())
    jest.restoreAllMocks()
    server.use(
        rest.post(getApi('confirmReset'), (req, res, ctx) => {
            return res()
        }),
    )
})
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

const resetData = {
    uuid: 'xxxxxxxxxxiiiii',
    token: '2233344544555555',
    password: '**************'
}

const getUrl = () => {
    const [uuid, token] = [resetData.uuid, resetData.token]
    const url = `/reset-password/${uuid}/${token}`
    return url
}

const renderResetForm = () => {
    const history = createMemoryHistory()
    const url = getUrl()
    history.push(url)

    return [history, render(
        <Provider store={store}>
            <Router location={url} navigator={history}>
                <Routes>
                    <Route path='/' element={<div data-testid='test-home'></div>}/>
                    <Route path='/reset-password/:uuid/:token' element={<ResetPassword />}/>
                </Routes>
            </Router>
        </Provider>
    )]
}

test("confirmResetPassword() - Should return ok when successefull", async () => {

    const res = await user_utils.confirmPasswordReset(resetData, store.dispatch)
    expect(res.ok).toBeTruthy()
});

test("confirmResetPassword() - Should invoke 'post' with right args", async () => {
    const postMock = jest.spyOn(http_utils, 'post')
    await user_utils.confirmPasswordReset(resetData, store.dispatch)

    expect(postMock).toHaveBeenCalledWith({
        url: getApi('confirmReset'),
        ignore_errors: [400],
        dispatch: store.dispatch,
        data: resetData
    })
});

test("confirmResetPassword() - Should return errors on failure", async () => {
    const errs = {
        token: ['Token incorrect']
    }
    server.use(
        rest.post(getApi('confirmReset'), (req, res, ctx) => {
            return res(ctx.json(errs), ctx.status(400))
        })
    )
    const res = await user_utils.confirmPasswordReset(resetData, store.dispatch)

    expect(res.ok).toStrictEqual(false)
    expect(res.errors).toEqual(errs)
});

test("Should display success message and redirect after reset - Integration", async () => {
    jest.spyOn(user_utils, 'confirmPasswordReset').mockImplementation(
        (data, dispatch) => new Promise((rs, rj) => {
            rs({ok: true, status: 200})
        })
    )


    let history: any, _;
    act(() => {
        [history, _] = renderResetForm()
    })

    const inputEl = screen.getByPlaceholderText('Enter new password')
    const uuidEl = screen.getByPlaceholderText('Uuid')
    const tokenEl = screen.getByPlaceholderText('Token')
    fireEvent.change(inputEl, {target: {value: '*******'}})

    expect(history.location.pathname).toBe(getUrl())

    const btnEl = screen.getByTestId('genform-submit')
    await act(() => fireEvent.click(btnEl) as never)

    const U: iUI = store.getState().ui
    expect(U.popupMessage).toEqual({
        message: 'Password reset successful. You can now login.'
    })

    expect(history.location.pathname).toBe('/')
})