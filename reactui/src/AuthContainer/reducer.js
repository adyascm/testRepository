import { handleActions } from 'redux-actions';
import u from 'updeep';
import * as actions from './actions';
import { REHYDRATE } from 'redux-persist/constants';
import { POST_LOGIN, RECEIVE_LOGIN, POST_SIGNUP, RECEIVE_SIGNUP, LOGOUT } from './actions';

const initialState = {
  googleProfile: {},
  profile: null,
  isLoggingIn: false,
  loginError: null,
  isSigningUp: false,
  signupError: null,
  isRehydrated: false,
  googleSignup: false
};

export default handleActions({

  [actions.GOOGLE_LOGIN]: (state, action) => u({
    googleSignup: action.payload.googleSignup
  }, state),

  [REHYDRATE]: (state, action) => u({
    profile: action.payload.auth && action.payload.auth.profile,
    isRehydrated: true
  }, state),

  [actions.SET_GOOGLELOGININFO]: (state, action) => u({
    googleProfile: action.payload.profile
  }, state),

  [actions.IS_LOGGIN]: (state, action) => u({
    isLoggingIn: action.payload.isLoggingIn,
    isRehydrated: true,
    profile: action.payload.profile
  }, state),

  [POST_LOGIN]: (state, action) => u({
    isLoggingIn: true,
    loginError: null
  }, state),

  [RECEIVE_LOGIN]: (state, action) => {
    if (action.error) {
      return u({
        isLoggingIn: false,
        loginError: action.payload.message
      }, state);
    }

    return u({
      isLoggingIn: false,
      profile: action.payload
    }, state)
  },

  [POST_SIGNUP]: (state, action) => u({
    isSigningUp: true,
    signupError: null
  }, state),

  [RECEIVE_SIGNUP]: (state, action) => {
    if (action.error) {
      return u({
        isSigningUp: false,
        signupError: action.payload.message
      }, state);
    }

    return u({
      isSigningUp: false,
      profile: action.payload
    }, state)
  },

  [LOGOUT]: (state, action) => u({
    profile: null,
    isLoggingIn: false
  }, state)
}, initialState);

export const selectors = {
  getIsLoggedIn: state => !!state.profile,
  getIsLoggingIn: state => state.isLoggingIn,
  getIsSigningUp: state => state.isSigningUp,
  getIsRehydrated: state => state.isRehydrated,
  getProfile: state => state.profile,
  getGoogleLoginInfo: state => state.googleProfile,
  getGoogleLogin: state => state.googleSignup
};
