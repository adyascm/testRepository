import {
    USERS_TREE_LOADED, 
    USERS_TREE_LOAD_START,
    USERS_TREE_SET_ROW_DATA,
    SELECTED_USER_PARENTS_NAME
} from '../constants/actionTypes';


export default (state = {}, action) => {
    switch (action.type) {
        case USERS_TREE_LOAD_START:
            return {
                ...state,
                isLoading: true

            }
        case USERS_TREE_LOADED:
            let usersTreePayload = action.payload
            let rows = []
            let emailRowMap = {}
            let keys = Object.keys(usersTreePayload)
            
            for (let index=0; index<keys.length; index++) {
                let rowItem = usersTreePayload[keys[index]]
                rowItem.key = keys[index]
                emailRowMap[keys[index]] = index;
                rowItem.type = "group";
                if (rowItem.depth === undefined)
                    rowItem.depth = 0
                rowItem.isExpanded = rowItem.isExpanded || false
                if (!rowItem.name) {
                    rowItem.type = "user";
                    rowItem.name = rowItem.firstName + " " + rowItem.lastName + " [" + keys[index] + "]";
                }

                let childRows = []
                if (rowItem.children) {
                    for (let index=0; index<rowItem.children.length; index++) {
                        let childRowItem = Object.assign({},usersTreePayload[rowItem.children[index]])
                        childRowItem.key = rowItem.children[index]
                        if (childRowItem.depth === undefined)
                            childRowItem.depth = 0
                        childRowItem.isExpanded = childRowItem.isExpanded || false
                        childRowItem.type = "group"
                        if (!childRowItem.name) {
                            childRowItem.type = "user"
                            childRowItem.name = childRowItem.firstName + " " + childRowItem.lastName + " [" + childRowItem.key + "]";
                        }
                        childRows.push(childRowItem)
                    }
                }

                if (childRows.length > 0) {
                    let rowItemCopy = Object.assign({},rowItem)
                    rowItemCopy.children = childRows
                    rows.push(rowItemCopy)
                    rowItem = Object.assign({},rowItemCopy)
                }
                else 
                    rows.push(rowItem)
            }

            console.log("user group nodes : ",rows)
            console.log("user email map : ", emailRowMap)
            return {
                ...state,
                isLoading: false,
                usersTree: rows,
                emailRowMap: emailRowMap
            }
        case USERS_TREE_SET_ROW_DATA:
            return {
                ...state,
                rowData: action.payload
            }
        case SELECTED_USER_PARENTS_NAME:
            return {
                ...state,
                selectedUserParents: action.payload
            }
        default:
            return state;
    }
};