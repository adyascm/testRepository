import {
    USERS_TREE_LOADED, USERS_TREE_LOAD_START
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
        default:
            return state;
    }
};