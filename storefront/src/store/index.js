import { applyMiddleware, createStore, compose } from 'redux';
import { updateCartItemMiddleware } from '../middleware';
import rootReducer from '../reducers/index';
import thunk from 'redux-thunk';


const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;

const store = createStore(rootReducer, composeEnhancers(
    applyMiddleware(updateCartItemMiddleware, thunk),
));

export default store;