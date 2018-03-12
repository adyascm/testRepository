import {
    ASYNC_END,
    ADD_APP_MESSAGE,
    CLEAR_MESSAGE,
    SCAN_INCREMENTAL_UPDATE_RECEIVED,
    LOGOUT
} from '../constants/actionTypes';

const defaultState = {
    errorMessage: undefined,
    infoMessage: undefined
  };

export default (state = defaultState, action) => {
    switch (action.type) {
        case ASYNC_END:
            return {
                ...state,
                errorMessage: action.errors,
                infoMessage: undefined
            };
        case ADD_APP_MESSAGE:
            return {
                ...state,
                errorMessage: action.error,
                infoMessage: action.info
            };
        case LOGOUT:
        case CLEAR_MESSAGE:
            return {
                ...state,
                errorMessage: undefined,
                infoMessage: undefined
            };
        case SCAN_INCREMENTAL_UPDATE_RECEIVED:
            var updateMessage = JSON.parse(action.payload);
            return {
                    ...state,
                    infoMessage: "File has been changed, please refresh the app to see the latest changes...",
                    errorMessage: undefined,
                };
        default:
            return state
    }
};