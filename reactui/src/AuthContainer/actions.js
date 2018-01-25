import { createAction } from 'redux-actions';
import { selectors } from './reducer';
import { login, signup, getDefaultHeaders } from '../urls';

export const LOGOUT = createAction('permissions/AuthContainer/LOGOUT');

export const POST_LOGIN = createAction('permissions/AuthContainer/POST_LOGIN');
export const RECEIVE_LOGIN = createAction('permissions/AuthContainer/RECEIVE_LOGIN', profile => profile);

const extractProfile = (email, response) => {
  const [ accountId, accountName, accountType, accountStatus, authToken ] = response;

  return {
    email,
    accountId,
    accountName,
    accountType,
    accountStatus,
    authToken
  };
};

export const loginWorkflow = (email, password) => (dispatch, getState) => {
  const state = getState();

  if (selectors.getIsLoggingIn(state.auth)) {
    console.info('ignoring duplicate login request');
    return Promise.resolve();
  }

  dispatch(POST_LOGIN());
  return fetch(login(), {
    method: 'POST',
    headers: getDefaultHeaders(),
    body: JSON.stringify({ email, password })
  })
    .then(response => response.json())
    .then(response => {
      if (response.errorMessage) {
        throw new Error(JSON.parse(response.errorMessage).message);
      }

      dispatch(RECEIVE_LOGIN(extractProfile(email, response)));
    })
    .catch(error => {
      dispatch(RECEIVE_LOGIN(new Error(error.message)));
      throw error;
    });
};

export const POST_SIGNUP = createAction('permissions/AuthContainer/POST_SIGNUP');
export const RECEIVE_SIGNUP = createAction('permissions/AuthContainer/RECEIVE_SIGNUP', profile => profile);
export const SET_GOOGLELOGININFO = createAction('permissions/AuthContainer/SET_GOOGLELOGININFO', profile => profile);

export const signupWorkflow = account => (dispatch, getState) => {
  const state = getState();

  if (selectors.getIsSigningUp(state.auth)) {
    console.info('ignoring duplicate signup request');
    return Promise.resolve();
  }

  dispatch(POST_SIGNUP());
  return fetch(signup(), {
    method: 'POST',
    headers: getDefaultHeaders(),
    body: JSON.stringify(account)
  })
    .then(response => response.json())
    .then(response => {
      if (response.errorMessage) {
        throw new Error(JSON.parse(response.errorMessage).message);
      }

      dispatch(RECEIVE_SIGNUP(extractProfile(account.email, response)));
    })
    .catch(error => {
      dispatch(RECEIVE_SIGNUP(new Error(error.message)));
      throw error;
    });
};
