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
  SET_TRUSTED_ENTITIES,
  UPDATE_TRUSTED_ENTITIES,
  GET_ALL_ACTIVITY_EVENTS
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
  trustedEntities: undefined,
  all_activity_events: undefined,
  unique_activity_events: undefined
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
      return {
        ...state,
        all_actions_list: action.error ? [] : action.payload
      }
    case DASHBOARD_PAGE_UNLOADED:
    case LOGIN_PAGE_UNLOADED:
      return { ...state, viewChangeCounter: state.viewChangeCounter + 1 };
    case SET_DATASOURCES:
      var dsList = action.error ? null : action.payload;
      var map = {};
      if (dsList) {
        for (var index in dsList) {
          let ds = dsList[index];
          if (ds.datasource_type == "GSUITE")
            ds.logo = "/images/google_logo.png";
          else if (ds.datasource_type == "SLACK")
            ds.logo = "/images/slack_logo.jpeg";
          else if (ds.datasource_type == "GITHUB")
            ds.logo = "/images/github_logo.png"
          map[ds.datasource_id] = ds;
        }
      }
      return {
        ...state,
        datasourceLoading: false,
        datasources: dsList,
        datasourcesMap: map,
        currentUrl: !action.payload.length ? "/datasources" : window.location.pathname
      };
    case SCAN_UPDATE_RECEIVED:
      if (state.datasources) {
        var newDS = JSON.parse(action.payload);
        //var oldDS = state.datasources[0];
        let currDatasourceIndex = 0;
        for (let index=0; index<state.datasources.length; index++) {
          if (state.datasources[index]["datasource_id"] === newDS["datasource_id"]) {
            currDatasourceIndex = index;
            break;
          }
        }
        var oldDS = state.datasources[currDatasourceIndex]
        if (oldDS && newDS.datasource_id === oldDS.datasource_id) {
          if (newDS.processed_file_count > oldDS.processed_file_count
            || newDS.processed_group_count > oldDS.processed_group_count 
            || newDS.processed_user_count > oldDS.processed_user_count
            || newDS.is_push_notifications_enabled > oldDS.is_push_notifications_enabled) {
            //state.datasources[0] = newDS;
            //state.datasourcesMap[newDS["datasource_id"]] = newDS
            state.datasources[currDatasourceIndex] = newDS
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
      var dsList = action.error ? null : [...state.datasources,action.payload]
      var map = {};
      if (dsList) {
        for (var index in dsList) {
          let ds = dsList[index];
          if (ds.datasource_type == "GSUITE")
            ds.logo = "/images/google_logo.png";
          else if (ds.datasource_type == "SLACK")
            ds.logo = "/images/slack_logo.jpeg";
          else if (ds.datasource_type == "GITHUB")
            ds.logo = "/images/github_logo.png"
          map[ds.datasource_id] = ds;
        }
      }
      return {
        ...state,
        datasourceLoading: false,
        datasources: dsList,
        datasourcesMap: map,
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
        entitiy: action.error ? [] : action.payload,
        errorMessage: action.error
      };
    case SET_TRUSTED_ENTITIES:
      var error;
      if (action.error === undefined) {
        error = false
      }
      else {
        error = true
      }
      return {
        ...state,
        trustedEntities: action.error ? [] : action.payload,
        errorMessage: action.error
      };
    case UPDATE_TRUSTED_ENTITIES:
      let trustedEntities = {}
      if (action.actionType === 'SET') {
        let entity = []
        for (let index in action.entityList) {
          entity.push(action.entityList[index]['name'])
        }
        if (action.entityName === 'domain') {
          trustedEntities['trusted_domains'] = entity,
          trustedEntities['trusted_apps'] = state.trustedEntities['trusted_apps'] ? [...state.trustedEntities['trusted_apps']] : []
        }
        else {
          trustedEntities['trusted_domains'] = state.trustedEntities['trusted_domains'] ? [...state.trustedEntities['trusted_domains']] : []
          trustedEntities['trusted_apps'] = entity
        }
      }
      return {
        ...state,
        trustedEntities: trustedEntities
      }
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
    case APPS_PAGE_LOADED:
      return {
        ...state,
        currentView: "/apps"
      };
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
    case GET_ALL_ACTIVITY_EVENTS:
      let all_activity_events_map = {}
      let all_activity_events = []
      let payload = 'payload' in action ? action.payload : {}
      for(let k in payload){
        all_activity_events.push(...Object.keys(payload[k]))
      } 

      let unique_activity_events = (payload ? Array.from(new Set(all_activity_events.map( event_type => event_type))) : []).sort()
      
      return {
        ...state,
        all_activity_events: action.error ? [] : all_activity_events,
        unique_activity_events: unique_activity_events,
        all_activity_events_map: action.error ? {} : payload
      }
    default:
      return state;
  }
};
