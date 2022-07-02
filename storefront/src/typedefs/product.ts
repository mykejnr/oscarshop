import { IBasketLineProduct } from "./basket";

export interface IProduct extends IBasketLineProduct {
    rating: number,
    availability: boolean,
    is_parent: boolean,
}

