import {
    AUDIT_LOG_LOAD_START,
    AUDIT_LOG_LOADED,
    LOGOUT
} from '../constants/actionTypes';

export default (state={}, action) => {
    switch(action.type) {
        case AUDIT_LOG_LOAD_START:
            return {
                ...state,
                isLoading: true
            };
        case AUDIT_LOG_LOADED:
            return {
                ...state,
                isLoading: false,
                log: action.payload
            };
        case LOGOUT:
            return {
                ...state,
                log: undefined
            }
        default:
            return state
    }
};
