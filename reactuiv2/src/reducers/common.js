import {
  APP_LOAD,
  REDIRECT,
  LOGOUT,
  LOGIN,
  HOME_PAGE_UNLOADED,
  LOGIN_PAGE_UNLOADED,
  LOGIN_SUCCESS,
  SET_DATASOURCES
} from '../constants/actionTypes';

const defaultState = {
  appName: 'Adya',
  viewChangeCounter: 0
};

export default (state = defaultState, action) => {
  switch (action.type) {
    case APP_LOAD:
      return {
        ...state,
        token: action.token || null,
        appLoaded: true,
        currentUser: action.error ? null : JSON.parse(action.payload)
      };
    case REDIRECT:
      return { ...state, redirectTo: null };
    case LOGOUT:
      return { ...state, redirectTo: '/login', token: null, currentUser: null };
    case LOGIN_SUCCESS:
      return {
        ...state,
        redirectTo: action.error ? null : '/dashboard',
        token: action.error ? null : action.token,
        currentUser: action.error ? null : JSON.parse(action.payload)
      };
    case HOME_PAGE_UNLOADED:
    case LOGIN_PAGE_UNLOADED:
      return { ...state, viewChangeCounter: state.viewChangeCounter + 1 };
    case SET_DATASOURCES:
      return{
        ...state,
        datasources: JSON.parse(action.payload)
      };
    default:
      return state;
  }
};
