import { Suspense, lazy } from "react";
import { BrowserRouter as Router, Routes, Route, Outlet } from 'react-router-dom';
import Header from "./components/header";
import Footer from "./components/footer";
import MiniCart from "./components/mini-cart";
import Dialog from "./dialog/dialog";
import { PopupMessage } from "./dialog/popup";
import ResetPassword from "./routes/ResetPassword";
import ActivateEmailPage from "./routes/ActivateEmail";


const Home = lazy(() => import('./routes/Home'));
const Catalog = lazy(() => import('./routes/Catalog'));
const Checkout = lazy(() => import("./routes/Checkout"));
const Order = lazy(() => import("./routes/Order"));


const Layout = () => (
  <div className="App">
    <Header />
    <Outlet />
    <Footer />
    <MiniCart />
    <Dialog name="signup" />
    <Dialog name="login" />
    <Dialog name="forgot_password" />
    <Dialog name="change_password" />
    <Dialog name="change_email" />
    <PopupMessage />
  </div>
)

const App = () => (
  <div className="bg-white text-neutral-500">
    <Router>
        <Suspense fallback={<div>Loading...</div>}>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<Home />} />
              <Route path="catalogue" element={<Catalog />} />
              <Route path="checkout" element={<Checkout />} />
              <Route path="order/:uuid/:token" element={<Order />} />
              <Route path="reset-password/:uuid/:token" element={<ResetPassword/>} />
              <Route path="activate-email/:uuid/:token" element={<ActivateEmailPage />} />
            </Route>
          </Routes>
        </Suspense>
    </Router>
  </div>
);

export default App;