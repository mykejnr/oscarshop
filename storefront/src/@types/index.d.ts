
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


interface iUI {
    miniCartVisible: boolean,
    miniUserVisible: boolean,
    activeDialog: import("../dialog/dialog").TDialogName,
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