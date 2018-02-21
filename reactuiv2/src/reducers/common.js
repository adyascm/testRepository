import {
  APP_LOAD,
  REDIRECT,
  LOGOUT,
  LOGIN,
  DASHBOARD_PAGE_UNLOADED,
  LOGIN_PAGE_UNLOADED,
  LOGIN_SUCCESS,
  SET_DATASOURCES,
  CREATE_DATASOURCE,
  SCAN_UPDATE_RECEIVED,
  USERS_PAGE_LOADED,
  RESOURCES_PAGE_LOADED
} from '../constants/actionTypes';

const defaultState = {
  appName: 'Adya',
  viewChangeCounter: 0,
  currentView: ""
};

export default (state = defaultState, action) => {
  switch (action.type) {
    case APP_LOAD:
      return {
        ...state,
        token: action.token || null,
        appLoaded: true,
        currentUser: action.error ? null : action.payload,
        currentView: ""
      };
    case REDIRECT:
      return { ...state, redirectTo: null };
    case LOGOUT:
      return { ...state, redirectTo: '/login', token: null, currentUser: null, currentView: "/login" };
    case LOGIN_SUCCESS:
      return {
        ...state,
        redirectTo: action.error ? null : '',
        token: action.error ? null : action.token,
        currentUser: action.error ? null : action.payload
      };
    case DASHBOARD_PAGE_UNLOADED:
    case LOGIN_PAGE_UNLOADED:
      return { ...state, viewChangeCounter: state.viewChangeCounter + 1 };
    case SET_DATASOURCES:
      return {
        ...state,
        datasources: action.payload
      };
    case SCAN_UPDATE_RECEIVED:
      if (state.datasources) {
        var ds = JSON.parse(action.payload);
        if (ds.datasource_id === state.datasources[0].datasource_id) {
          state.datasources[0] = ds;
        }
      }
      return {
        ...state,

      };
    case CREATE_DATASOURCE:
      return {
        ...state,
        datasources: state.datasources.concat(action.payload)
      };
    case USERS_PAGE_LOADED:
      return {
        ...state,
        currentView: "/users"
      };
    case RESOURCES_PAGE_LOADED:
      return {
        ...state,
        currentView: "/resources"
      };
    default:
      return state;
  }
};
