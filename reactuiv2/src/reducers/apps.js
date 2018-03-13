import {
    APPS_ITEM_SELECTED,
    APPS_PAGE_LOADED,
    APPS_PAGE_LOAD_START,
    USER_APPS_LOAD_START,
    USER_APPS_LOADED,
    APP_USERS_LOAD_START,
    APP_USERS_LOADED,
    APPS_SEARCH_PAYLOAD
} from '../constants/actionTypes';


export default (state = {}, action) => {
    switch (action.type) {
        case APPS_PAGE_LOAD_START:
            return {
                ...state,
                isLoading: true
            }
        case APPS_PAGE_LOADED:
            //let appPayLoad = !action.error?action.payload:[]
            return {
                ...state,
                isLoading: false,
                appPayLoad: action.payload,
                appsSearchPayload: undefined
            }
        case APPS_ITEM_SELECTED:
            return {
                ...state,
                selectedAppItem: action.payload,
                appDetailsViewActive: true
            }
        case USER_APPS_LOAD_START:
        return {
            ...state,
            isLoading: true,
        }
        case USER_APPS_LOADED:
            return {
                ...state,
                isLoading:false,
                userApps: action.payload
            }
        case APP_USERS_LOAD_START:
        return {
            ...state,
            isLoading: true,
        }
        case APP_USERS_LOADED:
            return {
                ...state,
                isLoading:false,
                appUsers: action.payload
            }
        case APPS_SEARCH_PAYLOAD:
            return {
                ...state,
                appsSearchPayload: action.payload
            }
        default:
            return state;
    }
};