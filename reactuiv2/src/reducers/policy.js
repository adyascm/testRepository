import {
    SET_POLICY_FILTER,
    POLICY_LOAD_START,
    POLICY_LOADED,
    UPDATE_POLICY_FILTER,
    LOGOUT
} from '../constants/actionTypes'

const defaultState = {
    policyData: undefined,
    isLoadingPolicy: false
}

export default (state=defaultState, action) => {
    switch(action.type) {
        case POLICY_LOAD_START:
            return {
                ...state,
                isLoadingPolicy: true
            }
        case POLICY_LOADED:
            return {
                ...state,
                policyData: !action.error?action.payload:[],
                isLoadingPolicy: false
            }
        case LOGOUT:
            return {
                ...defaultState
            }
        default:
            return {
                ...state
            }
    } 
};