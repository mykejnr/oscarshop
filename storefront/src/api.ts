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
    activateEmail: '/api/user/activate_email/'
}


type APIName = keyof typeof API


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