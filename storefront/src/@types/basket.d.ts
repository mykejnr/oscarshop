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

interface IBasketLine {
    id: number,
    line_reference: string,
    quantity: number,
    product: IBasketLineProduct,
}

interface ISimpleBasket {
    url: string,
    id: number,
    status: 'EMPTY' | 'OPEN' | 'SAVED' | 'CLOSED',
    total_price: number,
    total_quantity: number,
}

interface IBasket extends ISimpleBasket {
    lines: IBasketLine[]
}

interface IAddToBasketReturn extends ISimpleBasket {
    is_line_created: boolean,
    line: IBasketLine
}