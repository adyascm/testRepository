import {
    USERS_PAGE_LOADED,
    USERS_PAGE_LOAD_START,
    USERS_LIST_PAGE_LOADED,
    USERS_DOMAIN_STATS_LOADED,
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
    ADD_GROUP_MEMBER_ACTION,
    REMOVE_GROUP_MEMBER_ACTION,
    USERS_OWNED_RESOURCES_LOAD_START,
    USERS_OWNED_RESOURCES_LOADED,
    USERS_RESOURCE_PAGINATION_DATA,
    USERS_LIST_PAGINATION_DATA,
    USERS_RESOURCE_FILTER_CHANGE,
    USERS_FILTER_CHANGE,
    SET_REDIRECT_PROPS,
    GROUP_MEMBERS_LOAD_START,
    GROUP_MEMBERS_LOADED,
    USERS_STATS_UDPATE,
    USERS_COLUMN_SORT,
    LOGOUT
} from '../constants/actionTypes';

const defaultState = {
    pageNumber: 0,
    usersListPageNumber: 0,
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
    action: undefined,
    hasGroups: false,
    filterExposureType: 'EXT',
    userStatSubType: "",
    sortColumnName: '',
    sortType: '',
    listFilters: {}
}


export default (state = defaultState, action) => {
    switch (action.type) {
        case USERS_PAGE_LOAD_START:
            return {
                ...state,
                isLoadingUsers: true
            }
        case USERS_PAGE_LOADED:
            let usersTreePayload = !action.error ? action.payload : []
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
        case USERS_DOMAIN_STATS_LOADED:
            return {
                ...state,
                userStats: !action.error ? action.payload : [],
            }
        case USERS_COLUMN_SORT:
            return {
                ...state,
                sortColumnName: action.columnName,
                sortType: action.sortType
            }
        case USERS_LIST_PAGE_LOADED:
            var users = !action.error ? action.payload : [];
            if (state.listFilters.email && state.listFilters.email.value != action.searchKeyword) {
                users = state.usersList;
            }
            return {
                ...state,
                isLoadingUsers: false,
                usersList: users
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
        case GROUP_MEMBERS_LOAD_START:
            return {
                ...state,
                isLoadingGroupMembers: true
            }
        case GROUP_MEMBERS_LOADED:
            state.selectedUserItem.groupMembers = !action.error ? action.payload : []
            return {
                ...state,
                isLoadingGroupMembers: false
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
            state.selectedUserItem.ownedResources = !action.error ? action.payload : []
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
                  let group_emails_for_selected_user = {}
                  for(let index in state.selectedUserItem.groups){
                    group_emails_for_selected_user[state.selectedUserItem.groups[index]['email']] = state.selectedUserItem.groups[index]
                  }
                    var keys = Object.keys(action.payload)
                    for (let index = 0; index < keys.length; index++) {
                        let row = action.payload[keys[index]]
                        for (let pIndex = 0; pIndex < row.permissions.length; pIndex++) {
                            if (state.selectedUserItem.email == row.permissions[pIndex].email) {
                                row.myPermission = row.permissions[pIndex].permission_type
                                break;
                            }
                            else if ((row.permissions[pIndex].email in  group_emails_for_selected_user) &&
                            ((Object.keys(row).indexOf('myPermission') !== -1 && row.myPermission !== 'writer')||
                            (Object.keys(row).indexOf('myPermission') === -1))) {
                                    row.myPermission = row.permissions[pIndex].permission_type
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
            //Removed by Amit, this is not the correct way of handling the issue
            // if ((state.selectedUserItem.member_type === 'EXT') && !rows.length)
            //     state.selectedUserItem = undefined
            // else
            state.selectedUserItem.resources = rows;

            return {
                ...state,
                isLoadingUserResources: false,
            }
        case USERS_RESOURCE_ACTION_LOAD:
            if(action.batchAction){
                return {
                    ...state,
                    action: {
                        key: action.payload.actionType,
                        users_email: action.payload.users_email,
                        users_name: action.payload.users_name,
                        datasource_id: action.payload.datasource_id,
                    }
                }
            }else{
                return {
                    ...state,
                    action: {
                        key: action.actionType,
                        datasource_id: state.selectedUserItem.datasource_id,
                        old_owner_email: state.selectedUserItem.email,
                        full_name: state.selectedUserItem.full_name,
                        user_email: state.selectedUserItem.email,
                        resource_id: action.resource ? action.resource.resource_id : undefined,
                        resource_name: action.resource ? action.resource.resource_name : undefined,
                        resource_owner_id: action.resource ? action.resource.resource_owner_id : undefined,
                        new_permission_role: action.newValue,
                    }
                }
            }
        case USERS_GROUP_ACTION_LOAD:
            return {
                ...state,
                action: {
                    key: action.actionType,
                    user_email: state.selectedUserItem.email,
                    group_email: action.groupId,
                    datasource_id: state.selectedUserItem.datasource_id
                }
            }
        case ADD_GROUP_MEMBER_ACTION:
            return {
                ...state,
                action: {
                    key: action.actionType,
                    datasource_id: state.selectedUserItem.datasource_id,
                    user_email: action.userEmail,
                    group_email: state.selectedUserItem.email
                }
            }
        case REMOVE_GROUP_MEMBER_ACTION:
            let user_email = ''
            let group_email = ''

            if (action.memberType === "parent") {
                user_email = state.selectedUserItem.email,
                    group_email = action.memberEmail
            }
            else {
                user_email = action.memberEmail,
                    group_email = state.selectedUserItem.email
            }
            return {
                ...state,
                action: {
                    key: action.actionType,
                    datasource_id: state.selectedUserItem.datasource_id,
                    user_email: user_email,
                    group_email: group_email
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
        case USERS_LIST_PAGINATION_DATA:
            return {
                ...state,
                usersListPageNumber: action.pageNumber
            }
        case USERS_RESOURCE_FILTER_CHANGE:
            state[action.property] = action.value
            return {
                ...state
            }
        case USERS_FILTER_CHANGE:
            let newFilter = Object.assign({}, state.listFilters);
            if (action.filterValue !== undefined && action.filterValue !== '') {
                newFilter[action.filterName] = { "text": action.filterText, "value": action.filterValue };
            }
            else {
                delete newFilter[action.filterName];
            }
            return {
                ...state,
                listFilters: newFilter,
                userStatSubType: action.filterValue,
                usersListPageNumber: 0,
                selectedUserItem: undefined
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
