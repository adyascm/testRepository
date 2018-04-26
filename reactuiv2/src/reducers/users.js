import {
    USERS_PAGE_LOADED,
    USERS_PAGE_LOAD_START,
    USER_ITEM_SELECTED,
    USERS_ACTIVITY_LOAD_START,
    USERS_ACTIVITY_LOADED,
    USERS_RESOURCE_LOAD_START,
    USERS_RESOURCE_LOADED,
    USERS_RESOURCE_ACTION_LOAD,
    USERS_RESOURCE_ACTION_CANCEL,
    USERS_RESOURCE_SET_FILE_SHARE_TYPE,
    GROUP_SEARCH_PAYLOAD,
    GROUP_SEARCH_EMPTY,
    USERS_GROUP_ACTION_LOAD,
    USERS_OWNED_RESOURCES_LOAD_START,
    USERS_OWNED_RESOURCES_LOADED,
    USERS_RESOURCE_PAGINATION_DATA,
    USERS_RESOURCE_FILTER_CHANGE,
    SET_REDIRECT_PROPS,
    LOGOUT
} from '../constants/actionTypes';

const defaultState = {
    pageNumber: 0,
    pageLimit: 100,
    exposureType: 'EXT',
    isLoadingUsers: false,
    isLoadingUserResources: false,
    isLoadingOwnedUsers: false,
    isLoadingUserActivities: false,
    usersTreePayload: undefined,
    groupSearchPayload: undefined,
    selectedUserItem: undefined,
    userDetailsViewActive: false,
    // selectedUserItem: undefined,
    action: undefined,
    userFilterType: 'EXT',
    hasGroups: false,
    filterExposureType: 'EXT'
}


export default (state = defaultState, action) => {
    switch (action.type) {
        case USERS_PAGE_LOAD_START:
            return {
                ...state,
                isLoadingUsers: true,
                //usersTreePayload: undefined
            }
        case USERS_PAGE_LOADED:
            let usersTreePayload = !action.error?action.payload:[]
            let keys = Object.keys(usersTreePayload)
            for (let index = 0; index < keys.length; index++) {
                if (action.payload[keys[index]].name) {
                    state.hasGroups = true
                    break
                }
            }
            return {
                ...state,
                isLoadingUsers: false,
                usersTreePayload: usersTreePayload,
                groupSearchPayload: undefined
            }
        case GROUP_SEARCH_PAYLOAD:
            return {
                ...state,
                groupSearchPayload: action.payload
            }
        case GROUP_SEARCH_EMPTY:
            return {
                ...state,
                groupSearchPayload: undefined,
                selectedUserItem: undefined
            }
        case USER_ITEM_SELECTED:
            return {
                ...state,
                selectedUserItem: action.payload,
                userDetailsViewActive: true
            }
        case USERS_ACTIVITY_LOAD_START:
            return {
                ...state,
                isLoadingUserActivities: true
            }
        case USERS_ACTIVITY_LOADED:
            state.selectedUserItem.activities = !action.error ? action.payload : [];
            return {
                ...state,
                isLoadingUserActivities: false,
            }
        case USERS_OWNED_RESOURCES_LOAD_START:
            state.selectedUserItem.ownedResources = undefined;
            return {
                ...state,
                isLoadingOwnedUsers: true
            }
        case USERS_OWNED_RESOURCES_LOADED:
            state.selectedUserItem.ownedResources = !action.error?action.payload:[]
            return {
                ...state,
                isLoadingOwnedUsers: false
            }
        case USERS_RESOURCE_LOAD_START:
            state.selectedUserItem.resources = undefined;
            return {
                ...state,
                isLoadingUserResources: true
            }
        case USERS_RESOURCE_LOADED:
            var rows = [];
            if (!action.error) {
                if (action.payload) {
                    var keys = Object.keys(action.payload)

                    for (let index = 0; index < keys.length; index++) {
                        let row = action.payload[keys[index]]
                        for(let pIndex = 0; pIndex < row.permissions.length; pIndex++)
                        {
                            if(state.selectedUserItem.email == row.permissions[pIndex].email)
                            {
                                row.myPermission = row.permissions[pIndex].permission_type
                                break;
                            }
                        }
                        row.isExpanded = row.isExpanded || false;
                        row.key = keys[index];
                        row.depth = 0;
                        if (!row.name)
                            row.name = row.resource_name
                        rows.push(row)
                    }
                }
            }
            if ((state.selectedUserItem.member_type === 'EXT') && !rows.length)
                state.selectedUserItem = undefined
            else
                state.selectedUserItem.resources = rows;

            return {
                ...state,
                isLoadingUserResources: false,
            }
        case USERS_RESOURCE_ACTION_LOAD:
            return {
                ...state,
                action: {
                    key: action.actionType,
                    old_owner_email: state.selectedUserItem.email,
                    user_email: state.selectedUserItem.email,
                    resource_id: action.resource ? action.resource.resource_id : undefined,
                    resource_name: action.resource ? action.resource.resource_name : undefined,
                    resource_owner_id: action.resource ? action.resource.resource_owner_id : undefined,
                    new_permission_role: action.newValue,
                }
            }
        case USERS_GROUP_ACTION_LOAD:
            return{
              ...state,
              action: {
                  key: action.actionType,
                  user_email: state.selectedUserItem.email,
                  group_email: action.groupId
              }
            }
        case USERS_RESOURCE_ACTION_CANCEL:
            return {
                ...state,
                action: undefined
            }
        case USERS_RESOURCE_SET_FILE_SHARE_TYPE:
            return {
                ...state,
                exposureType: action.payload
            }
        case USERS_RESOURCE_PAGINATION_DATA:
            return {
                ...state,
                pageNumber: action.pageNumber,
                pageLimit: action.pageLimit
            }
        case USERS_RESOURCE_FILTER_CHANGE:
            state[action.property] = action.value
            return {
                ...state
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
                if (reducers[index] == "users")
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
