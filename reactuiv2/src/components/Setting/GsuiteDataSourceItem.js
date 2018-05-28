import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Button, Card, Image, Dimmer, Loader, Progress, Label, Header, Container, Divider } from 'semantic-ui-react'
import { IntlProvider, FormattedDate } from 'react-intl'
import { Link, withRouter } from 'react-router-dom'
import common from '../../utils/common'
import agent from '../../utils/agent';
import oauth from '../../utils/oauth';
import {
    SET_DATASOURCES,
    CREATE_DATASOURCE,
    DELETE_DATASOURCE_START,
    LOGIN_START,
    LOGIN_ERROR,
    DATASOURCE_LOAD_START,
    DATASOURCE_LOAD_END,
    ASYNC_END,
    SET_REDIRECT_PROPS
} from '../../constants/actionTypes';

const mapStateToProps = state => ({
    ...state
});

const mapDispatchToProps = dispatch => ({
    addDataSource: (name, datasource_type, isdummy = false) => {
        dispatch({ type: CREATE_DATASOURCE, payload: agent.Setting.createDataSource({ "display_name": name, "isDummyDatasource": isdummy, "datasource_type": datasource_type }) })
    },
    onDeleteDataSource: (datasource) => {
        dispatch({ type: DELETE_DATASOURCE_START, payload: datasource })
    },
    onDataSourceLoad: () =>
        dispatch({ type: DATASOURCE_LOAD_START}),
    displayErrorMessage: (error) => {
        dispatch({ type: DATASOURCE_LOAD_END }),
            dispatch({ type: ASYNC_END, errors: error.message ? error.message : error['Failed'] })
    },
    goToDashboard: (url) =>
        dispatch({ type: SET_REDIRECT_PROPS, redirectUrl: url }),
    setDataSources: (datasources) =>
        dispatch({ type: SET_DATASOURCES, payload: datasources }),
});

class GsuiteDataSourceItem extends Component {
    constructor() {
        super();

        this.state = {
            datasourceLoading: false
        }

        this.addNewDatasource = (datasourceName, datasorceType) => ev => {
            ev.preventDefault();
            this.props.onDataSourceLoad()
            this.setState({
                datasourceLoading: true
            })
            if (this.props.is_serviceaccount_enabled) {
                this.props.addDataSource("GSuite", "GSUITE")
            } else {
                oauth.authenticateGsuite("drive_scan_scope").then(data => {
                    this.props.addDataSource("GSuite", "GSUITE")
                    //this.props.setDataSources(agent.Setting.getDataSources())
                    this.setState({
                        datasourceLoading: false
                    })
                }).catch(({ errors }) => {
                    this.props.displayErrorMessage(errors)
                    this.setState({
                        datasourceLoading: false
                    })
                });
            }
        };

        this.addDummyDatasource = () => ev => {
            ev.preventDefault();
            this.props.onDataSourceLoad()
            this.props.addDataSource("Sample dataset", true);
        };

        this.deleteDataSource = (datasource) => ev => {
            ev.preventDefault();
            //this.props.onDeleteDataSource(datasource);
            this.setState({
                datasourceLoading: true
            })
            agent.Setting.deleteDataSource(datasource).then(res => {
                this.props.setDataSources(agent.Setting.getDataSources());
                this.setState({
                    datasourceLoading: false
                })
            });
        };
        this.handleClick = () => ev => {
            ev.preventDefault();
            this.props.goToDashboard("/")
            this.props.history.push("/")
        };

        this.onPollChanges = (datasource) => ev => {
            ev.preventDefault();
            agent.Setting.pollGSuiteDriveChanges(datasource);
        };
    }

    render() {
        const datasource = this.props.item;
        if (datasource) {
            var percent = ((datasource.processed_file_count / datasource.total_file_count) * 100)
            if (datasource.total_file_count === 0)
                percent = 0;
            var statusText = "Scan is in progress. Please wait for it to complete."
            var statusCount = "Processed " + datasource.processed_file_count + "/" + datasource.total_file_count + " files/folders " + datasource.processed_group_count + "/" + datasource.total_group_count + " groups " + datasource.processed_user_count + "/" + datasource.total_user_count + " users"
            var pollIcon = null;
            var status = common.DataSourceUtils.getScanStatus(datasource);
            var progressBar = (<Progress size='small' precision='0' percent={percent} active />);
            if (status == 'error') {
                statusText = "Scan has failed. Please delete and try again."
                progressBar = (<Progress size='small' precision='0' percent={percent} error />);
            }
            else if (status == 'success') {
                statusText = "Scan is complete."
                progressBar = (<Progress size='small' precision='0' percent={percent} success />);
                pollIcon = <Button style={{ margin: "5px" }} circular basic icon='refresh' onClick={this.onPollChanges(datasource)} />;
            }


            var datasourceImage = <Image floated='left' size='mini' src='/images/google_logo.png' />
            if (datasource.is_dummy_datasource)
                datasourceImage = <Image circular floated='left' size='small'><Label content='Sample' icon='lab' /></Image>
            return (
                <Card fluid >
                    <Dimmer active={this.state.datasourceLoading} inverted>
                        <Loader inverted content='Deleting...' />
                    </Dimmer>
                    <Card.Content>
                        <Header >{datasource.domain_id}</Header>
                        {datasourceImage}
                        <Card.Header textAlign='right'>
                            {datasource.display_name}
                            {pollIcon}
                        </Card.Header>
                        <Card.Meta textAlign='right'>
                            Created on: <strong><IntlProvider locale='en'  >
                                <FormattedDate
                                    value={new Date(datasource.creation_time)}
                                    year='numeric'
                                    month='long'
                                    day='2-digit'
                                    hour='2-digit'
                                    minute='2-digit'
                                    second='2-digit'
                                />
                            </IntlProvider>
                            </strong>
                        </Card.Meta>
                        <Card.Description>
                            {statusCount}
                            {progressBar}
                            {statusText}
                        </Card.Description>
                    </Card.Content>
                    <Card.Content extra>
                        <div className='ui buttons'>
                            <Button basic color='red' loading={this.state.datasourceLoading} onClick={this.deleteDataSource(datasource)}>Delete</Button>
                            {status == 'success' ? (<Button basic color='green' style={{ marginLeft: '5px' }} onClick={this.handleClick()} >Go To Dashboard</Button>) : null}
                        </div>
                    </Card.Content>
                </Card>
            );
        }
        else {
            //var header = (<Header>Welcome {this.props.currentUser.first_name}! </Header>);
            var detail = (<Container>
                We recommend you <a target='_blank' href='https://gsuite.google.com/marketplace/app/adya/109437140823'>install Adya from GSuite marketplace</a> to get visiblity into all documents.<br />
                Before connecting your GSuite account, you can use a
        <Button basic compact onClick={this.addDummyDatasource()} loading={this.props.inProgress ? true : false} disabled={this.props.inProgress || this.props.errorMessage ? true : false}>sample dataset</Button>
                to get familiar with the features. <br /> Learn more about Adya <a target='_blank' href='https://www.adya.io/resources/'>here.</a>
            </Container>)
            var buttonText = "Connect your GSuite";
            if (this.props.is_serviceaccount_enabled) {
                //header = (<Header>Welcome {this.props.currentUser.first_name}! </Header>);
                detail = (<Container>
                    Thank you for installing Adya at your organisation. <br />
                    We need to do a one-time setup by scanning your GSuite account to collect necessary metadata.
            </Container>);
                buttonText = "Start Scan";
            }

            return (
                <Card>
                    <Card.Content>
                        <Header>Adya for GSuite </Header>
                        
                        <Card.Description>
                            <Image floated='left' size='mini' src='/images/google_logo.png' />
                            {detail}
                        </Card.Description>
                    </Card.Content>
                    <Card.Content extra>
                        <div className='ui buttons'>
                            <Button basic color='green' onClick={this.addNewDatasource()} loading={this.state.datasourceLoading}>{buttonText}</Button>
                        </div>
                    </Card.Content>
                </Card>
            )
        }
    }
};

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(GsuiteDataSourceItem));
