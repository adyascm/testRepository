import {
    DASHBOARD_PAGE_LOADED,
    DASHBOARD_WIDGET_LOADED,
    DASHBOARD_WIDGET_LOAD_START
} from '../constants/actionTypes';

export default (state = {}, action) => {
    switch (action.type) {
        case DASHBOARD_PAGE_LOADED:
            return state;
        case DASHBOARD_WIDGET_LOAD_START:
            state[action.widgetId] = {isLoaded: false};
            return {
                ...state,

            }
        case DASHBOARD_WIDGET_LOADED:
            state[action.widgetId] = {isLoaded: true, data: action.payload};
            return {
                ...state,

            }
        default:
            return state;
    }
};