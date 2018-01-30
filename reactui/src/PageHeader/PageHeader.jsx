import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import { StyleSheet, css } from 'aphrodite/no-important';
import { colors, spaces, components } from '../designTokens';
import Logo from '../Logo';
import Nav from '../Nav';
import { addDatasource } from '../urls';
import Modal from '../Modal';
import {connect} from 'react-redux';
import Icon from '../Icon';
import { selectors } from '../PermissionsApp/reducer';
import { selectors as authSelectors } from '../AuthContainer/reducer';
import escapeRegExp from 'escape-string-regexp';
import * as APICall from './util/APICall';

import {
  SET_MENU_DIALOG_VISIBLE as setMenuDialogVisible,
  SET_SCAN_STATUS as setScanStatus,
  deleteAccount
} from '../PermissionsApp/actions';

const mapDispatchToProps = {
  setMenuDialogVisible,
  deleteAccount,
  setScanStatus
}

const mapStateToProps = state => ({
  getIsMenuDialogVisible: () => selectors.getIsMenuDialogVisible(state),
  getProfile: () => authSelectors.getProfile(state.auth),
  getTopLevelResources: (email) => selectors.getTopLevelResources(state, email),
  getScanStatus: () => selectors.getScanStatus(state)
});


const styles = StyleSheet.create({
  pageHeader: {
    display: 'flex',
    padding: `0 ${spaces.m}`,
    height: `3em`,
    //backgroundColor: colors.backgroundDark,
    backgroundColor: '#000',
    justifyContent: 'space-between',
  },
  pageHeaderSection: {
    display: 'flex',
    alignItems: 'center',
    height: '100%',
    margin: 0,
  },
  PageHeaderSearch: {
    border: '1px solid #1f232c',
    width: '700px',
    marginTop: '6px',
    marginBottom: '6px',
    backgroundColor: '#32363f',
    position: 'relative',
    display: 'flex',

  },

  searchForm:{
  padding: '20px',
  marginTop: '30px',
  border: `solid ${spaces.xxxs} ${colors.text}`,
  backgroundColor: '#32363f',
  minHeight: '6.666666666666666rem',
  width: '660px',
  position: 'absolute',
  zIndex:1,
  display: 'inline-flex',

},
  pageHeaderSection_Right: {
    justifyContent: 'flex-end'
  },
  scanHeader: {
    color: 'orange',
    fontSize: 13,
    paddingTop: 10
  }
});

class PageHeader extends Component {
  constructor(props) {
    super(props);
    this.state = {
      manageDatasource:[],
      isDialogueVisible: false,
      showSearchBar:false,
      showCustomInput1: false,
      showCustomInput2: false,
      showCustomInput3: false,
      isSelected: false,
      filerSearchData: {},
      metadata: [],
      scanEndTime: null,
      scanStatus: true
      // dateFrom: moment(),
      // dateTo: moment()
    }
    //this.showSearchForm = this.showSearchForm.bind(this);
    // this.dateChangedTo = this.dateChangedTo.bind(this);
  }


  handleMenuModel(modelData) {
    this.props.setMenuDialogVisible(true, modelData);
  }

  componentWillReceiveProps(nextProps) {
    if(this.props.getProfile()) {
      let datasource = [];
      let arry = this.props.getTopLevelResources(this.props.getProfile().email);
      if(arry) {
        arry.map((data)=> {
          datasource.push({
            'text': data[1],
            'external':false,
          })
          return datasource;
        });
        this.setState({
          manageDatasource:datasource
        })
      } else {
        this.setState({
          manageDatasource:datasource
        })
      }

    }
  }


  custom_input1 = (e) => {
    if(e.target.value === "custom1") {
      this.setState({
        showCustomInput1: true,
      })
    }
    else {
      this.setState({
        showCustomInput1: false,
      })
    }
  }

  render() {

    let userAreaLinks;
    let mainLinks;

    if (this.props.isLoggedIn) {

      userAreaLinks = [{
        label: `Logout (${this.props.profile.email})`,
        iconLeft: 'person',
        onClick: () => this.props.logout()
      }];

      mainLinks = [
        { label:'Dashboard', url: '/', active: false },
        { label:'Users & Groups', url: '/usergroups', active: false},
        { label:'Resources', url: '/resources', active: false},
        { label:'Search', url: '/search', active: false},
        { label:'Reports', url: '/report', 'submenu':
          [
            {
              'text': 'Manage Reports',
              'url': '/reports'
            }
          ]
        },
        { label:'Settings', url: '/settings', iconLeft: 'gear', 'submenu':
        [{
            'text': 'Manage Account',
            'url': '/accounts'

          },
          {
            'text': 'Manage Datasources',
            'url':'/datasources'

          }]
      }
      ]

      var currUrl = window.location.href;

      if (currUrl.includes("dashboard"))
        mainLinks[0]["active"] = true;
      else if (currUrl.includes("usergroups"))
        mainLinks[1]["active"] = true;
      else if (currUrl.includes("resources"))
        mainLinks[2]["active"] = true;
      else if (currUrl.includes("search"))
        mainLinks[3]["active"] = true;
      else if (currUrl.includes("report"))
        mainLinks[4]["active"] = true;
      else if (currUrl.includes("accounts") || currUrl.includes("datasources"))
        mainLinks[5]["active"] = true;
      else
        mainLinks[0]["active"] = true;
    }
        /*{ label:'Add GDrive', onClick: () => this.onAddGDrive(), iconLeft: 'gear' }*/
    else {
      userAreaLinks = [{
        label: '',
        iconLeft: '',
        url: '/auth'
      }];
      mainLinks = [];
    }

    if (this.props.getScanStatus()) {
      mainLinks = []
      // mainLinks[0]['url'] = mainLinks[1]['url'] = mainLinks[2]['url'] =
      //   mainLinks[3]['submenu'][0]['url'] = mainLinks[4]['submenu'][0]['url'] =
      //   mainLinks[4]['submenu'][1]['url'] = '';
    }

    return (
      <div className={css(styles.pageHeader)}>
        <div className={css(styles.pageHeaderSection)}>
          <a href="/">
            <Logo />
          </a>
          <Nav links={mainLinks}
            isInline={true} isPrimary={true}/>
        </div>
        <div className={css(styles.pageHeaderSection, styles.pageHeaderSection_Right)}>
          <Nav links={userAreaLinks} isInline={true} />
        </div>
      </div>
    );
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(PageHeader);
