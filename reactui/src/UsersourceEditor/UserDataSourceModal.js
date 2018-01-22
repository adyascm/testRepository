import React, { Component } from 'react';
import Modal from '../Modal';
import serializeForm from 'form-serialize';
import *  as Api from './API';

class UserDataSourceModal extends Component {
  constructor() {
    super();
    this.state = {
      userDatasources:[]
    }
  }

  closer = (props) => {
    //this.props.setIsDialogueVisible(false)
    console.log("closer", props);

    props.onClose();
  }

  submit = (event) => {
    let valid=true;
    const auth = this.props.auth
    console.log("authhhh ", auth)
    const email =  auth.profile.email
    const authToken = auth.profile.authToken
    const userdatasource_val = serializeForm(event.target, {hash: true})
    var datasource_modified_name = userdatasource_val["datasource_name"]
    var usersource_modified_name = userdatasource_val["usersource_name"]
    console.log("userdatasource_val ", userdatasource_val)
    console.log("---- ", this.props.usersource)
    var usersource_id = this.props.usersource[0]
    var datasource_id = this.props.usersource[4][0][0]
      console.log("usersource_id : ", usersource_id , "datasource_id : ", datasource_id)
    Api.renameUsersource(email, usersource_id, usersource_modified_name, authToken).then((response) => 
        this.props.getAllUserDataSources(this.props)
      )
    Api.renamedatasource(email, datasource_id, datasource_modified_name, authToken).then((response) =>
        this.props.getAllUserDataSources(this.props)
      )
    //console.log("this.props", this.props);
    event.preventDefault();
    if(valid) {
      // this.props.getAllUserDataSources(this.props);
      this.closer(this.props);
    }

  }
  render() {
    //console.log(this.props.usersource);
    console.log("this.props.datasource", this.props.datasource);
    //console.log(this.props.formType);
    //console.log("getAllUserDataSources inside modal", this.props.getAllUserDataSources);
    let modalContent;
    if(this.props.formType === 'modify') {
      modalContent = (
          <div>
            <form className="create-report-form user-source-style" onSubmit={this.submit}>
              <div className="vertical-box">
                <div className="inner-box">
                  <label>UserSource Name</label>
                  <input name='usersource_name' type="text" defaultValue={this.props.usersource[1]}/>
                  <label>DataSource Name</label>
                  <input name='datasource_name' type="text" defaultValue={this.props.usersource[4][0][1]}/>
                  <div className="temp-left-pad">
                    <button>Submit</button>
                  </div>
                </div>
              </div>
            </form>
          </div>
        )
    }
    else if(this.props.formType === 'modify-data') {
      modalContent = (
        <div>
          <form className="create-report-form user-source-style" onSubmit={this.submit}>
            <div className="vertical-box">
                <div className="inner-box">
                  <label>Title</label>
                  <input name='name' type="text" defaultValue={this.props.usersource[1]}/>
                  <label>UserSource Name</label>
                  <input name='name' type="text" defaultValue={this.props.datasource[1]}/>
                  <div className="temp-left-pad">
                    <button>Submit</button>
                  </div>
                </div>
              </div>
          </form>
        </div>
      )
    }
    return (
      <Modal  isVisible={this.props.isVisible}
              hideTitle={true}
              isExpanded={false}
              onClose={() => this.closer(this.props) }>{modalContent}</Modal>
  );
  }

}
export default UserDataSourceModal;
