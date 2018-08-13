import {
    ACTIVITIES_PAGE_LOAD_START,
    ACTIVITIES_PAGE_LOADED,
    ACTIVITIES_CHART_LOAD_START,
    ACTIVITIES_CHART_LOADED,
    ACTIVITIES_SET_ROW_DATA,
    ACTIVITIES_PAGINATION_DATA,
    ACTIVITIES_FILTER_CHANGE,
    LOGOUT,
    SET_REDIRECT_PROPS
} from '../constants/actionTypes';

const defaultState = {
    isLoadingActivities: false,
    isLoadingActivitiesChart: false,
    rowData: undefined,
    activitiesDataPayload: undefined,
    activitySearchPayload: undefined,
    filterConnectorType: '',
    filterEventType: '',
    filteractor: '',
    filterByDate: '',
    pageNumber: 0,
    pageLimit: 100,
    filterList: {}
};

export default (state = defaultState, action) => {
    switch (action.type) {
        case ACTIVITIES_PAGE_LOAD_START:
            return {
                ...state,
                isLoadingActivities: true,
                rowData: undefined
            }
        case ACTIVITIES_CHART_LOAD_START:
            return {
                ...state,
                isLoadingActivitiesChart: true,
                rowData: undefined
            }
        case ACTIVITIES_PAGE_LOADED:
            return {
                ...state,
                isLoadingActivities: false,
                activitiesDataPayload: !action.error ? action.payload : [],
                activitySearchPayload: undefined
            }
        case ACTIVITIES_CHART_LOADED:
            return {
                ...state,
                isLoadingActivitiesChart: false,
                activitiesChartDataPayload: !action.error ? action.payload : [],
            }
        case ACTIVITIES_PAGINATION_DATA:
            return {
                ...state,
                pageNumber: action.pageNumber,
                pageLimit: action.pageLimit
            }
        case ACTIVITIES_SET_ROW_DATA:
            return {
                ...state,
                rowData: action.payload
            }
        case ACTIVITIES_FILTER_CHANGE:
            let newFilter = Object.assign({}, state.filterList);
            if(action.clearFilter){
                if(action.property == 'filterEventType' || action.property == 'filterConnectorType'){
                    if(!(action.property in newFilter)){
                        newFilter[action.property] = {}
                    }
                }else if(action.property == 'filterByDate'){
                    newFilter[action.property] = ''
                }
            }else{
                if(action.property == 'filterEventType' || action.property == 'filterConnectorType'){
                    if(!(action.property in newFilter)){
                        newFilter[action.property] = {}
                    }
                    newFilter[action.property][action.key] = action.value
                }else if(action.property == 'filterByDate'){
                    newFilter[action.property] = action.value 
                }
            }
            return {
                ...state,
                filterList: newFilter
            }
        case LOGOUT:
            return {
                ...defaultState
            }
        case SET_REDIRECT_PROPS:
            var states = {};
            if (action.reducerStates) {
                var reducers = Object.keys(action.reducerStates)
                for (var index in reducers) {
                    if (reducers[index] == "resources")
                        states = action.reducerStates[reducers[index]];
                }
            }
            return {
                ...state,
                ...states
            }
        default:
            return state;
    }
};
