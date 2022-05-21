import * as http_utils from '../utils/http'
import * as utils from '../utils/'
import { newMessage } from '../actions';
import { Action } from 'redux';


let dispatchMock: jest.Mock;

let csrf_token = jest.spyOn(utils, 'getCSRFcookie')

beforeEach(() => {
    dispatchMock = jest.fn()
    dispatchMock.mockImplementation((action: Action) => {})
})


afterEach(() => {
    jest.restoreAllMocks()
})

test("Make request with fetch api expected arguments", () => {
    const cCookie = '1xssedfeedss3343ws'
    const url = '/fake/test/url/'
    const method = 'PATCH'
    const defaultOpts = {
        method,
        credentials: 'same-origin',
        headers: {
            'Content-Type': 'application/json',
            "X-CSRFToken": cCookie,
        }
    }
    csrf_token.mockImplementation(() => cCookie)
    const options = {
        keepalive: true
    }

    const fetchSpy = jest.spyOn(global, "fetch") as jest.Mock
    fetchSpy.mockImplementation(
        () => Promise.resolve({
            json: () => Promise.resolve(),
        })
    )

    http_utils.makeRequest(method)({url, options, dispatch: dispatchMock})
    expect(fetchSpy).toHaveBeenCalledWith(url, {...defaultOpts, ...options})
})

test('Returns return value of fetch', async () => {
    const returnVal = 'xxeee33oosidkkfkksuurj'
    const url = '/fetch/url'

    const fetchSpy = jest.spyOn(global, "fetch") as jest.Mock
    fetchSpy.mockImplementation(//() => Promise.resolve(returnVal))
        () => Promise.resolve({
            json: () => Promise.resolve(returnVal),
            status: 200,
            ok: true,
        })
    )

    const expectVal = await http_utils.makeRequest('GET')({url, dispatch: dispatchMock})
    
    expect(await expectVal.json()).toEqual(returnVal)
})

test("Catch and dispatch fetch errors as messages", () => {
    const url = '/fetch/url'
    const message = "Network conectivity error"
    const err = new Error(message)

    const fetchSpy = jest.spyOn(global, "fetch") as jest.Mock
    fetchSpy.mockImplementation(() => {
        throw err
    })


    const expectVal = http_utils.makeRequest('GET')({url, dispatch: dispatchMock})

    expect(dispatchMock).toHaveBeenCalledWith(newMessage(err.message))
})

test("Handle unhandled http error codes", async () => {
    const message = "Request failed. Please try again later."
    const fetchSpy = jest.spyOn(global, "fetch") as jest.Mock
    fetchSpy.mockImplementation(
        () => Promise.resolve({
            json: () => Promise.resolve(),
            status: 407,
            ok: false
        })
    )

    await http_utils.get({
        url: '/url/url/',
        dispatch: dispatchMock,
        ignore_errors: [403, 401, 500]
    })

    expect(dispatchMock).toHaveBeenCalledWith(newMessage(message))
})