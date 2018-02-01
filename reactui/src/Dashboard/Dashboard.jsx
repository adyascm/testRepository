import React, {Component}  from 'react';
import { StyleSheet, css } from 'aphrodite/no-important';
import Widget from '../Widget';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Grid,Row,Col } from 'react-bootstrap';
import * as Api from './DashboardAPI.js';
import Reports from '../Reports';
import { SET_WIDGET_REPORT as setWidgetReport } from '../PermissionsApp/actions';
import { selectors } from '../PermissionsApp/reducer';
import {connect} from 'react-redux';
import Nav from '../Nav';
import PageContent from '../PageContent';
import HomePage from '../HomePage';


const mapDispatchToProps = {
  setWidgetReport
}

const mapStateToProps = state => ({
  getWidgetReport: () => selectors.getWidgetReport(state),
  getAccountSignUp: () => selectors.getAccountSignUp(state),
});

const s = StyleSheet.create({
    showGrid: {
        marginLeft: '0px',
        marginRight: '0px',
        marginTop: '10px'
    }
});

class Dashboard extends Component {
  constructor(props) {
    super(props);
    this.state = {
      datasourceId: '',
      usersourceId: '',
      isDatasource: false
    }
  }

  componentWillMount() {
    const auth = this.props.auth;
    const email = auth.profile.email;
    const authToken = auth.profile.authToken;
    var datasourceId, usersourceId;

    this.props.setWidgetReport(false);



    Api.getDatasource(authToken).then(response => {
        var datasources = JSON.parse(response['datasources']).length;
        if (datasources){
          this.setState({
            isDatasource: true
          })
        }

        // Api.getUsersourceId(email,authToken).then(response => {
        //     usersourceId = response[0][0];
        //     this.setState({
        //       usersourceId: response[0][0],
        //       datasourceId: datasourceId
        //     })
        // });

    });
  }

  render() {

    if (!this.state.isDatasource) {
      return (
        <PageContent>
          <HomePage authContent={this.props.auth} />
        </PageContent>
      )
    }

    const gridInstance = (
      <Grid fluid={true}>
        <Row className="show-grid">
          <Col xs={6} md={4}><Widget type="PIE_CHART" auth={this.props.auth} dataSourceId={this.state.datasourceId} userSourceId={this.state.usersourceId} /></Col>
          <Col xs={6} md={4}><Widget type="EXT_DOCS" auth={this.props.auth} dataSourceId={this.state.datasourceId} userSourceId={this.state.usersourceId} /></Col>
          <Col xsHidden md={4}><Widget type="EXT_USERS" auth={this.props.auth} dataSourceId={this.state.datasourceId} userSourceId={this.state.usersourceId} /></Col>
        </Row>
        <Row className="show-grid">
          <Col xs={6} md={4}><Widget type="INFO" auth={this.props.auth} datasourceId={this.state.datasourceId} usersourceId={this.state.usersourceId} /></Col>
        </Row>
      </Grid>
    )

    return(
      <div>
        {gridInstance}
      </div>
    );
  }
}

export default connect(mapStateToProps,mapDispatchToProps)(Dashboard);
