import {
    SET_POLICY_FILTER,
    POLICY_LOAD_START,
    POLICY_LOADED,
    UPDATE_POLICY_FILTER,
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
            else if (action.policyFilterType === 'policyActions') {
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
        case UPDATE_POLICY_FILTER:
            let policy = action.payload
            state.name = policy?policy.name:undefined
            state.description = policy?policy.description:undefined
            state.policyType = policy?policy.trigger_type:undefined
            state.policyConditions = policy?policy.conditions:undefined
            state.policyActions = policy?policy.actions:undefined
            // state.actionType = policy?policy.actions[0].action_type:undefined
            return {
                ...state
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