import {
    APPS_ITEM_SELECTED,
    APPS_PAGE_LOADED,
    APPS_PAGE_LOAD_START,
    USER_APPS_LOAD_START,
    USER_APPS_LOADED,
    APP_USERS_LOAD_START,
    APP_USERS_LOADED,
    APPS_SEARCH_PAYLOAD,
    APPS_ACTION_CANCEL,
    APPS_ACTION_LOAD,
    APPS_SEARCH_EMPTY,
    SET_REDIRECT_PROPS,
    UPDATE_APPS_DELETE_FLAG,
    DELETE_APP_ACTION_LOAD,
    LOGOUT,
    APPS_PAGINATION_DATA
}   from '../constants/actionTypes';


const defaultState = {
    appsSearchPayload: undefined,
    appUsers: undefined,
    isLoadingApps:false,
    isLoadingAppUsers: false,
    isLoadingUserApps: false,
    appDetailsViewActive: false,
    selectedAppItem: undefined,
    appDeleted: false,
    action: undefined,
    lastPage:undefined,
    appsPayload:undefined,
    sortColumnName:'score',
    sortOrder: 'desc',
    pageNumber: 0,
    pageLimit: 10
};

export default (state = defaultState, action) => {
    switch (action.type) {
        case APPS_PAGE_LOAD_START:
            return{
                ...state,
                isLoadingApps:true
            }
        case APPS_PAGE_LOADED:
            let payload = []
            let lastPage = null
            if(!action.error){
                lastPage = action.payload.last_page ? action.payload.last_page : null
                payload = action.payload.apps
            }
            return {
                ...state,
                lastPage:lastPage,
                isLoadingApps:false,
                appsPayload: payload
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
            var users = action.error ? [] : action.payload
            return {
                ...state,
                isLoadingAppUsers:false,
                appUsers: (state.selectedAppItem && action.appId === state.selectedAppItem.id) ? users : state.appUsers
            }
        case APPS_SEARCH_PAYLOAD:
            return {
                ...state,
                appsSearchPayload: action.payload
            }
        case APPS_SEARCH_EMPTY:
            return {
                ...state,
                appsSearchPayload: undefined,
                selectedAppItem: undefined
            }
        case APPS_ACTION_LOAD:
            return {
                ...state,
                action: {
                    key: action.actionType,
                    user_email: action.email,
                    app_id: action.appId,
                    datasource_id: action.datasourceId
                }
            }
        case APPS_ACTION_CANCEL:
            return {
                ...state,
                action: undefined
            }
        case DELETE_APP_ACTION_LOAD:
            return {
                ...state,
                action: {
                    key: action.payload.actionType,
                    app_id: action.payload.app_id,
                    app_name: action.payload.app_name
                }
            }
        case APPS_PAGINATION_DATA:
            return {
                ...state,
                pageNumber: action.pageNumber,
                pageLimit: action.pageLimit
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
                ...defaultState
            }
        default:
            return state
    }
};
