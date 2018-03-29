import {
    SET_POLICY_ROW_FILTERS
} from '../constants/actionTypes'


export default (state={}, action) => {
    switch(action.type) {
        case SET_POLICY_ROW_FILTERS:
            return {
                ...state,
                policyFilters: action.payload
            }
        default:
            return {
                ...state
            }
    } 
};