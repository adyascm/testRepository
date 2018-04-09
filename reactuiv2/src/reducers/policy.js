import {
    SET_POLICY_FILTER,
    POLICY_LOAD_START,
    POLICY_LOADED,
    LOGOUT
} from '../constants/actionTypes'

const defaultState = {
    policyFilters: undefined,
    policyData: undefined,
    isLoading: false
}

export default (state=defaultState, action) => {
    switch(action.type) {
        case SET_POLICY_FILTER:
            if (action.policyFilterType === 'policyConditions') {
                if (!state[action.policyFilterType])
                    state[action.policyFilterType] = []
                state[action.policyFilterType].push(action.policyFilterValue)
            }
            else 
                state[action.policyFilterType] = action.policyFilterValue
            return {
                ...state
            }
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