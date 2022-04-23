import { connect } from "react-redux";
import Stars from '../components/stars';
import { Button } from "../components/button";
import { addToCart, getProducts } from "../actions";
import { useEffect } from "react";


// aka. mapStateToProps
const selectState = state => {
    return { products: state.products }
}

const mapDispatchToProps = dispatch => {
    return {
        addProductToCart: product => dispatch(addToCart(product))
    }
}


const Product_ = ({product, addProductToCart}) => (
  <div className="Product">
    <div className="w-full mb-4">
      <img className="w-full w-4/5 mx-auto" src={product.image} alt="display of product" />
    </div>
    <div className="text-center">
      <div className="mb-2">{product.title}</div>
      <Stars count={5} rating={product.rating} />
        <div className="mt-2">{"GHS" + product.price}</div>
    </div>
    <div className="mt-3">
      <Button onClick={() => addProductToCart(product)} />
    </div>
  </div>
);


const Product = connect(null, mapDispatchToProps)(Product_)


const ProductListing_ = ({ products, getProducts }) => {
  useEffect(() => {
    getProducts();
  }, [getProducts])

  const product_list = products.results || [];

  return (
    <div className="max-w-6xl mx-auto grid grid-cols-4 gap-12 py-14">
      {
        product_list.map(pr => <Product product={pr} key={pr.id}/>)
      }
    </div>
  )
};


const ProductListing = connect(selectState, { getProducts })(ProductListing_)


function Catalog() {
    return (
        <div className="Catalog">
            <ProductListing />
        </div>
    )
}

export default Catalog