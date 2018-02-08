import {
    USERS_TREE_LOADED, USERS_TREE_LOAD_START,USERS_TREE_SET_ROW_DATA,USERS_TREE_GET_ROW_DATA
} from '../constants/actionTypes';


export default (state = {}, action) => {
    switch (action.type) {
        case USERS_TREE_LOAD_START:
            return {
                ...state,
                isLoading: true

            }
        case USERS_TREE_LOADED:
            return {
                ...state,
                isLoading: false,
                usersTree: JSON.parse(action.payload)
            }
        case USERS_TREE_SET_ROW_DATA:
            return {
                ...state,
                rowData: action.payload
            }
        default:
            return state;
    }
};