import React from 'react';
import {render, fireEvent, screen, waitFor } from '@testing-library/react'
import { act } from 'react-dom/test-utils';
import { Provider } from 'react-redux';
import {setupServer} from 'msw/node'
import { rest } from 'msw';
import { Router, Routes, Route } from 'react-router-dom';
import { createMemoryHistory } from 'history';

import { resetState } from '../../actions';
import store from "../../store/index";

import { getApi } from '../../api';
import * as user_utils from '../../utils/user'
import * as http_utils from '../../utils/http'
import ActivateEmailPage from '../../routes/ActivateEmail';
import * as activate_page from '../../routes/ActivateEmail';
import { login } from '../../reducers/user_reducer';

const server = setupServer()

beforeAll(() => {
    server.listen()
})

beforeEach(() => {
    store.dispatch(resetState())
    jest.restoreAllMocks()
    server.use(
        rest.post(getApi('activateEmail'), (req, res, ctx) => {
            return res(ctx.json({
                message: 'Email change successful'
            }))
        }),
    )
})
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

const resetData = {
    uuid: 'xxxxxxxxxxiiiii',
    token: '2233344544555555',
}

const getUrl = () => {
    const [uuid, token] = [resetData.uuid, resetData.token]
    const url = `/activate-email/${uuid}/${token}`
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
                    <Route path='/activate-email/:uuid/:token' element={<ActivateEmailPage />}/>
                </Routes>
            </Router>
        </Provider>
    )]
}

test("requestActivateEmail() - Should return ok when successefull", async () => {
    const res = await user_utils.requestActivateEmail(resetData, store.dispatch)
    expect(res.ok).toBeTruthy()
    expect(res.response_data).toEqual({
        message: 'Email change successful'
    })
});

test("requestActivateEmail() - Should invoke 'post' with right args", async () => {
    const postMock = jest.spyOn(http_utils, 'post')
    await user_utils.requestActivateEmail(resetData, store.dispatch)

    expect(postMock).toHaveBeenCalledWith({
        url: getApi('activateEmail'),
        ignore_errors: [400],
        dispatch: store.dispatch,
        data: resetData
    })
});

test("requestActivateEmail() - Should change store user email", async () => {
    const data = {
        messeage: 'success message',
        new_email: 'newmail@mail.com'
    }
    server.use(
        rest.post(getApi('activateEmail'), (req, res, ctx) => {
            return res(ctx.json(data),)
        })
    )
    await store.dispatch(login({
        first_name: '',
        last_name: '',
        email: 'oldmail@mail.com'
    }))

    await user_utils.requestActivateEmail(resetData, store.dispatch)

    const U: IUser = store.getState().user
    expect(U.profile?.email).toEqual(data.new_email)
})

test("requestActivateEmail() - Should return errors on failure", async () => {
    const errs = {
        token: ['Token incorrect']
    }
    server.use(
        rest.post(getApi('activateEmail'), (req, res, ctx) => {
            return res(ctx.json(errs), ctx.status(400))
        })
    )
    const res = await user_utils.requestActivateEmail(resetData, store.dispatch)

    expect(res.ok).toStrictEqual(false)
    expect(res.errors).toEqual(errs)
});


test("Should display success message and redirect after reset - Integration", async () => {
    const message = "Success message"
    jest.spyOn(user_utils, 'requestActivateEmail').mockImplementation(
        (data, dispatch) => new Promise((rs, rj) => {
            rs({
                ok: true,
                response_data: {message}
            })
        })
    )
    jest.spyOn(activate_page, 'submitForm').mockImplementation(() => {})


    let history: any, _;
    act(() => {
        [history, _] = renderResetForm()
    })

    expect(history.location.pathname).toBe(getUrl())

    const btnEl = screen.getByTestId('genform-submit')
    await act(() => fireEvent.click(btnEl) as never)

    const U: iUI = store.getState().ui
    expect(U.popupMessage).toEqual({
        title: 'Email change successful',
        message
    })

    expect(history.location.pathname).toBe('/')
})