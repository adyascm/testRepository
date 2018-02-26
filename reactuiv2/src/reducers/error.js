import {
        ASYNC_END,
        CLEAR_ERROR
} from '../constants/actionTypes';

export default (state={}, action) => {
    switch(action.type) {
        case ASYNC_END:
            return {
                ...state,
                errMessage: action.errors
            };
        case CLEAR_ERROR:
            return {
                ...state,
                errMessage: undefined
            };
        default:
            return state
    }
};