import agent from './utils/agent'
import {
    ASYNC_START,
    ASYNC_END,
    LOGOUT,
    LOGIN_SUCCESS
  } from './constants/actionTypes';

  const promiseMiddleware = store => next => action => {
      if(isPromise(action.payload)){
          store.dispatch({ type: ASYNC_START, subtype: action.type });

          const currentView = store.getState().viewChangeCounter;
          const skipTracking = action.skipTracking;

          action.payload.then(
              res => {
                  const currentState = store.getState();
                  if(!skipTracking && currentState.viewChangeCounter !== currentView){
                      return;
                  }
                  action.payload = res;
                  store.dispatch({type:ASYNC_END, promise: action.payload});
                  store.dispatch(action);
              },
              error => {
                  const currentState = store.getState();
                  if (!skipTracking && currentState.viewChangeCounter !== currentView) {
                    return
                  }
                  console.log('ERROR', error);
                  action.error = true;
                  //if(error.response)
                  action.payload = error.response || error.message;
                  var errorMessage = error.message;
                  if(error.response && error.response.body && error.response.body.message)
                    errorMessage = error.response.body.message
                  if (!action.skipTracking) {
                    store.dispatch({ type: ASYNC_END, promise: action.payload, errors: errorMessage });
                  }
                  store.dispatch(action);
              }
          );
          return;
      }
      next(action);
  };

  const localStorageMiddleware = store => next => action => {
      if(action.type === LOGIN_SUCCESS)
      {
          if(!action.error){
              window.localStorage.setItem('jwt', action.token);
              agent.setToken(action.token);
          }
      }else if(action.type === LOGOUT)
      {
          window.localStorage.setItem('jwt', '');
          agent.setToken(null);
      }
      next(action);
  };

  function isPromise(v){
      return v && typeof v.then === 'function';
  }

  export {promiseMiddleware, localStorageMiddleware};
