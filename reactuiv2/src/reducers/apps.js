import {
    APPS_ITEM_SELECTED,
    APPS_PAGE_LOADED,
    APPS_PAGE_LOAD_START,
    USER_APPS_LOAD_START,
    USER_APPS_LOADED,
    APP_USERS_LOAD_START,
    APP_USERS_LOADED,
    APPS_SEARCH_PAYLOAD,
    SET_REDIRECT_PROPS,
    UPDATE_APPS_DELETE_FLAG,
    LOGOUT
} from '../constants/actionTypes';

const defaultState = {
    appPayLoad: undefined,
    appsSearchPayload: undefined,
    appUsers: undefined,
    isLoadingApps: false,
    isLoadingAppUsers: false,
    isLoadingUserApps: false,
    appDetailsViewActive: false,
    selectedAppItem: undefined,
    appDeleted: false
  };
  
export default (state = defaultState, action) => {
    switch (action.type) {
        case APPS_PAGE_LOAD_START:
            return {
                ...state,
                isLoadingApps: true
            }
        case APPS_PAGE_LOADED:
            let appPayLoad = !action.error?action.payload:[]
            return {
                ...state,
                isLoadingApps: false,
                appPayLoad: appPayLoad,
                appsSearchPayload: undefined,
                appDeleted: false
            }
        case APPS_ITEM_SELECTED:
            return {
                ...state,
                selectedAppItem: action.payload,
                appDetailsViewActive: true
            }
        case UPDATE_APPS_DELETE_FLAG:
            return {
                ...state,
                appDeleted: action.payload
            }
        case USER_APPS_LOAD_START:
        return {
            ...state,
            isLoadingUserApps: true,
        }
        case USER_APPS_LOADED:
            return {
                ...state,
                isLoadingUserApps: false,
                userApps: action.error ? [] : action.payload
            }
        case APP_USERS_LOAD_START:
        return {
            ...state,
            isLoadingAppUsers: true,
        }
        case APP_USERS_LOADED:
            if (action.payload.length === 0)
                state.selectedAppItem = undefined
            return {
                ...state,
                isLoadingAppUsers:false,
                appUsers: action.error ? [] : action.payload
            }
        case APPS_SEARCH_PAYLOAD:
            return {
                ...state,
                appsSearchPayload: action.payload
            }
        case SET_REDIRECT_PROPS:
            var states = {};
            if (action.reducerStates) {
              var reducers = Object.keys(action.reducerStates)
              for (var index in reducers) {
                if (reducers[index] == "apps")
                  states = action.reducerStates[reducers[index]];
              }
            }
            return {
              ...state,
              currentUrl: action.redirectUrl,
              ...states
            }
        case LOGOUT:
            return {
                ...defaultState,
            }
        default:
            return state;
    }
};