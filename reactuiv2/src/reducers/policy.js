import {
    SET_POLICY_FILTER,
    POLICY_LOAD_START,
    POLICY_LOADED,
    UPDATE_POLICY_FILTER,
    UPDATE_POLICY_ACTION_EMAIL,
    LOGOUT
} from '../constants/actionTypes'

const defaultState = {
    policyData: undefined,
    isLoadingPolicy: false,
    actionEmail: undefined
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
        case UPDATE_POLICY_ACTION_EMAIL:
            let actionEmail = state.actionEmail ? [...state.actionEmail] : []
            if (action.actionType === 'SET') {
                actionEmail.push(action.email)
            }
            else if (action.actionType === 'UNSET') {
                let index = actionEmail.indexOf(action.email)
                actionEmail.splice(index,1)
            }
            else if (action.actionType === 'SETMULTIPLE') {
                actionEmail = [...action.email]
            }
            else if (action.actionType === 'CLEAR') {
                actionEmail = undefined
            }
            return {
                ...state,
                actionEmail: actionEmail
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