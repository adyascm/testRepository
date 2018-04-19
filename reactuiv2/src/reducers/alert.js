import {
    ALERTS_LOAD_START,
    ALERTS_LOADED,
    ALERTS_FETCH_OPEN_ALERTS,
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
        case ALERTS_FETCH_OPEN_ALERTS:
            return {
                ...state,
                openAlerts: action.openAlertsCount
            }
        case LOGOUT:
            break
    }
    return {
        ...defaultState
    }
}