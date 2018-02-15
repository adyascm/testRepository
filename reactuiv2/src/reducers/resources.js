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
            if (action.parent) {
                var keys = Object.keys(action.payload)
                if (keys.length > 0) {
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
                    action.parent['isExpanded'] = false
                    action.parent['children'] = []
                }
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
                cellExpanded: false
            }
        case RESOURCES_TREE_SET_ROW_DATA:
            return {
                ...state,
                rowData: action.payload
            }
        case RESOURCES_TREE_CELL_EXPANDED:
            return {
                ...state,
                cellExpanded: action.payload
            }
        default:
            return state;
    }
};