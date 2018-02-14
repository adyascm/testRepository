import {
    RESOURCES_PAGE_LOADED,
    RESOURCES_PAGE_UNLOADED,
    RESOURCES_PAGE_LOAD_START,
    RESOURCES_TREE_SET_ROW_DATA
} from '../constants/actionTypes';

export default (state = {}, action) => {
    switch (action.type) {
        case RESOURCES_PAGE_LOAD_START:
            return {
                ...state,
                isLoading: true
            }
        case RESOURCES_PAGE_LOADED:
            if (action.parent) {
                var keys = Object.keys(action.payload)
                var children = [];
                for (let index = 0; index < keys.length; index++) {
                    let child = action.payload[keys[index]]
                    child.isExpanded = false;
                    child.key = keys[index];
                    child.depth = action.parent.depth + 1;
                    if (!child.name)
                        child.name = child.resourceName
                    children.push(child)
                }
                action.parent['isExpanded'] = true;
                action.parent['children'] = children;
            }
            else {
                var rows = [];
                if (action.payload) {
                    var keys = Object.keys(action.payload)
        
                    for (let index = 0; index < keys.length; index++) {
                        let row = action.payload[keys[index]]
                        row.isExpanded = row.isExpanded || false;
                        row.key = keys[index];
                        row.depth = 0;
                        if (!row.name)
                            row.name = row.resourceName
                        rows.push(row)
                    }
                }
                state.resourceTree = rows;
            }
            return {
                ...state,
                isLoading: false,
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