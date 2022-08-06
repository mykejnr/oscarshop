import {render, fireEvent, screen } from '@testing-library/react'
import { act } from 'react-dom/test-utils';
import { Provider } from 'react-redux';
import {setupServer} from 'msw/node'
import { rest } from 'msw';

import { resetState } from '../../actions';
import store from "../../store/index";

import { getApi } from '../../api';
import * as user_utils from '../../utils/requests/user'
import * as http_utils from '../../utils/http'
import { ChangeEmailForm } from '../../forms';

const server = setupServer()

beforeAll(() => {
    server.listen()
})

beforeEach(() => {
    store.dispatch(resetState())
    jest.restoreAllMocks()
    server.use(
        rest.post(getApi('changeEmail'), (req, res, ctx) => {
            return res(ctx.json({message: "Email change successful"}))
        }),
    )
})
afterEach(() => server.resetHandlers())
afterAll(() => server.close())


const renderForm = () => {
    render(
        <Provider store={store}>
            <ChangeEmailForm />
        </Provider>
    )
}

const getChangeData = () => ({
    password: 'dPas@red',
    new_email: 'newmail@mail.com',
})


test("requestChangeEmail() - Should return ok when successefull", async () => {
    const res = await user_utils.requestChangeEmail(getChangeData(), store.dispatch)
    expect(res.ok).toBeTruthy()
    expect(res.response_data).toEqual({message: 'Email change successful'})
});

test("requestChangeEmail() - Should invoke 'post' with rigth args", async () => {
    const postMock = jest.spyOn(http_utils, 'post')
    await user_utils.requestChangeEmail(getChangeData(), store.dispatch)

    expect(postMock).toHaveBeenCalledWith({
        url: getApi('changeEmail'),
        ignore_errors: [400],
        dispatch: store.dispatch,
        data: getChangeData()
    })
});

test("reqeustChangeEmail() - Should return errors on failure", async () => {
    const errs = {
        password: ['Password incorrect']
    }
    server.use(
        rest.post(getApi('changeEmail'), (req, res, ctx) => {
            return res(ctx.json(errs), ctx.status(400))
        })
    )
    const res = await user_utils.requestChangeEmail(getChangeData(), store.dispatch)

    expect(res.ok).toStrictEqual(false)
    expect(res.errors).toEqual(errs)
});

test("Should display success message after change - Integration", async () => {
    const message = "Email change successful"
    jest.spyOn(user_utils, 'requestChangeEmail').mockImplementation(
        (data, dispatch) => new Promise((rs, rj) => {
            rs({
                status: 200,
                ok: true,
                response_data: {message}
            })
        })
    )

    renderForm()

    const inputPw = screen.getByPlaceholderText('Password')
    const inputEm = screen.getByPlaceholderText('New email')
    fireEvent.change(inputPw, {target: {value: '*******'}})
    fireEvent.change(inputEm, {target: {value: 'new@mail.com'}})

    const btnEl = screen.getByTestId('genform-submit')
    await act(() => fireEvent.click(btnEl) as never)

    const U: iUI = store.getState().ui
    expect(U.popupMessage).toEqual({
      title: "Confirm Email Change",
      message
    })
})