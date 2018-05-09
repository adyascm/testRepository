import {
    ASYNC_END,
    FLAG_ERROR_MESSAGE,
    CLEAR_MESSAGE,
    SCAN_INCREMENTAL_UPDATE_RECEIVED,
    LOGOUT
} from '../constants/actionTypes';

const defaultState = {
    errorMessage: [],
    infoMessage: [],
    errorCount: 0,
    warningCount: 0
};

export default (state = defaultState, action) => {
    switch (action.type) {
        case ASYNC_END:
            if (action.errors) {
                if (!state.errorCount ||
                    state.errorMessage.indexOf(action.errors) < 0) {
                    state.errorMessage.push(action.errors)
                    state.errorCount = state.errorCount + 1
                }
            }
            break

        case FLAG_ERROR_MESSAGE:
            if (action.error) {
                if (!state.errorCount ||
                    state.errorMessage.indexOf(action.error) < 0) {
                    state.errorMessage.push(action.error)
                    state.errorCount = state.errorCount + 1
                }
            }
            if (action.info) {
                if (!state.warningCount ||
                    state.infoMessage.indexOf(action.info) < 0) {
                    state.infoMessage.push(action.info)
                    state.warningCount = state.warningCount + 1
                }
            }
            break

        case LOGOUT:
        case CLEAR_MESSAGE:
            defaultState.errorMessage = defaultState.infoMessage = []
            return {
                ...defaultState
            }

        case SCAN_INCREMENTAL_UPDATE_RECEIVED:
            var msg = "File has been changed, please refresh the app to see the latest changes...";
            if (!state.warningCount ||
                state.infoMessage.indexOf(msg) < 0) {
                state.infoMessage.push(msg)
                state.warningCount = state.warningCount + 1
            }
            break
    }
    return {
        ...state
    }
};