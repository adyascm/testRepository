import {
    USERS_TREE_LOADED, 
    USERS_TREE_LOAD_START,
    USERS_TREE_SET_ROW_DATA,
    SELECTED_USER_PARENTS_NAME
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
                usersTree: action.payload
            }
        case USERS_TREE_SET_ROW_DATA:
            return {
                ...state,
                rowData: action.payload
            }
        case SELECTED_USER_PARENTS_NAME:
            return {
                ...state,
                selectedUserParents: action.payload
            }
        default:
            return state;
    }
};