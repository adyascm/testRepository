

import {
    USERS_ACTIVITY_LOAD_START,
    USERS_ACTIVITY_LOADED
} from '../constants/actionTypes';


export default (state = {}, action) => {
    switch (action.type) {
        case USERS_ACTIVITY_LOAD_START:
            return {
                ...state,
                isLoading: true,
                activities: [],
                currentlySelectedUser: action.payload
            }
        case USERS_ACTIVITY_LOADED:
            return {
                ...state,
                isLoading: false,
                activities: JSON.parse(action.payload)
            }
        default:
            return state;
    }
};
