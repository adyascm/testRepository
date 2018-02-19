import {
    USERS_PAGE_LOADED,
    USERS_PAGE_LOAD_START,
    USER_ITEM_SELECTED,
    USERS_ACTIVITY_LOAD_START,
    USERS_ACTIVITY_LOADED,
    USERS_RESOURCE_LOAD_START,
    USERS_RESOURCE_LOADED,
    USER_DETAILS_SECTION_CLOSE
} from '../constants/actionTypes';


export default (state = {}, action) => {
    switch (action.type) {
        case USERS_PAGE_LOAD_START:
            return {
                ...state,
                isLoading: true
            }
        case USERS_PAGE_LOADED:
            let usersTreePayload = action.payload
            return {
                ...state,
                isLoading: false,
                usersTreePayload: action.payload
            }
        case USER_ITEM_SELECTED:
            return {
                ...state,
                selectedUserItem: action.payload
            }
        case USER_DETAILS_SECTION_CLOSE:
            return {
                ...state,
                selectedUserItem: action.payload
            }
        case USERS_ACTIVITY_LOAD_START:
            return {
                ...state,
                isActivitiesLoading: true
            }
        case USERS_ACTIVITY_LOADED:
            state.selectedUserItem.activities = JSON.parse(action.payload);
            return {
                ...state,
                isActivitiesLoading: false,
            }
        case USERS_RESOURCE_LOAD_START:
            return {
                ...state,
                isResourcesLoading: true
            }
        case USERS_RESOURCE_LOADED:
            var rows = [];
            if (action.payload) {
                var keys = Object.keys(action.payload)

                for (let index = 0; index < keys.length; index++) {
                    let row = action.payload[keys[index]]
                    row.myPermission = row.permissions[0].permissionType
                    row.isExpanded = row.isExpanded || false;
                    row.key = keys[index];
                    row.depth = 0;
                    if (!row.name)
                        row.name = row.resourceName
                    rows.push(row)
                }
            }
            state.selectedUserItem.resources = rows;
            return {
                ...state,
                isResourcesLoading: false,
            }
        default:
            return state;
    }
};