/**
 * API Entrypoints
 * 
 * Note: That these are not all available endpoints, but
 * "Entry points", other api urls can be obtail from respective
 * response data
 * 
 * This is hardcoded for testing purposes
 * On startup of this app, this object will be
 * repopulated by calling /api/ to retrieve all entry points
 * from the server, to ensure that all entry points are 
 * correct and up to date
 */
const API = {
    base: '/api/',
    products: '/api/products/',
    getProduct: '/api/products/{param}/',
    basket: '/api/basket/',
    getBasket: '/api/basket/{param}/',
    basketAdd: '/api/basket/add_product/',
    checkout: '/api/basket/checkout/',
    user: '/api/user/',
    signup: '/api/user/signup/',
    login: '/api/user/login/',
    resetPassword: '/api/user/reset_password/',
    confirmReset: '/api/user/confirm_reset/',
    changePassword: '/api/user/change_password/',
    changeEmail: '/api/user/change_email/',
    activateEmail: '/api/user/activate_email/',
    shippingMethods: '/api/shipping/methods/',
    paymentMethods: '/api/payment/methods/',
    anonymousOrder: '/api/order/anonymous/',
}
export type APIName = keyof typeof API


const WSAPI = {
    payCheckout: '/wbs/pay/'
}
export type WSAPIName = keyof typeof WSAPI

/**
 * Provide a name of a url to get the full path of the url
 * @param name A name to be used to retreive an entry point from the API object
 * @param param An api i parameter. eg: /api/products/{param}/. {param} can
 * be an id=1 which will be replaced to form /api/products/1/
 * @returns A url endpoint
 */
export const getApi = (name: APIName, param?: string): string => {
    return API[name].replace('{param}', param || "")
}


/**
 * Provide a name of a websocket url and get the full path to
 * the websocket endpoint
 * @param name 
 * @returns 
 */
export const getWsApi = (name: WSAPIName): string => {
    // Unlike getApi(), ws urls are not proxied due to some issues
    // in the library 'http-proxy-middleware' which is used in setupProxy.js
    // the library causes chrome (and maybe other browsers) to report close code
    // '1006' (abnormal closing) even when the websocket closes normally or even
    // when it closes with other close code.
    // To avoid this situation we request from the backend dev server directly
    // At least for now, since there are no cookie and csrf issues.
    let host = window.location.host
    if (host==='localhost:3000') { // we are in devmode (lazy detection of development mode, can we make it better?)
        host = 'localhost:8000'
    }
    return `ws://${host}${WSAPI[name]}`
}


const routes = {
    home: '/',
    checkout: '/checkout',
    order: '/order/:token/:uuid'
}

export type TRouteName = keyof typeof routes


export const getRoute = (name: TRouteName, ...params: string[]): string => {
    let route = routes[name]
    return route
}