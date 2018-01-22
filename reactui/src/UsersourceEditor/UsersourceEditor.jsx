import React, { Component } from 'react';
import { StyleSheet, css } from 'aphrodite/no-important';
import Icon from '../Icon';
import DatasourceEditor from '../DatasourceEditor';
import { colors, sizes, spaces, radii, typography } from '../designTokens';
import UserDataSourceModal from './UserDataSourceModal';
// import {SET_MENU_DIALOG_VISIBLE as setMenuDialogVisible, deleteAccount} from '../PermissionsApp/actions';
// import { selectors } from '../PermissionsApp/reducer';
// import { selectors as authSelectors } from '../AuthContainer/reducer';
// import {connect} from 'react-redux';

const s = StyleSheet.create({
  usersourceContent: {
  padding: spaces.l,
  flex: '1',
},
block: {
  color: colors.text,
  display: 'block'
},
datasource: {
padding: '0px 12px 0px 12px',
background: '#32363f',
minWidth: '350px',
borderRadius: '10px',
boxShadow: '0 3px 0px rgba(149,144,144,0.16), 0 3px 6px rgba(149,144,144,0.23)',
},

usersource: {
   paddingTop:spaces.ss,
   paddingRight: spaces.ss,
   paddingBottom: spaces.m,
   paddingLeft: '10px',
 },

 usersourceTitleGrid: {
  // border: `1px solid ${colors.text}`,
  paddingBottom: spaces.ss,
  borderRadius:  radii.l,
  // boxShadow: '0 3px 0px rgba(149,144,144,0.16), 0 3px 6px rgba(149,144,144,0.23)',
},
usersourceTitle: {
  color : '#8f9196',
  borderRadius: spaces.s,
  paddingTop: spaces.xs,
  paddingBottom:spaces.xs,
  paddingLeft: spaces.xs,
  backgroundColor: '#32363f',
  fontFamily: typography.fontFamily,
  fontSize: '1em',
  fontWeight: 'bold',
  position:'relative',
  width:'100%',
  // display:'inline-block'
},
usersourcesGrid: {
  listStyleType: 'none',
  padding: '0 0 0 30px',
  margin: '0',

  display: 'flex',
  flexWrap: 'wrap',
},
// usersourcesGrid: {
//   // list-style-type: none;
//   padding: '0 0 0 15px',
//   margin: '0',

//   display: 'flex',
//   flexWrap: 'wrap',
// },
datasourcesGrid: {

  listStyleType: 'none',
  padding: '0px 0 0 15px',
  margin: '0',

  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'baseline',
},

title: {
  color: '#8f9196',
  borderTopLeftRadius: '2px',
  borderTopRightRadius: '2px',
  padding: '5px 10px 5px 2px',
  fontSize: '1em',
  fontWeight: 'bold',
  display: 'inline-block',

},
/*padding-top: 10px;*/

datasourcesGridLi: {
  padding: '12px 5px 12px 0px',
  textAlign: 'left',
},
userdatasourceTitle: {
  color: '#8f9196',
  borderBottom: '1px solid #505050',
  fontSize: '1em',
  fontWeight: 'bold',
},

wrapperDesign: {
  display: 'inline-block',
  float:'left',
} ,

container: {
  padding: sizes.xxxs,
  margin: sizes.xxxs,
  border: `1px solid ${colors.text}`,
  backgroundColor: '#424242',
  borderRadius: '10px'
},
header: {
  display: 'flex',

},
grow: {
  flexGrow: 1,
  paddingLeft: '20px'
}
});

class UsersourceEditor extends Component {
  // constructor() {
  //   super();
  //   this.onExpandClick = this.onExpandClick.bind(this);
  //   //this.onSaveClick = this.onSaveClick .bind(this);
  //   //this.onEditClick = this.onEditClick.bind(this);
  //   // this.saveToDo = this.saveToDo.bind(this);
  // }
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
    this.setFormType('modify');
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

  setIsDialogueVisible = (e, usersource) => {
    this.setState({isDialogueVisible: e})
    this.setState((activeUserSource) => ({
      activeUserSource: usersource
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

  // onSaveClick() {
  //   console.log("onSaveClick");
  //   console.log(this.props.saveToDo);
  //   this.props.saveToDo(this.props.usersource[0],this.refs.createInput.value);
  //   this.setState({
  //     isEditing:false
  //   })
  // }

  onExpandClick = () => {
    this.setState({ isExpanded: !this.state.isExpanded });
  }

  // DeleteReport(usersourceId){
  //   console.log(usersourceId)
  //   const auth = this.props.auth
  //   const authToken = auth.profile.authToken
  //   const email = auth.profile.email
  //   // if (confirm("Do you want to delete ?") == true) {
  //   //   ScheduleReportsAPI.deleteReport(email, usersourceId, authToken).then((usersource) => {
  //   //       this.setState({usersource})
  //   //   })
  //   // }
  // }


  render() {
    let usermessage;
    const { usersource } = this.props;
    //console.log(usersource);
    //console.log(this.props.usersource[0]);
    //console.log(this.props.getAllUserDataSources);

    const datasourceEditors = usersource[4].map(
        ds => <DatasourceEditor usersource={this.props.usersource}
        datasource={ds}  key={ds.id} type={usersource[0]}
        getAllUserDataSources={this.props.getAllUserDataSources}
        />);

    if(usersource[4].length === 1) {

          usermessage = (
            <div className={css(s.wrapperDesign)}>
              <ol className={css(s.datasourcesGrid)}>
                <li className={css(s.datasourcesGridLi)}>
                  <div className={css(s.datasource)}>
                    <div className={css(s.userdatasourceTitle)}>
                      <div>
                        <div className={css(s.title)}> {usersource[1]} </div>
                        <div className="report-menu">
                          <div className="dropdown">
                            <div className="dropbtn" ></div>
                            <div className="dropdown-content">
                              {/*<a value="modify" onClick= {()=>this.handleMenuModel('modify')}><Icon name='pencil'
                                size='xs' title='Edit this report'/><span>&emsp;Edit</span></a>*/}
                              <a value="modify" onClick={() => this.onEditClick(usersource)}><Icon name='pencil'
                                 size='xs' title='Edit this report'/><span>&emsp;Edit</span></a>
                              {/* <a value="delete"><Icon name='trashcan' size='xs' title='Delete this report'/><span>&emsp;Delete</span></a> */}
                            </div>
                          </div>
                        </div>
                      </div>
                      </div>
                      <p>
                        <span className={css(s.block)}><span>{usersource[4][0][1]}</span></span>
                      </p>
                      <p>
                        <span className={css(s.block)}><strong>Login ID: </strong><span>{usersource[4][0][3]}</span></span>
                      </p>
                      <p>
                        <span className={css(s.block)}><strong>Type: </strong><span>{usersource[4][0][2]}</span></span>
                      </p>
                  </div>
               </li>
            </ol>
         {/* <MenuModelContent usersource={this.props.usersource}/>*/}
          </div>
        );
      }
      else {
        usermessage = (
          <div>
          <div className={css(s.usersource)}>
            <div className={css(s.usersourceTitleGrid)}>
              <div className={css(s.usersourceTitle)}>
                {usersource[1]}
                <div className="report-menu" style={{position:'absolute', right:'77px'}}>
                  <div className="dropdown">
                      <div className="dropbtn"></div>
                        <div className="dropdown-content">
                          <a value="modify"><Icon name='pencil' size='xs' title='Edit this report'/><span>&emsp;Edit</span></a>
                          <a value="delete"><Icon name='trashcan' size='xs' title='Delete this report'/><span>&emsp;Delete</span></a>
                      </div>
                  </div>
                </div>
              </div>
              <ol className={css(s.usersourcesGrid)}>
              { datasourceEditors }
              </ol>
            </div>
          </div>
          <div className={css(s.usersource)}>
            <div className={css(s.usersourceTitleGrid)}>
              <div className={css(s.usersourceTitle)}></div>
            </div>
          </div>
        </div>
        );
      }
      return (
        <div>
          {usermessage}
          <UserDataSourceModal  isVisible={this.getIsDialogueVisible()}
                                formType={this.getFormType()}
                                setIsDialogueVisible={this.setIsDialogueVisible}
                                onClose={() => this.modalClose()}
                                userSourceData={this.getActiveUserSource()}
                                usersource={this.props.usersource}
                                auth={this.props.auth}
                                getAllUserDataSources={this.props.getAllUserDataSources}
          />
        </div>
      )
  }

  }

export default UsersourceEditor;
