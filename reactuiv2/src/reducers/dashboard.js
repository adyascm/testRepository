import {
    DASHBOARD_PAGE_LOADED,
    DASHBOARD_WIDGET_LOADED,
    DASHBOARD_WIDGET_LOAD_START,
    DASHBOARD_REDIRECT_TO_PARAM,
    LOGOUT
} from '../constants/actionTypes';

const defaultState = {
    isLoadingWidget: false
};

export default (state = defaultState, action) => {
    switch (action.type) {
        case DASHBOARD_PAGE_LOADED:
            return state;
        case DASHBOARD_WIDGET_LOAD_START:
            state[action.widgetId] = {isLoadingWidget: false};
            return {
                ...state
            }
        case DASHBOARD_WIDGET_LOADED:
            let errorPayload
            if (action.widgetId.includes("Count"))
                errorPayload = 0
            else 
                errorPayload = {totalCount:0, rows: []}
            state[action.widgetId] = {isLoadingWidget: true, data: !action.error?action.payload:errorPayload};
            return {
                ...state
            }
        case DASHBOARD_REDIRECT_TO_PARAM: 
            return {
                ...state,
                redirectTo: action.redirectTo,
                filterType: action.filterType
            }
        case LOGOUT:
            return {
                ...defaultState
            }
        default:
            return state;
    }
};