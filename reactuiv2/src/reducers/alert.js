import {
    ALERTS_LOAD_START,
    ALERTS_LOADED,
    FETCH_ALERTS_COUNT,
    RESET_ALERTS_COUNT,
    LOGOUT
} from '../constants/actionTypes'

const defaultState = {
    isLoadingAlert: false,
    alerts: undefined,
    alertsCount: undefined
}

export default (state = defaultState, action) => {
    switch(action.type) {
        case ALERTS_LOAD_START:
            return {
                ...state,
                isLoadingAlert: true
            }
        case ALERTS_LOADED:
            return {
                ...state,
                isLoadingAlert: false,
                alerts: !action.error?action.payload:[]
            }
        case FETCH_ALERTS_COUNT:
            return {
                ...state,
                alertsCount: action.alertsCount
            }
        case RESET_ALERTS_COUNT:
            return {
                ...state,
                alertsCount: undefined
            }
        case LOGOUT:
            return {
                ...defaultState
            }
        default:
            return state
    }
}