import * as http_utils from '../utils/http'
import * as utils from '../utils/'
import { newMessage } from '../actions';


let thunkAPI =  {
    dispatch: () => {}
};
let csrf_token = jest.spyOn(utils, 'getCSRFcookie')


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

    http_utils.makeRequest(method)({url, options, thunkAPI})
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

    const expectVal = await http_utils.makeRequest('GET')({url, thunkAPI})
    
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

    const dispSpy = jest.spyOn(thunkAPI, 'dispatch')

    const expectVal = http_utils.makeRequest('GET')({url, thunkAPI})

    expect(dispSpy).toHaveBeenCalledWith(newMessage(err.message))
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
    const dispSpy = jest.spyOn(thunkAPI, 'dispatch')

    await http_utils.get({
        url: '/url/url/',
        thunkAPI,
        ignore_errors: [403, 401, 500]
    })

    expect(dispSpy).toHaveBeenCalledWith(newMessage(message))
})