export interface IBasketAddProducOptions {
    product_id: number,
    quantity: number
}

export interface IBasketLineProduct {
    url: string,
    id: number,
    title: string,
    price: number,
    image: string 
}

export interface IBasketLine {
    id: number,
    line_reference: string,
    quantity: number,
    product: IBasketLineProduct,
}

export interface ISimpleBasket {
    url: string,
    id: number,
    status: 'EMPTY' | 'OPEN' | 'SAVED' | 'CLOSED',
    total_price: number,
    total_quantity: number,
}

export interface IBasket extends ISimpleBasket {
    lines: IBasketLine[]
}

export interface IAddToBasketReturn extends ISimpleBasket {
    is_line_created: boolean,
    line: IBasketLine
}
