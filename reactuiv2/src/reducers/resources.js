import {
    RESOURCES_PAGE_LOADED,
    RESOURCES_PAGE_UNLOADED,
    RESOURCES_PAGE_LOAD_START,
    RESOURCES_TREE_SET_ROW_DATA,
    RESOURCES_TREE_CELL_EXPANDED
} from '../constants/actionTypes';

export default (state = {}, action) => {
    switch (action.type) {
        case RESOURCES_PAGE_LOAD_START:
            return {
                ...state,
                isLoading: true
            }
        case RESOURCES_PAGE_LOADED:
            console.log("resources payload : ", action.payload)
            let keys = Object.keys(action.payload)
            let rows = []
            
            for (let index=0; index<keys.length; index++) {
                rows.push(action.payload[keys[index]])
            }

            return {
                ...state,
                isLoading: false,
                resourceTree: rows
            }
        case RESOURCES_TREE_SET_ROW_DATA:
            return {
                ...state,
                rowData: action.payload
            }
        default:
            return state;
    }
};