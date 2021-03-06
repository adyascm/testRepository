import { applyMiddleware, createStore } from 'redux';
import { createLogger } from 'redux-logger';
import { composeWithDevTools } from 'redux-devtools-extension/developmentOnly'
import { promiseMiddleware, localStorageMiddleware } from './middleware'
import reducer from './reducer';


const getMiddleware = () => {
    if (process.env.NODE_ENV !== 'debug') {
        return applyMiddleware(promiseMiddleware, localStorageMiddleware);
    } else {
        return applyMiddleware(promiseMiddleware, localStorageMiddleware, createLogger());
    }
};
export const store = createStore(reducer, composeWithDevTools(getMiddleware()));