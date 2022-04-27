import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux"

import Stars from '../components/stars';
import { Button } from "../components/button";
import { addToCart, getProducts } from "../actions/index";


export const Product = ({ product }) => {
  const dispatch = useDispatch()

  return (
    <div className="Product" data-testid="product" title={product.title}>
      <div className="w-full mb-4">
        <img data-testid="product-image" className="w-full w-4/5 mx-auto" src={product.image} alt="display of product" />
      </div>
      <div className="text-center">
        <div className="mb-2">{product.title}</div>
        <Stars count={5} rating={product.rating} />
        <div className="mt-2">{"GHS" + product.price}</div>
      </div>
      <div className="mt-3">
        <Button text="Add to cart" onClick={() => dispatch(addToCart(product))} />
      </div>
    </div>
  );
};


export const ProductListing = () => {
  const dispatch = useDispatch()
  const products = useSelector(state => state.products)

  useEffect(() => {
    dispatch(getProducts())
    // eslint-disable-next-line
  }, [])

  const product_list = products.results || [];

  return (
    <div className="max-w-6xl mx-auto grid grid-cols-4 gap-12 py-14">
      {
        product_list.map(pr => <Product product={pr} key={pr.id}/>)
      }
    </div>
  )
};


function Catalog() {
    return (
        <div className="Catalog">
            <ProductListing />
        </div>
    )
}

export default Catalog