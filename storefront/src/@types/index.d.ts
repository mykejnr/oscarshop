interface IBasketAddProducOptions {
    product_id: number,
    quantity: number
}

interface IProduct {
    url: string,
    id: number,
    title: string,
    rating: number,
    price: number,
    availability: boolean,
    is_parent: boolean,
    image: string 
}