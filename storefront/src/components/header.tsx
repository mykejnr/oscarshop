import { /*useDispatch,*/ useDispatch, useSelector } from "react-redux"
import { NavLink } from 'react-router-dom';
import { FaSearch, FaUser, FaShoppingBag } from 'react-icons/fa';
import { IconType } from "react-icons";
import { toggleMiniCart } from "../actions";


const ProductType = ({product_type}: {product_type: IProductType}) => (
    <li>
        <NavLink className="p-5 inline-block" to={'/catalogue/bags'}>
            {product_type.name}
        </NavLink>
    </li>
)


const ProductTypesNav = () => {
  const product_types = useSelector((state: IRootState) => state.global.product_types);

  return (
      <nav className="">
          <ul className="list-none flex">
              {product_types.map(pt => <ProductType key={pt.id} product_type={pt} />)}
          </ul>
      </nav>

    )
};


const MiniButtons = ({Icon, onClick}: {Icon: IconType, onClick?: any}) => (
  <button className="px-5 inline-block" onClick={onClick}>
    <Icon color="#888"/>
  </button>
)


const Header = () => {
  const dispatch = useDispatch()

  return(
    <header className="header shadow">
      <div className="border-box px-10 flex justify-between max-w-7xl mx-auto">
        <div className="logo my-auto text-sky-500 font-bold text-lg">JonaShop</div>
        <ProductTypesNav />
        <div className="actions flex justify-between items-center">
          <MiniButtons Icon={FaSearch} />
          <MiniButtons Icon={FaUser} />
          <MiniButtons Icon={FaShoppingBag} onClick={() => dispatch(toggleMiniCart())} />
        </div>
      </div>
    </header>
  )
}


export default Header