import { /*useDispatch,*/ useSelector } from "react-redux"
import { NavLink } from 'react-router-dom';
import { FaSearch, FaUser, FaShoppingBag } from 'react-icons/fa';


const ProductType = ({product_type}) => (
    <li>
        <NavLink className="p-5 inline-block" to={'/catalogue/bags'}>
            {product_type.name}
        </NavLink>
    </li>
)


const ProductTypesNav = () => {
  const product_types = useSelector(state => state.global.product_types);

  return (
      <nav className="">
          <ul className="list-none flex">
              {product_types.map(pt => <ProductType key={pt.id} product_type={pt} />)}
          </ul>
      </nav>

    )
};


const Header = () => (
  <header className="header shadow">
    <div className="border-box px-10 flex justify-between max-w-7xl mx-auto">
      <div className="logo my-auto text-sky-500 font-bold text-lg">JonaShop</div>
      <ProductTypesNav />
      <div className="actions flex justify-between items-center">
        <div className="search"><NavLink className="px-5 inline-block" to={"/"}><FaSearch color="#888"/></NavLink></div>
        <div className="account"><NavLink className="px-5 inline-block" to={"/"}><FaUser color="#888"/></NavLink></div>
        <div className="cart"><NavLink className="px-5 inline-block" to={"/"}><FaShoppingBag color="#888"/></NavLink></div>
      </div>
    </div>
  </header>
)


export default Header