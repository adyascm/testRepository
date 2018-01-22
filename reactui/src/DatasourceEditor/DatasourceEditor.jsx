import React, { Component } from 'react';
import { StyleSheet, css } from 'aphrodite/no-important';
import Icon from '../Icon';
import { spaces, typography, colors } from '../designTokens';
import UserDataSourceModal from '../UsersourceEditor/UserDataSourceModal';

const s = StyleSheet.create({

  datasource: {
    paddingLeft:spaces.ss  ,
    background: '#32363f',
    minWidth: '250px',
    borderRadius: '10px',
  // boxShadow: '0 3px 0px rgba(149,144,144,0.16), 0 3px 6px rgba(149,144,144,0.23)',
},
 usersourcesGridli: {
 padding: '10px 18px 0px 0px',
 display: 'flex',
 minWidth: '-moz-max-content',
},
datasourceTitle: {
  color: '#8f9196',
  fontSize: '1.2em',
  fontFamily: typography.fontFamily,
  fontWeight: 'bold',
},
datasourceContent: {
  fontSize: '0.8em',
  padding: '5px 10px 5px 0px',
},
 container: {
    // marginLeft: components.icon.size.xl,
    // paddingTop: spaces.m,
    // paddingRight: sizes.xxxs,
    // marginTop: spaces.m,
    // borderTop: `1px dotted ${colors.text}`,
    // display: 'flex'
  },
  heading: {
    fontSize: '0.8rem',
    fontWeight: 'bold'
  },
  block: {
    //color:'#8f9196',
    color: 'white',
    display: 'block'
  },
  grow: {
    flexGrow: 1
  }
});

class DatasourceEditor extends Component {

  state = {
      isExpanded: false,
      isEditing: false,
      inputValue: [],
      formType:'',
      isDialogueVisible: false,
      activeUserSource: [],
      userDatasources:[]
    };

  onEditClick = (e) => {
    this.setFormType('modify-data');
    this.setIsDialogueVisible(true,e);
  }

  setFormType = (e) => {
    console.log(e, "setFormType");
    this.setState((formType) => ({
      formType: e
    }))
  }

  getFormType = () => {

    console.log(this.state.formType, "getFormType")
    return this.state.formType
  }

  setIsDialogueVisible = (e, datasource) => {
    this.setState({isDialogueVisible: e})
    this.setState((activeUserSource) => ({
      activeUserSource: datasource
    }))
  }

  getIsDialogueVisible = () => {
    return this.state.isDialogueVisible
  }

  getActiveUserSource = () => {
    return this.state.activeUserSource
  }

  modalClose = () => {
    this.props.getAllUserDataSources();
    this.setIsDialogueVisible(false,this.getActiveUserSource());

  }

  // handleMenuModel(modelData) {
  //   this.props.setMenuDialogVisible(true, modelData);
  // }

  render() {

    const { datasource, type } = this.props;
    console.log(datasource);
    console.log("this.props.auth ", this.props.auth);
    console.log("getAllUserDataSources", this.props.getAllUserDataSources)
    let localDirectory = null;
    if (type === 'windows') {
      localDirectory = (
        <span className={css(s.block)}><strong>Local directory: </strong><span>{datasource[5]}</span></span>
      );
    }
      return (
        <div>
          <li className={css(s.usersourcesGridli)}>
          <div className={css(s.datasource)}>
            <div className={css(s.datasourceContent)}>
              <div className={css(s.datasourceWrapper)}>
                <div className={css(s.datasourceTitle)}>{datasource[1]}

                  {/* <div className="report-menu">
                    <div className="dropdown">
                      <div className="dropbtn" ></div>
                        <div className="dropdown-content">
                          <a value="modify" onClick={() => this.onEditClick(datasource)}><Icon name='pencil' size='xs' title='Edit this report'/><span>&emsp;Edit</span></a>
                          <a value="delete"><Icon name='trashcan' size='xs' title='Delete this report'/><span>&emsp;Delete</span></a>
                        </div>
                      </div>
                    </div> */}
                </div>
              </div>
            </div>
            <p>
              <span className={css(s.block)}><strong>Login ID: </strong><span>{datasource[3]}</span></span>
              { localDirectory }
            </p>
            <p>
             <span className={css(s.block)}><strong>Type: </strong><span>{datasource[2]}</span></span>
           </p>
          </div>
          </li>
          <UserDataSourceModal isVisible={this.getIsDialogueVisible()}
                                formType={this.getFormType()}
                                setIsDialogueVisible={this.setIsDialogueVisible}
                                onClose={() => this.modalClose()}
                                userSourceData={this.getActiveUserSource()}
                                datasource={this.props.datasource}
                                usersource={this.props.usersource}
                                auth={this.props.auth}
          />
      </div>
      );

  }
}

export default DatasourceEditor;
