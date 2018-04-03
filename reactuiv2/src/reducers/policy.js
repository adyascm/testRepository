import {
    SET_POLICY_ROW_FILTERS,
    SET_POLICY_FILTER,
    CREATE_POLICY_LOAD_START,
    CREATE_POLICY_LOADED,
    LOGOUT
} from '../constants/actionTypes'

const defaultState = {
    policyFilters: undefined,
    policyData: undefined,
    isLoading: false
}

export default (state=defaultState, action) => {
    switch(action.type) {
        case SET_POLICY_ROW_FILTERS:
            return {
                ...state,
                policyFilters: action.payload
            }
        case SET_POLICY_FILTER:
            if (action.policyFilterType === 'filterType' || 
                action.policyFilterType === 'filterCondition' ||
                action.policyFilterType === 'filterValue')
                    state[action.policyFilterType].push(action.policyFilterValue)
            else 
                state[action.policyFilterType] = action.policyFilterValue
            return {
                ...state
            }
        case CREATE_POLICY_LOAD_START:
            return {
                ...state,
                isLoading: true
            }
        case CREATE_POLICY_LOADED:
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