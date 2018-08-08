import {
    RESOURCES_PAGE_LOADED,
    RESOURCES_PAGE_LOAD_START,
    RESOURCES_TREE_SET_ROW_DATA,
    RESOURCES_ACTION_LOAD,
    RESOURCES_ACTION_CANCEL,
    RESOURCES_FILTER_CHANGE,
    RESOURCES_SEARCH_PAYLOAD,
    RESOURCES_SEARCH_EMPTY,
    RESOURCES_PAGINATION_DATA,
    SET_REDIRECT_PROPS,
    LOGOUT
} from '../constants/actionTypes';

const defaultState = {
    isLoadingResources: false,
    resourceTree: undefined,
    rowData: undefined,
    resourceSearchPayload: undefined,
    action: undefined,
    filterExposureType: '',
    filterResourceName: '',
    filterResourceType: '',
    filterEmailId: '',
    filterParentFolder: '',
    filterByDate: '',
    filterSourceType: '',
    pageNumber: 0,
    pageLimit: 50
};

export default (state = defaultState, action) => {
    switch (action.type) {
        case RESOURCES_PAGE_LOAD_START:
            return {
                ...state,
                isLoadingResources: true,
                rowData: undefined
            }
        case RESOURCES_PAGE_LOADED:
            return {
                ...state,
                isLoadingResources: false,
                resourceTree: !action.error ? action.payload : [],
                resourceSearchPayload: undefined
            }
        case RESOURCES_PAGINATION_DATA:
            return {
                ...state,
                pageNumber: action.pageNumber,
                pageLimit: action.pageLimit
            }
        case RESOURCES_SEARCH_PAYLOAD:
            return {
                ...state,
                resourceSearchPayload: action.payload,
                prefix: action.prefix
            }
        case RESOURCES_SEARCH_EMPTY:
            return {
                ...state,
                resourceSearchPayload: undefined,
                prefix: undefined
            }
        case RESOURCES_TREE_SET_ROW_DATA:
            return {
                ...state,
                rowData: action.payload
            }
        case RESOURCES_ACTION_LOAD:
            return {
                ...state,
                action: {
                    key: action.actionType,
                    datasource_id: state.rowData.datasource_id,
                    resource_id: state.rowData.resource_id,
                    resource_name: state.rowData.resource_name,
                    old_owner_email: state.rowData.resource_owner_id,
                    resource_owner_id: state.rowData.resource_owner_id,
                    new_permission_role: action.newValue,
                    user_email: action.permission ? action.permission.email : undefined,
                    user_type: action.permission ? action.permission.type: undefined
                }
            }
        case RESOURCES_ACTION_CANCEL:
            return {
                ...state,
                action: undefined
            }
        case RESOURCES_FILTER_CHANGE:
            state[action.property] = action.value
            return {
                ...state,
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
