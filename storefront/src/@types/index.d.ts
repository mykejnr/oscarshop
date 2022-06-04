
interface IBasketAddProducOptions {
    product_id: number,
    quantity: number
}

interface IBasketLineProduct {
    url: string,
    id: number,
    title: string,
    price: number,
    image: string 
}

interface IProduct extends IBasketLineProduct {
    rating: number,
    availability: boolean,
    is_parent: boolean,
}

interface IBasketLine {
    id: number,
    line_reference: string,
    quantity: number,
    product: IBasketLineProduct,
}

interface IBasket {
    url: string,
    id: number,
    status: 'OPEN' | 'SAVED' | 'CLOSED',
    total_price: number,
    total_quantity: number,
    lines: [IBasketLine]
}

interface IPopupMessage {
    title?: string,
    message: string,
}

interface iUI {
    miniCartVisible: boolean,
    miniUserVisible: boolean,
    activeDialog: import("../dialog/dialog").TDialogName,
    popupMessage: TPopupMessage
}

interface IProductType {
    id: number,
    name: string
}

interface ICategoryType {
    id: number,
    name: string
}

interface IGlobalState {
    product_types: IProductType[],
    categories: ICategoryType[],
}

interface IUser {
    auth: boolean
    profile?: {
        first_name: string,
        last_name: string,
        email: string
    }
}

interface IRootState {
    cart: IBasket,
    products: IProduct[],
    ui: iUI,
    global: IGlobalState,
    user: IUser,
}

interface IUserReturnBase {
    first_name: string
    last_name: string
    email: string,
}

interface ISignupReturn extends IUserReturnBase {
}

interface ISignupData extends Record<string, string> {
    first_name: string
    last_name: string
    email: string,
    password: string,
    confirm_password: string
}

interface ISignupResponseErrors {
    first_name?: string[],
    last_name?: string[],
    email?: string[],
    password?: string[],
    confirm_password?: string[]
}

interface ISignupResponse {
    ok: boolean,
    errors?: ISignupResponseErrors
}

interface ILoginFormData extends Record<string, string> {
  email: string,
  password: string,
}

interface ILoginReturn extends IUserReturnBase {}

interface IForgotPasswordData extends Record<string, string> {
    email: string
}

interface IResetPasswordData extends Record<string, string> {
    uuid: string,
    token: string,
    password: string,
}

interface IChangePasswordData extends Record<string, string> {
    old_password: string,
    new_password: string,
    confirm_password: string,
}

interface IChangeEmailData extends Record<string, string> {
    password: string,
    new_email: string,
}

interface IActivateEmailData extends Record<string, string> {
    uuid: string,
    token: string,
}

type TFormDataResponse<TFormData> = {
    ok: boolean,
    errors?: Record<keyof TFormData, string[]>,
    response_data?: Record<string, string>
}

type TOkResponse = Record<string, string>

type TPopupMessage = IPopupMessage | 'nopopup'