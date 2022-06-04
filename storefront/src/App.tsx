import { Suspense, lazy } from "react";
import { BrowserRouter as Router, Routes, Route, Outlet } from 'react-router-dom';
import Header from "./components/header";
import Footer from "./components/footer";
import MiniCart from "./components/mini-cart";
import Dialog from "./dialog/dialog";
import { PopupMessage } from "./dialog/popup";
import ResetPassword from "./routes/ResetPassword";


const Home = lazy(() => import('./routes/Home'));
const Catalog = lazy(() => import('./routes/Catalog'));


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
              <Route path="reset-password/:uuid/:token" element={<ResetPassword/>} />
            </Route>
          </Routes>
        </Suspense>
    </Router>
  </div>
);

export default App;