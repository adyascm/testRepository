import {
    USERS_PAGE_LOADED,
    USERS_PAGE_LOAD_START,
    USER_ITEM_SELECTED,
    USERS_ACTIVITY_LOAD_START,
    USERS_ACTIVITY_LOADED,
    USERS_RESOURCE_LOAD_START,
    USERS_RESOURCE_LOADED,
    USERS_RESOURCE_ACTION_LOAD,
    USERS_RESOURCE_ACTION_CANCEL
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
            console.log("user resource payload : ", action.payload)
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
        case USERS_RESOURCE_ACTION_LOAD:
            return {
                ...state,
                action: {
                    actionType: action.actionType,
                    actionResource: action.resource,
                    actionNewValue: action.newValue
                }
            }
            case USERS_RESOURCE_ACTION_CANCEL:
            return {
                ...state,
                action: undefined
            }
        default:
            return state;
    }
};