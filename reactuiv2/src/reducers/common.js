import {
  APP_LOAD,
  REDIRECT,
  LOGOUT,
  DASHBOARD_PAGE_UNLOADED,
  LOGIN_PAGE_UNLOADED,
  LOGIN_SUCCESS,
  SET_DATASOURCES,
  CREATE_DATASOURCE,
  DELETE_DATASOURCE_START,
  SCAN_UPDATE_RECEIVED,
  SCAN_INCREMENTAL_UPDATE_RECEIVED,
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
        if (state.datasources[0] && ds.datasource_id === state.datasources[0].datasource_id) {
          state.datasources[0] = ds;
        }
      }
      return {
        ...state,

      };
      case SCAN_INCREMENTAL_UPDATE_RECEIVED:
      var updateMessage = JSON.parse(action.payload);
      if(state.datasources && updateMessage.datasource_id === state.datasources[0].datasource_id)
      {
        return {
          ...state,
          appMessage: "Update received for a file, please refresh the app to see the latest changes..."
        };
      }
      return {
        ...state
      };
    case CREATE_DATASOURCE:
      return {
        ...state,
        datasources: state.datasources.concat(action.payload)
      };
    case DELETE_DATASOURCE_START:
      if (state.datasources[0] && action.payload.datasource_id === state.datasources[0].datasource_id) {
        action.payload.isDeleting = true;
        state.datasources[0] = action.payload;
      }
      return {
        ...state
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
