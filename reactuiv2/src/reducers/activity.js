import {
  ACTIVITIES_PAGE_LOAD_START,
  ACTIVITIES_PAGE_LOADED,
  ACTIVITIES_SET_ROW_DATA,
  ACTIVITIES_PAGINATION_DATA,
  ACTIVITIES_FILTER_CHANGE,
  LOGOUT,
  SET_REDIRECT_PROPS
} from '../constants/actionTypes';

const defaultState = {
    isLoadingActivities: false,
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
        case ACTIVITIES_PAGE_LOADED:
            return {
                ...state,
                isLoadingActivities: false,
                activitiesDataPayload: !action.error ? action.payload : [],
                activitySearchPayload: undefined
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
            newFilter[action.key] = action.value
            state[action.property] = action.value
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
