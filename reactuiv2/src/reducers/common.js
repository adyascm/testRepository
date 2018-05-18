import {
  APP_LOAD,
  REDIRECT,
  LOGOUT,
  DASHBOARD_PAGE_UNLOADED,
  LOGIN_PAGE_UNLOADED,
  LOGIN_SUCCESS,
  GET_ALL_ACTIONS,
  SET_DATASOURCES,
  CREATE_DATASOURCE,
  DELETE_DATASOURCE_START,
  SCAN_UPDATE_RECEIVED,
  USERS_PAGE_LOADED,
  RESOURCES_PAGE_LOADED,
  APPS_PAGE_LOADED,
  DATASOURCE_LOAD_START,
  DATASOURCE_LOAD_END,
  SET_REDIRECT_PROPS,
  CREATE_TRUSTED_ENTITIES,
  SET_TRUSTED_ENTITIES
} from '../constants/actionTypes';

const defaultState = {
  appName: 'Adya',
  viewChangeCounter: 0,
  currentUrl: '/login',
  token: undefined,
  currentUser: undefined,
  appLoaded: false,
  redirectTo: '/login',
  datasources: undefined,
  all_actions_list: undefined,
  datasourceLoading: false,
  entitiy: undefined,
  trustedEntities: undefined

};

export default (state = defaultState, action) => {
  switch (action.type) {
    case APP_LOAD:
      return {
        ...state,
        token: action.token || null,
        appLoaded: true,
        currentUser: action.error ? null : action.payload
      };
    case REDIRECT:
      return { ...state, redirectTo: null };
    case LOGOUT:
      return {
        ...defaultState,
        appLoaded: true,
      };
    case LOGIN_SUCCESS:
      return {
        ...state,
        redirectTo: action.error ? null : '',
        token: action.error ? null : action.token,
        currentUser: action.error ? null : action.payload,
      };
    case GET_ALL_ACTIONS:
      var actions = action.payload;
      var actionsMap = {}
      for (var index in actions) {
        var quickAction = actions[index];
        actionsMap[quickAction.key] = quickAction;
      }
      return {
        ...state,
        all_actions_list: actionsMap
      }
    case DASHBOARD_PAGE_UNLOADED:
    case LOGIN_PAGE_UNLOADED:
      return { ...state, viewChangeCounter: state.viewChangeCounter + 1 };
    case SET_DATASOURCES:
      return {
        ...state,
        datasourceLoading: false,
        datasources: action.error ? null : action.payload,
        currentUrl: !action.payload.length ? "/datasources" : window.location.pathname
      };
    case SCAN_UPDATE_RECEIVED:
      if (state.datasources) {
        var newDS = JSON.parse(action.payload);
        var oldDS = state.datasources[0];
        if (oldDS && newDS.datasource_id === oldDS.datasource_id) {
          if (newDS.file_scan_status > oldDS.file_scan_status || newDS.total_file_count > oldDS.total_file_count
            || newDS.processed_file_count > oldDS.processed_file_count
            || newDS.user_scan_status > oldDS.user_scan_status || newDS.group_scan_status > oldDS.group_scan_status ||
            newDS.total_group_count > oldDS.total_group_count || newDS.processed_group_count > oldDS.processed_group_count ||
            newDS.total_user_count > oldDS.total_user_count || newDS.processed_user_count > oldDS.processed_user_count) {
            state.datasources[0] = newDS;
          }
        }
      }
      return {
        ...state,

      };
    case DATASOURCE_LOAD_START:
      return {
        ...state,
        datasourceLoading: true
      }
    case DATASOURCE_LOAD_END:
      return {
        ...state,
        datasourceLoading: false
      }
    case CREATE_DATASOURCE:
      return {
        ...state,
        datasourceLoading: false,
        datasources: action.error ? null : [action.payload]
      };
    case DELETE_DATASOURCE_START:
      if (state.datasources[0] && action.payload.datasource_id === state.datasources[0].datasource_id) {
        action.payload.isDeleting = true;
        state.datasources[0] = action.payload;
      }
      return {
        ...state,
        datasourceLoading: true
      };
    case CREATE_TRUSTED_ENTITIES:
      return {
        ...state,
        entitiy : action.error?[]:action.payload,
        errorMessage: action.error
      };
    case SET_TRUSTED_ENTITIES:
          var error;
          if(action.error === undefined){
            error = false
          }
          else {
            error = true
          }
          return{
            ...state,
            trustedEntities: action.error?[]:action.payload,
            errorMessage: action.error
          } ;
    // case USERS_PAGE_LOADED:
    //   return {
    //     ...state,
    //     currentView: "/users"
    //   };
    // case RESOURCES_PAGE_LOADED:
    //   return {
    //     ...state,
    //     currentView: "/resources"
    //   };
    // case APPS_PAGE_LOADED:
    //   return {
    //     ...state,
    //     currentView: "/apps"
    //   };
    case SET_REDIRECT_PROPS:
      var states = {};
      if (action.reducerStates) {
        var reducers = Object.keys(action.reducerStates)
        for (var index in reducers) {
          if (reducers[index] == "common")
            states = action.reducerStates[reducers[index]];
        }
      }
      return {
        ...state,
        currentUrl: action.redirectUrl,
        ...states
      }
    default:
      return state;
  }
};
