import React, { Component } from 'react';
import { Dropdown } from 'semantic-ui-react'
import { connect } from 'react-redux';
import ExportCsvModal from './ExportCsvModal'
import agent from '../utils/agent';
import { USERS_RESOURCE_ACTION_LOAD, RESOURCES_ACTION_LOAD, DELETE_APP_ACTION_LOAD } from '../constants/actionTypes';

const mapStateToProps = state => ({
    ...state.users,
    ...state.common,
    ...state.resources
});

const mapDispatchToProps = dispatch => ({
    onMultiUsersAction: (payload, multiSelectAction) =>
        dispatch({ type: USERS_RESOURCE_ACTION_LOAD, payload, multiSelectAction }),
    onMultiResourcesAction: (payload, multiSelectAction) =>
        dispatch({ type: RESOURCES_ACTION_LOAD, payload, multiSelectAction }),
    onMultiDeleteAppAction: (payload, multiSelectAction) => dispatch({ type: DELETE_APP_ACTION_LOAD, payload, multiSelectAction })
})

class ActionsMenuBar extends Component {
    constructor(props) {
        super(props)
    }

    triggerActionOnMultiSelect(actionKey, viewType) {
        if (actionKey) {
            let payload = null
            if (viewType == 'USERS') {
                payload = {
                    actionType: actionKey,
                    users_email: [],
                    datasource_id: null
                }
                for (let i in this.props.selectedRowFields) {
                    if (this.props.selectedRowFields[i]) {
                        let entity_obj = this.props.entityList[i];
                        let user_ds_type_is_gsuite = this.props.datasourcesMap[entity_obj["datasource_id"]].datasource_type == 'GSUITE'
                        if (user_ds_type_is_gsuite && entity_obj.type == 'USER')
                            payload.users_email.push(entity_obj["email"])
                        if (!payload.datasource_id && user_ds_type_is_gsuite)
                            payload.datasource_id = entity_obj["datasource_id"]
                    }
                }
                if (actionKey == 'remove_all_access_for_multiple_users') {
                    // FOR NOW NO ADDITIONAL OPERATIONS
                }
                else if (actionKey == 'notify_multiple_users_for_clean_up') {
                    payload.users_name = []
                    for (let i in this.props.selectedRowFields) {
                        if (this.props.selectedRowFields[i]) {
                            let entity_obj = this.props.entityList[i];
                            let entity_ds_type_is_gsuite = this.props.datasourcesMap[entity_obj["datasource_id"]].datasource_type == 'GSUITE'
                            if (entity_ds_type_is_gsuite && entity_obj.type == 'USER') {
                                payload.users_name.push(entity_obj["full_name"]);
                            }
                        }
                    }
                }
                this.props.onMultiUsersAction(payload, true)
            } else if (viewType == 'RESOURCES') {
                payload = {
                    actionType: actionKey,
                    resources_ids: [],
                    resources_names: [],
                    datasource_id: null
                }
                for (let i in this.props.selectedRowFields) {
                    let entity_obj = this.props.entityList[i];
                    let entity_ds_type_is_gsuite = this.props.datasourcesMap[entity_obj["datasource_id"]].datasource_type == 'GSUITE'
                    if (entity_ds_type_is_gsuite) {
                        payload.resources_ids.push(entity_obj['resource_id'])
                        payload.resources_names.push(entity_obj['resource_name'])
                    }
                    if (!payload.datasource_id && entity_ds_type_is_gsuite)
                        payload.datasource_id = entity_obj["datasource_id"]
                }
                if (actionKey == 'change_owner_of_multiple_files') {
                    payload.old_owner_emails = []
                    for (let i in this.props.selectedRowFields) {
                        let entity_obj = this.props.entityList[i];
                        let entity_ds_type_is_gsuite = this.props.datasourcesMap[entity_obj["datasource_id"]].datasource_type == 'GSUITE'
                        if (entity_ds_type_is_gsuite) {
                            payload.old_owner_emails.push(entity_obj['resource_owner_id'])
                        }
                    }
                }
                else if (actionKey == 'remove_external_access_to_mutiple_resources' || actionKey == 'make_multiple_resources_private') {
                    // FOR NOW NO ADDITIONAL OPERATIONS
                }
                this.props.onMultiResourcesAction(payload, true)
            }
            else if (viewType == 'APPS') {
                if (actionKey == 'remove_multiple_apps_for_domain') {
                    payload = {
                        actionType: actionKey,
                        apps_ids: [],
                        apps_names: [],
                    }
                    for (let i in this.props.selectedRowFields) {
                        let entity_obj = this.props.entityList[i];
                        payload.apps_ids.push(entity_obj['id'])
                        payload.apps_names.push(entity_obj['display_text'])
                    }
                }
                this.props.onMultiDeleteAppAction(payload, true)
            }
            this.props.disableAllRowsChecked()
        }
    }

    render() {

        let gsuiteItems = null
        let systemItems = null
        if (this.props.viewType != 'APPS') {
            systemItems = (<Dropdown.Item><ExportCsvModal isResourceView={this.props.isResourceView} columnHeaders={this.props.columnHeaderDataNameMap} apiFunction={agent.Resources.exportToCsv} filterMetadata={this.props.filterMetadata} /></Dropdown.Item>)
            gsuiteItems = this.props.gsuiteOptns.map(item => {
                return (<Dropdown.Item disabled={!this.props.showActionBar}>
                    <span size="mini" onClick={() => this.triggerActionOnMultiSelect(item.actionKey, this.props.viewType)}>{item.actionText}</span>
                </Dropdown.Item>)
            })
        } else {
            systemItems = this.props.systemOptns && this.props.systemOptns.map(item => {
                return (<Dropdown.Item disabled={!this.props.showActionBar}>
                    <span size="mini" onClick={() => this.triggerActionOnMultiSelect(item.actionKey, this.props.viewType)}>{item.actionText}</span>
                </Dropdown.Item>)
            })
        }

        return (
            <Dropdown button style={{ float: 'left' }} item text='Actions'>
                <Dropdown.Menu>
                    {systemItems ?
                        <Dropdown.Item>
                                <Dropdown text='System'>
                                    <Dropdown.Menu>
                                        {systemItems}
                                    </Dropdown.Menu>
                                </Dropdown> 
                        </Dropdown.Item> :
                        null       
                    }
                    
                    {gsuiteItems ?
                        <Dropdown.Item>
                            <Dropdown text='GSuite'>
                                <Dropdown.Menu>
                                    {gsuiteItems}
                                </Dropdown.Menu>
                            </Dropdown>
                        </Dropdown.Item>    
                        : null
                    }
                    
                </Dropdown.Menu>
            </Dropdown>
        )
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(ActionsMenuBar);