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
  DATASOURCE_LOAD_START,
  DATASOURCE_LOAD_END,
  SET_CURRENT_URL
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
    case GET_ALL_ACTIONS:
      var actions = action.payload;
      var actionsMap = {}
      for(var index in actions){
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
        datasources: action.error ? null : action.payload
      };
    case SCAN_UPDATE_RECEIVED:
      if (state.datasources) {
        var newDS = JSON.parse(action.payload);
        var oldDS = state.datasources[0];
        if (oldDS && newDS.datasource_id === oldDS.datasource_id) {
          console.log(newDS);
          if(newDS.file_scan_status > oldDS.file_scan_status || newDS.total_file_count > oldDS.total_file_count
            || newDS.processed_file_count > oldDS.processed_file_count
            || newDS.user_scan_status > oldDS.user_scan_status || newDS.group_scan_status > oldDS.group_scan_status ||
            newDS.total_group_count > oldDS.total_group_count || newDS.processed_group_count > oldDS.processed_group_count ||
            newDS.total_user_count > oldDS.total_user_count || newDS.processed_user_count > oldDS.processed_user_count)
          {
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
    case SET_CURRENT_URL: 
      return {
        ...state,
        currentUrl: action.url
      }
    default:
      return state;
  }
};
