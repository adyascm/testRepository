import {
    SET_POLICY_FILTER,
    POLICY_LOAD_START,
    POLICY_LOADED,
    UPDATE_POLICY_FILTER,
    LOGOUT
} from '../constants/actionTypes'

const defaultState = {
    policyData: undefined,
    isLoading: false
}

export default (state=defaultState, action) => {
    switch(action.type) {
        case POLICY_LOAD_START:
            return {
                ...state,
                isLoading: true
            }
        case POLICY_LOADED:
            console.log("policy loaded : ", action.payload)
            return {
                ...state,
                policyData: !action.error?action.payload:[],
                isLoading: false
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