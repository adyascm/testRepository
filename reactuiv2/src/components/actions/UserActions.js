
import React, { Component } from 'react'
import { Button, Header, Modal, Form } from 'semantic-ui-react'
import { connect } from 'react-redux';
import agent from '../../utils/agent'
import authenticate from '../../utils/oauth';
import GroupSearch from '../Search/GroupSearch';
import ActionsFormInput from './ActionsFormInput'

import {
    USERS_RESOURCE_ACTION_CANCEL,
    CREATE_SCHEDULED_REPORT
} from '../../constants/actionTypes';

const mapStateToProps = state => ({
    logged_in_user : state.common.currentUser,
    all_actions_list: state.common.all_actions_list,
    action: state.users.action,
    selectedUser: state.users.selectedUserItem,
    ...state.common
});

const mapDispatchToProps = dispatch => ({
    onCancelAction: () =>
        dispatch({ type: USERS_RESOURCE_ACTION_CANCEL })
});

class UserActions extends Component {
    constructor(props) {
        super(props);
        this.state = {
            inProgress: false,
            isUserAction: true
        };
        this.updateState = this.updateState.bind(this);
    }
    takeAction = (action) => (ev) => {
        ev.preventDefault();
        this.setState({ inProgress: true });
        authenticate("drive_action_scope").then(res => {
            action();
        }).catch(error => {
            this.setState({ inProgress: false });
        });
    }

    getActionParameters = (populate) => {
      for(let i=0; i<this.props.all_actions_list.length; i=i+1) {
        let act = this.props.all_actions_list[i]
        console.log("action: " + act['Name'])
        console.log("act_type:" + this.props.action['actionType'])
        if (act['Name'] == this.props.action['actionType']) {
          console.log("found parameters" + act['Parameters'])
          let parameters = act['Parameters'];
          if (populate) {
            for(let key of Object.keys(parameters)) {
              parameters[key] = this.state.parameters_map[key];
            }
          }
          return parameters;
        }
      }
    }




  build_action_payload_and_post = () => {

    if(this.props.action['actionType'] === "watchAllActions"){
      var reportFormInput = {};
      reportFormInput.name = "watch_"+ this.props.selectedUser.key
      reportFormInput.description = "watch action report"
      reportFormInput.frequency = "cron(0 9 ? * 2 *)"
      reportFormInput.receivers = this.props.logged_in_user['email']
      reportFormInput.report_type = "Activity"
      reportFormInput.selected_entity_type = "user"
      reportFormInput.selected_entity = this.props.selectedUser.key
      reportFormInput.selected_entity_name = this.props.selectedUser.key
      reportFormInput.is_active = 0
      reportFormInput.datasource_id = this.props.datasources[0]['datasource_id']

      agent.Scheduled_Report.createReport(reportFormInput)
                    .then(resp => { console.log(resp);
                          this.setState({ inProgress: false });
                          this.setState({ action_response: resp }); })
    }
    else{
      let parameters = this.getActionParameters(true)
      let payload = {}
      payload['action_name'] = this.props.action['actionType']
      payload['parameters'] = parameters
      payload['initiated_by'] = this.props.logged_in_user['email']
      console.log("Payload for action: " + payload['action_name'] + " is: " + payload);
      agent.Actions.initiateAction(JSON.stringify(payload))
                    .then(resp => { console.log(resp);
                          this.setState({ inProgress: false });
                          this.setState({ action_response: resp }); })
    }
  }

  updateState(key, value) {
    console.log("updating state with key: " + key + " value: " + value);
    this.setState({ [key] : value});
    console.log(this.state);
  }

    actionModal() {


      return (
        <Modal open={this.props.action != undefined} className="scrolling" >
            <Modal.Header>Action - {this.props.action["actionNewValue"]}</Modal.Header>
            <Modal.Content >
              <ActionsFormInput
                getActionParameters={this.getActionParameters}
                handleFieldChange={this.handleFieldChange}
                updateState={this.updateState}
                isUserAction={this.state.isUserAction}
             />
            </Modal.Content>

              <Modal.Actions>

                <div class="ui positive message">
                   <div class="header">
                       {this.state.action_response}
                   </div>
                 </div>

                  <Button negative onClick={this.props.onCancelAction}>Cancel</Button>
                  <Button positive loading={this.state.inProgress} labelPosition='right'
                  icon='checkmark' content='Submit' onClick={this.takeAction(this.build_action_payload_and_post)} />
              </Modal.Actions>
       </Modal>
      )
    }



    transferOwnershipAction() {
        return (
            <Modal open={this.props.action != undefined} className="scrolling" >
                {/* <Modal.Header>Action - Transfer Ownership</Modal.Header> */}
                <Modal.Header>Action - {this.props.action["actionNewValue"]}</Modal.Header>
                <Modal.Content >
                    <Form.Input fluid label='From User' onChange={this.handleFromUserChange.bind(this)} placeholder={this.props.selectedUser.key} readOnly />
                    <Form.Input fluid label='To User' onChange={this.handleToUserChange.bind(this)} placeholder="Enter the email..."  />
                </Modal.Content>
                <Modal.Actions>
                    <Button negative onClick={this.props.onCancelAction}>Cancel</Button>
                    <Button positive loading={this.state.inProgress} labelPosition='right'
                    icon='checkmark' content='Transfer' onClick={this.takeAction(this.transferOwnership)} />
                </Modal.Actions>
            </Modal>
        )
    }

    resourcePermissionChangeAction() {
        return (
            <Modal open={this.props.action} className="scrolling" >
                <Modal.Header>Action - Permission change</Modal.Header>
                <Modal.Content >
                    <Form.Input fluid label='User' placeholder={this.props.selectedUser.key} readOnly />
                    <Form.Input fluid label='File Name' placeholder={this.props.action.actionResource.name} readOnly />
                    <Form.Input fluid label='New Permission' placeholder={this.props.action.actionNewValue} readOnly />
                </Modal.Content>
                <Modal.Actions>
                    <Button negative onClick={this.props.onCancelAction}>Cancel</Button>
                    <Button positive loading={this.state.inProgress} labelPosition='right'
                    icon='checkmark' content='Change' onClick={this.takeAction(this.transferOwnership)} />
                </Modal.Actions>
            </Modal>
        )

    }

    resourceOwnerPermissionChangeAction() {
        return (
            <Modal open={this.props.action} className="scrolling">
                <Modal.Header>Action - Owner change</Modal.Header>
                <Modal.Content >
                    <Form.Input fluid label='File Name' placeholder={this.props.action.actionResource.name} readOnly />
                    <Form.Input fluid label='Current File Owner' placeholder={this.props.action.actionResource['resourceOwnerId']} readOnly />
                    Search New Owner
                    <Form.Field fluid><GroupSearch style={{height: '100px', overflow: 'auto'}} /></Form.Field>
                </Modal.Content>
                <Modal.Actions>
                    <Button negative onClick={this.props.onCancelAction}>Cancel</Button>
                    <Button positive loading={this.state.inProgress} labelPosition='right'
                    icon='checkmark' content='Change' onClick={this.takeAction(this.transferOwnership)} />
                </Modal.Actions>
            </Modal>
        )
    }

    otherQuickActions() {
        return (
            <Modal open={this.props.action!= undefined} className="scrolling" >
                {/* <Modal.Header>Action - Transfer Ownership</Modal.Header> */}
                <Modal.Header>Action - {this.props.action["actionNewValue"]}</Modal.Header>
                <Modal.Content >
                    <Form.Input fluid label='For User' placeholder={this.props.selectedUser.key} readOnly />
                </Modal.Content>
                <Modal.Actions>
                    <Button negative onClick={this.props.onCancelAction}>Cancel</Button>
                    <Button positive loading={this.state.inProgress} labelPosition='right'
                    icon='checkmark' content='Transfer' onClick={this.takeAction(this.build_action_payload_and_post)} />
                </Modal.Actions>
            </Modal>
        )
    }

    render() {
        if (this.props.action) {
            if (this.props.action.actionType === "transfer_ownership" ||
                this.props.action.actionType === "remove_external_access" ||
                this.props.action.actionType === "make_all_files_private") {
                return this.actionModal()
            }
            else {

                    return this.otherQuickActions()


            }
        }
        return null;
    }

}


export default connect(mapStateToProps, mapDispatchToProps)(UserActions);
