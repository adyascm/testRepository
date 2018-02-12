import {
    RESOURCES_PAGE_LOADED,
    RESOURCES_PAGE_UNLOADED,
    RESOURCES_PAGE_LOAD_START
} from '../constants/actionTypes';

export default (state={},action) => {
    switch(action.type) {
        case RESOURCES_PAGE_LOAD_START:
            return {
                ...state,
                isLoading: true
            }
        case RESOURCES_PAGE_LOADED:
            return {
                ...state,
                isloading: false,
                resourceTree: action.payload
            }
        default:
            return state;
    }
};