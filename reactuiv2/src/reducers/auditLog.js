import {
    AUDIT_LOG_LOAD_START,
    AUDIT_LOG_LOADED
} from '../constants/actionTypes';

export default (state={}, action) => {
    switch(action.type) {
        case AUDIT_LOG_LOAD_START:
            return {
                ...state,
                isLoading: true
            };
        case AUDIT_LOG_LOADED:
            console.log("audit Log : ", action.payload)
            return {
                ...state,
                isLoading: false,
                auditlog: action.payload
            };
        default:
            return state
    }
};