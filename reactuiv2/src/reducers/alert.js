import {
    ALERTS_LOAD_START,
    ALERTS_LOADED
} from '../constants/actionTypes'

const defaultState = {
    isLoading: false,
    alerts: undefined
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
    }
    return {
        ...defaultState
    }
}