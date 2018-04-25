import {
    ALERTS_LOAD_START,
    ALERTS_LOADED,
    FETCH_ALERTS_COUNT,
    LOGOUT
} from '../constants/actionTypes'

const defaultState = {
    isLoadingAlert: false,
    alerts: undefined,
    openAlerts: undefined,
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
        case LOGOUT:
            break
    }
    return {
        ...defaultState
    }
}