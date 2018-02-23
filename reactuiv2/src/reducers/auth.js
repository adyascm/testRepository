import {
    APP_LOAD,
    LOGIN,
    LOGIN_SUCCESS,
    LOGIN_ERROR,
    LOGIN_PAGE_UNLOADED,
    ASYNC_START,
    LOGIN_START
} from '../constants/actionTypes';

export default (state = {}, action) => {
    switch (action.type) {
        case APP_LOAD:
            return {
                ...state,
                errors: action.error ? {"": action.payload} : null
            };
        case LOGIN_START:
            return {
                ...state,
                inProgress: true,
                errors: null
            }
        case LOGIN_SUCCESS:
        case LOGIN:
            return {
                ...state
            };
        case LOGIN_SUCCESS:
        case LOGIN_ERROR:
            return {
                ...state,
                inProgress: false,
                errors: action.error || null
            };
        case ASYNC_START:
            if (action.subtype === LOGIN ) {
              return { ...state, inProgress: true };
            }
            return { ...state };
        case LOGIN_PAGE_UNLOADED:
            return {};
        default:
            return state;
    }
};