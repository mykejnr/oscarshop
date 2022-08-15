interface IPopupMessage {
    title?: string,
    message: string,
    type?: 'html' | 'raw'
    level?: 'info' | 'warning' | 'error'
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
    status: 'NEW' | 'REQUESTING' | 'REQUESTED'
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

type TOkResponse = Record<string, string>

type TPopupMessage = IPopupMessage | 'nopopup'