import React, {Component} from 'react';
import { StyleSheet, css } from 'aphrodite/no-important';
import { spaces,colors,typography } from '../designTokens';
import PieChart from '../Chart';
import { Panel,ListGroup,ListGroupItem } from 'react-bootstrap';
import * as Api from './WidgetAPI.js';
import { Link } from 'react-router';
import { Grid,Row,Col } from 'react-bootstrap';
import { SET_WIDGET_REPORT as setWidgetReport } from '../PermissionsApp/actions';
import { selectors } from '../PermissionsApp/reducer';
import {connect} from 'react-redux';


const mapDispatchToProps = {
  setWidgetReport
}

const mapStateToProps = state => ({
  getWidgetReport: () => selectors.getWidgetReport(state)
});

const s = StyleSheet.create({
  frame: {
    border: 'solid 0.5px #979797',
    width: '100%',
    height: '300px',
    marginLeft: '10px',
    marginRight: '10px',
    marginTop: '20px',
    marginBottom: '10px',
    paddingTop: '15px',
    paddingBottom: '15px'
  },
  content: {
    color: 'white',
    textAlign: 'center',
    fontSize: '20px'
  },
  contentBody: {
    //border: 'solid 1px black',
    width: '100%',
    height: '200px',
    backgroundColor: 'grey'
  },
  contentFooter: {
    fontSize: '15px',
    paddingTop: '10px',
    backgroundColor: 'grey'
  },
  panel: {
    backgroundColor: 'black',
    height: '320px',
    marginTop: '5px',
    textAlign: 'center'
  },
  listGroupItem: {
    color: colors.textLight,
    textAlign: 'left',
    paddingLeft: '40px',
    paddingTop: '1px',
    //paddingBottom: '10px',
    listStyleType: 'none',
    fontFamily: 'Helvetica',
    //fontFamily: typography.fontFamily,
    fontSize: '16px'
  },
  listGroupDiv: {
    height: '65px',
    borderBottom: 'solid 2px grey',
    //paddingTop: '25px',
    //paddingBottom: '10px'
  },
  listGroupDivItem: {
    display: 'inline-block',
    width: '75%'
  },
  listGroupDivValue: {
    display: 'inline-block',
    width: '25%',
    //borderBottom: 'solid 2px grey',
    height: '63px',
    paddingLeft: '40px',
    paddingTop: '25px',
    backgroundColor: '#2E3D4C'
  },
  panelLayout: {
    paddingTop: '10px',
    height: '320px',
    borderBottom: 'solid 4px #d88733'
  },
  panelHeader: {
    height: '40px',
    width: '100%',
    backgroundColor: '#000'
  },
  panelHeading: {
    paddingTop: '10px',
    paddingBottom: '10px',
    //paddingLeft: '10px',
    color: colors.textLight,
    fontFamily: 'Helvetica',
    //fontFamily: typography.fontFamily,
    fontSize: '18px',
    textAlign: 'center'
  },
  panelBody: {
    height: '230px',
    width: '100%',
    backgroundColor: colors.backgroundDark,
  },
  panelFooter: {
    height: '35px',
    width: '100%',
    backgroundColor: colors.backgroundDark
  },
  panelFooterStyle: {
    paddingBottom: '20px',
    color: colors.textLight,
    textAlign: 'center',
    fontFamily: 'Helvetica'
  },
  panelChartContainer: {
    height: '270px',
    width: '70%',
    //paddingBottom: '35px',
    backgroundColor: colors.backgroundDark,
    display: 'inline-block',
    position: 'relative'
  },
  panelChart: {
    height: '200px',
    width: '100%',
    paddingBottom: '35px',
    backgroundColor: colors.backgroundDark
  },
  panelChartFooter: {
    height: '24px',
    width: '100%',
    //paddingTop: '5px',
    paddingBottom: '20px',
    paddingLeft: '60px',
    //position: 'relative',
    borderBottom: 'solid 4px #d88733',
    backgroundColor: colors.backgroundDark
  },
  panelChartFooterStyle: {
    color: colors.textLight,
    textAlign: 'center',
    // paddingBottom: '10px'
  },
  panelLegend: {
    height: '65px',
    paddingTop: '10px',
    paddingBottom: '2px',
    borderTop: 'solid 2px grey',
    backgroundColor: colors.backgroundDark
  },
  panelLegendRight: {
    height: '260px',
    width: '30%',
    backgroundColor: colors.backgroundDark,
    display: 'inline-block',
    paddingLeft: '10px',
    position: 'relative'
    //borderBottom: 'solid 4px #d88733',
    //borderTop: 'solid 4px #d88733'
  },
  panelLegendFooter: {
    paddingTop: '10px'
  },
  panelLegendFooterStyle: {
    color: colors.textLight,
    textAlign: 'center',
    fontFamily: 'Helvetica'
  },
  circle: {
    width: '12px',
  	height: '12px',
  	background: 'red',
  	borderRadius: '6px',
    display: 'inline-block',
  },
  label: {
    paddingLeft: '10px',
    color: colors.linkLightHover
  }
})

class Widget extends Component {
  constructor(props) {
    super(props);
    this.state = {
      chartData: '',
      chartColor: '',
      extSharedDocs: '',
      extUsers: '',
      usersCount: '',
      docsCount: '',
      totalDocs: '',
      shareMode: '',
      domainFiles: 0,
      domainFolders: 0,
      domainUsers: 0,
      domainGroups: 0
    }
    this.widgetClick = this.widgetClick.bind(this);
  }

  componentWillReceiveProps(nextProps) {
    var auth = this.props.auth;
    var email = auth.profile.email;
    var authToken = auth.profile.authToken;
    var widgetType = this.props.type;
    var datasourceId, usersourceId;

    if (nextProps !== this.props) {
      datasourceId = nextProps.dataSourceId;
      usersourceId = nextProps.userSourceId;
    }
    if (widgetType === 'PIE_CHART') {
      Api.getDashboardInfo(email,authToken,datasourceId,usersourceId,widgetType)
        .then(response => {
            var data = [];
            var bgColor = [];
            var mode = [];
            var chartData = response;
            const fileShareModes = {
              1: ['Public','#2E3D4C'],
              2: ['External','#445A76'],
              4: ['Domain','#6FA2D9'],
            }

            var totalData = 0;

            chartData.forEach(function(elem,index){
              if ((elem[0] !== 3) && (elem[0] !== 5)) {
                totalData += elem[1];
                data.push(elem[1]);
                bgColor.push(fileShareModes[elem[0]][1]);
                mode.push(fileShareModes[elem[0]][0]);
              }
            });

            data.forEach(function(elem,index){
              var tmp = ((elem/totalData)*100).toFixed(1);
              data[index] = (tmp%1) < 0.5? Math.floor(tmp): Math.ceil(tmp);
          });
          this.setState({
            chartData: data,
            chartColor: bgColor,
            totalDocs: totalData,
            shareMode: mode
          })
        });
    }
    else if (widgetType === 'EXT_DOCS') {
      Api.getDashboardInfo(email,authToken,datasourceId,usersourceId,widgetType)
        .then(response => {
          this.setState({
            extSharedDocs: response['files'],
            docsCount: response['count']
          })
        });
    }
    else if (widgetType === 'EXT_USERS') {
      Api.getDashboardInfo(email,authToken,datasourceId,usersourceId,widgetType)
        .then(response => {
          this.setState({
            extUsers: response['users'],
            usersCount: response['count']
          })
        })
    }
    else if (widgetType === 'INFO') {
      Api.getDashboardInfo(email,authToken,datasourceId,usersourceId,widgetType)
        .then(response => {
          if (response) {
            this.setState({
              domainFiles: response['total_files'],
              domainFolders: response['total_folders'],
              domainGroups: response['total_groups'],
              domainUsers: response['total_users']
            })
          }
        })
    }
  }

  widgetClick() {
    this.props.setWidgetReport(true);
  }

  render() {
    var titleContent, footerContent, bodyContent;

    if (this.props.type === 'PIE_CHART') {
      var fileShare = '';
      var data = this.state.chartData;

      for (let i=0; i<data.length;i++) {
        fileShare += data[i] + '% ' + this.state.shareMode[i];
        if ((i+1) !== data.length)
          fileShare += ', ';
      }
        bodyContent = (
          <div>
            <div className={css(s.panelChart)}>
              <PieChart data={this.state.chartData} color={this.state.chartColor} />
              <p className={css(s.panelChartFooterStyle)}>{this.state.totalDocs} shared docs</p>
            </div>
            <div className={css(s.panelLegend)}>
              <Grid fluid={true} style={{paddingTop: '5px', paddingLeft: '25px'}}>
                <Row>
                  <Col xs={6} md={4}><div><div className={css(s.circle)} style={{background: '#2E3D4C'}}></div><strong className={css(s.label)}>Public</strong></div></Col>
                  <Col xs={6} md={4}><div><div className={css(s.circle)} style={{background: '#445A76'}}></div><strong className={css(s.label)}>External</strong></div></Col>
                  <Col xsHidden md={4}><div><div className={css(s.circle)} style={{background: '#6FA2D9'}}></div><strong className={css(s.label)}>Domain</strong></div></Col>
                </Row>
              </Grid>
            </div>
          </div>
        );
        titleContent = "Shared Docs";
    }
    else if (this.props.type === 'EXT_DOCS'){
      var extDocs = this.state.extSharedDocs;
      var docsList = [];
      var maxWidth = window.matchMedia("(max-width: 3000px)").matches;
      //var numberDocs = (extDocs.length < 6) ? extDocs.length : 6;
      var numberDocs = maxWidth?(extDocs.length < 7? extDocs.length:7):(extDocs.length < 10? extDocs.length:10);

      if(!numberDocs)
        docsList.push(<ListGroupItem bsClass={css(s.listGroupItem)}><p>No documents Externally shared</p></ListGroupItem>);
      else {
        for (let i=0; i<numberDocs; i++) {
          docsList.push(<ListGroupItem bsClass={css(s.listGroupItem)}>{extDocs[i]}</ListGroupItem>)
        }
      }

      bodyContent = (
        <div>
          <div className={css(s.panelBody)}>
            <ListGroup>
              {docsList}
            </ListGroup>
          </div>
          <div className={css(s.panelFooter)}>
            <p className={css(s.panelFooterStyle)}>{this.state.docsCount} externally shared documents</p>
          </div>
        </div>
      );
      titleContent = "Externally Shared Docs";
    }
    else if (this.props.type === 'EXT_USERS'){
      var users = this.state.extUsers;
      var usersList = [];
      var maxWidth = window.matchMedia("(max-width: 3000px)").matches;
      //var numberUsers = (users.length < 6) ? users.length : 6;
      var numberUsers = maxWidth?(users.length < 7? users.length:7):(users.length < 10? users.length:10);

      if (!numberUsers)
        usersList.push(<ListGroupItem bsClass={css(s.listGroupItem)}><p>No External users have access</p></ListGroupItem>);
      else {
        for (let i=0; i<numberUsers; i++) {
            usersList.push(<ListGroupItem bsClass={css(s.listGroupItem)}>{users[i]}</ListGroupItem>)
        }
      }

      bodyContent = (
        <div>
          <div className={css(s.panelBody)}>
            <ListGroup>
              {usersList}
            </ListGroup>
          </div>
          <div className={css(s.panelFooter)}>
            <p className={css(s.panelFooterStyle)}>{this.state.usersCount} external users have access</p>
          </div>
        </div>
      );
      titleContent = "External Users";
    }

    else if (this.props.type === 'INFO') {
      bodyContent = (
        <div>
          <div className={css(s.panelBody)}>
            <ListGroup>
              <div className={css(s.listGroupDiv)}>
                <div className={css(s.listGroupDivItem)}>
                  <ListGroupItem bsClass={css(s.listGroupItem)}>Number of Users in Domain</ListGroupItem>
                </div>
                <div className={css(s.listGroupDivValue)}>
                  <strong style={{color:colors.textLight}}>{this.state.domainUsers}</strong>
                </div>
              </div>
              <div className={css(s.listGroupDiv)}>
                <div className={css(s.listGroupDivItem)}>
                  <ListGroupItem bsClass={css(s.listGroupItem)}>Number of Groups in Domain</ListGroupItem>
                </div>
                <div className={css(s.listGroupDivValue)}>
                  <strong style={{color:colors.textLight}}>{this.state.domainGroups}</strong>
                </div>
              </div>
              <div className={css(s.listGroupDiv)}>
                <div className={css(s.listGroupDivItem)}>
                  <ListGroupItem bsClass={css(s.listGroupItem)}>Number of Files in Domain</ListGroupItem>
                </div>
                <div className={css(s.listGroupDivValue)}>
                  <strong style={{color:colors.textLight}}>{this.state.domainFiles}</strong>
                </div>
              </div>
              <div className={css(s.listGroupDiv)}>
                <div className={css(s.listGroupDivItem)}>
                  <ListGroupItem bsClass={css(s.listGroupItem)}>Number of Folders in Domain</ListGroupItem>
                </div>
                <div className={css(s.listGroupDivValue)} style={{height: '70px'}}>
                  <strong style={{color:colors.textLight}}>{this.state.domainFolders}</strong>
                </div>
              </div>
            </ListGroup>
          </div>
          <div className={css(s.panelFooter)}>
            <p className={css(s.panelFooterStyle)}></p>
          </div>
        </div>
      );

      titleContent = "Domain Summary";
    }

    if (this.props.type !== 'INFO') {
      return(
        <div onClick={()=>this.widgetClick()}>
          <Link to={{pathname: "/report", state: {usersourceId: this.props.userSourceId, datasourceId: this.props.dataSourceId, type: this.props.type}}} style={{ textDecoration: 'none' }}>
            {/* <Panel header={titleContent} className={css(s.panel)} bsStyle="success"> */}
            <div className={css(s.panelLayout)}>
              <div className={css(s.panelHeader)}>
                <h1 className={css(s.panelHeading)}>{titleContent}</h1>
              </div>
              {bodyContent}
            </div>
          </Link>
        </div>
      );
    }
    else {
      return(
        <div>
          {/* <Panel header={titleContent} className={css(s.panel)} bsStyle="success"> */}
          <div className={css(s.panelLayout)}>
            <div className={css(s.panelHeader)}>
              <h1 className={css(s.panelHeading)}>{titleContent}</h1>
            </div>
            {bodyContent}
          </div>
        </div>
      );
    }
  }
}

export default connect(mapStateToProps,mapDispatchToProps)(Widget);
