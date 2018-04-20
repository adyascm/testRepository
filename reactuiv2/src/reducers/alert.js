import {
    ALERTS_LOAD_START,
    ALERTS_LOADED,
    FETCH_ALERTS_COUNT,
    LOGOUT
} from '../constants/actionTypes'

const defaultState = {
    isLoading: false,
    alerts: undefined,
    openAlerts: undefined
}

export default (state = defaultState, action) => {
    switch(action.type) {
        case ALERTS_LOAD_START:
            return {
                ...state,
                isLoading: true
            }
        case ALERTS_LOADED:
            return {
                ...state,
                isLoading: false,
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