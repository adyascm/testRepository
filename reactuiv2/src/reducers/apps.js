import {
    APPS_ITEM_SELECTED,
    APPS_PAGE_LOADED,
    APPS_PAGE_UNLOADED,
    APPS_PAGE_LOAD_START
} from '../constants/actionTypes';


export default (state = {}, action) => {
    switch (action.type) {
        case APPS_PAGE_LOAD_START:
            return {
                ...state,
                isLoading: true
            }
        case APPS_PAGE_LOADED:
            let appPayLoad = !action.error?action.payload:[]
            return {
                ...state,
                isLoading: false,
                appPayLoad: action.payload
            }
        case APPS_ITEM_SELECTED:
            return {
                ...state,
                selectedAppItem: action.payload,
                appDetailsViewActive: true
            }
        default:
            return state;
    }
};