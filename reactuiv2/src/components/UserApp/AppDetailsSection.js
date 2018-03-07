import React, { Component } from 'react';
import { Tab, Segment, Icon, Grid,Button } from 'semantic-ui-react';
import AppDetails from './AppDetails';
import agent from '../../utils/agent'
import { connect } from 'react-redux';
import {
    APPS_ITEM_SELECTED
} from '../../constants/actionTypes';

const mapStateToProps = state => ({
    ...state.apps,
    ...state.common
});

const mapDispatchToProps = dispatch => ({
    closingDetailsSection: (payload) => dispatch({type:APPS_ITEM_SELECTED,payload}),
})

class AppDetailsSection extends Component {
    constructor(props) {
        super(props);

        this.state = {
            
        }
        this.closeDetailsSection = this.closeDetailsSection.bind(this);
        this.handleAppAccessRevokeClick = this.handleAppAccessRevokeClick.bind(this)
    }

    closeDetailsSection() {
        this.props.closingDetailsSection(undefined)
    }

    handleAppAccessRevokeClick(event,domainId,datasourceId, clientId,userEmail) {
        agent.Apps.revokeAppAccess(domainId,datasourceId, clientId,userEmail).then(resp =>{
            console.log(resp)
        })
    }

    render() {
        // var appLayout = (
        //     <Container stretched>
        //         <Grid stretched>
        //             <Grid.Row stretched style={{marginLeft: '5px'}}>

        //             </Grid.Row>
        //         </Grid>
        //     </Container>
        // )

        if (!this.props.selectedAppItem)
            return null;
        else {
            let users = this.props.selectedAppItem.users
            let appUsers = []

            if (users && users.length > 0) {
                appUsers = users.map((user,index) => {
                let app =this.props.selectedAppItem
                return (
                    <Grid.Row key={index}>
                        <Grid.Column width={2}>
                            <Button animated='vertical' basic color='red' onClick={(event) => 
                                                                        this.handleAppAccessRevokeClick(event,app.domain_id,app.datasource_id,app.client_id,user.email)}>
                                <Button.Content hidden>Remove</Button.Content>
                                <Button.Content visible>
                                    <Icon name='remove' />
                                </Button.Content>
                            </Button>
                        </Grid.Column>
                        <Grid.Column width={10}>
                            {user.email}
                        </Grid.Column>
                    </Grid.Row>
                )
            })
            }
            let panes = [
                { menuItem: 'Users', render: () => <Tab.Pane attached={false}> 
                                                    <Grid celled='internally'>{appUsers}
                                                    </Grid> </Tab.Pane> }
              ]
            return (
                <Segment>
                        <Icon name='close' onClick={this.closeDetailsSection} />
                        <AppDetails selectedAppItem={this.props.selectedAppItem} appsPayload={this.props.appsPayload} handleChange={this.handleChange} />
                        <Tab menu={{ secondary: true, pointing: true }} panes={panes} />
                </Segment>
            )
        }

    }

}

export default connect(mapStateToProps,mapDispatchToProps)(AppDetailsSection);
