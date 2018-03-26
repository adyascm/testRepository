import { Grid, Button,Icon } from 'semantic-ui-react';
import React, { Component } from 'react';
import agent from '../../utils/agent'
import { connect } from 'react-redux';
import { Loader, Dimmer, Label } from 'semantic-ui-react'

import {
    USER_APPS_LOAD_START,
    USER_APPS_LOADED
} from '../../constants/actionTypes';


const mapStateToProps = state => ({
    ...state.apps
});

const mapDispatchToProps = dispatch => ({
    onLoadStart: () =>
        dispatch({ type: USER_APPS_LOAD_START }),
    onLoad: (payload) =>
        dispatch({ type: USER_APPS_LOADED, payload })
});

class UserApps extends Component {

    componentWillMount() {
        if (this.props.selectedUser && this.props.selectedUser.email) {
            this.props.onLoadStart()
            this.props.onLoad(agent.Apps.getuserapps(this.props.selectedUser.email))
        }
    }


    render(){
        let selectedUser = this.props.selectedUser
        let applications =[]
        if(this.props.isLoading)
        {
            applications = (
                <div className="ag-theme-fresh" style={{ height: '100px' }}>
                    <Dimmer active inverted>
                        <Loader inverted content='Loading' />
                    </Dimmer>
                </div>
            )
        }
        else if (this.props.userApps && this.props.userApps.length)
        {
            applications = this.props.userApps.map((application,index) => {
                if (application !== undefined) {

                    let score = application["score"]
                    var color = score < 4 ? 'blue' : (score > 7 ? 'red' : 'yellow')
                    let scopes = application["scopes"].split(',').map((scope,index) => {
                    return (
                    <Grid.Row textAlign='center' style={{ margin: '0px' }}  key={index}>
                            {scope}
                        </Grid.Row>
                    )
                    })

                    return (
                        <Grid.Row key={index}>
                            <Grid.Column width={2}>
                                <Button animated='vertical' basic color='red' onClick={(event) =>
                                    this.props.handleAppAccessRevokeClick(event,selectedUser.datasource_id,application.client_id,selectedUser.email)}>
                                    <Button.Content hidden>Remove</Button.Content>
                                    <Button.Content visible>
                                        <Icon name='remove' />
                                    </Button.Content>
                                </Button>
                            </Grid.Column>
                            <Grid.Column  width={3}>
                                {application["display_text"]}

                            </Grid.Column>
                            <Grid.Column width={1}>
                                <Label color={color}></Label>
                            </Grid.Column>
                            <Grid.Column width={10}>
                                    {scopes}
                            </Grid.Column>

                        </Grid.Row>
                    )
                }
                else
                    return ""
            })
        }
        else
            applications = [<Grid.Row key={0}><Grid.Column textAlign='center'>{"No Apps to show"}</Grid.Column></Grid.Row>]
        return (
            <Grid celled='internally'>
                {applications}
            </Grid>

        )
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(UserApps);
