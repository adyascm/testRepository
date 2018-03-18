import React, { Component } from 'react';
import { Card, Image, Label } from 'semantic-ui-react'
import agent from '../../utils/agent'
import { connect } from 'react-redux';

import {
    APPS_ITEM_SELECTED,
    APP_USERS_LOAD_START,
    APP_USERS_LOADED
} from '../../constants/actionTypes';


const mapStateToProps = state => ({
    ...state.apps
});

const mapDispatchToProps = dispatch => ({
    selectAppItem: (payload) =>
        dispatch({ type: APPS_ITEM_SELECTED, payload }),
    appUsersLoadStart: () => dispatch({type:APP_USERS_LOAD_START}),
    appUsersLoaded: (payload) => dispatch({type:APP_USERS_LOADED,payload})
});



class AppList extends Component {
    constructor(props) {
        super(props);
        this.state = {
            apps: undefined
        }
    }

    onCardClicked(event, param) {
        this.props.selectAppItem(param.app);
        this.props.appUsersLoadStart()
        this.props.appUsersLoaded(agent.Apps.getappusers(param.app.client_id))
    }
    
    componentWillReceiveProps(nextProps) {
        this.setState({
            apps: undefined,
            scopeExposure: nextProps.scopeExposure
        })
    }

    render() {
        var appCards =[]
        if (this.props.appPayLoad) {
            var searchData;

            if (this.props.appsSearchPayload)
                searchData = this.props.appsSearchPayload
            else 
                searchData = this.props.appPayLoad

            let allapps = []
            if (this.state.scopeExposure === 0)
            {
                //allapps =this.props.appPayLoad
                allapps = searchData
            }
            else
            {
                for(let appkey in searchData)
                {
                    let app = searchData[appkey]
                    if (this.state.scopeExposure === 2 && !app.is_readonly_scope)
                        allapps.push(app)
                    else if (this.state.scopeExposure === 1 && app.is_readonly_scope)
                        allapps.push(app)
                }
            }
            for(let appkey in allapps)
            {
                var app = allapps[appkey]
                var appName = app.display_text;
                var image = <Image key={appkey} floated='right' size='tiny' ><Label style={{ fontSize: '1.2rem' }} circular >{appName.charAt(0)}</Label></Image>
                var color = app.score < 4 ? 'blue' : (app.score > 7 ? 'red' : 'yellow')
                
                appCards.push(<Card key={appkey} color={color}  app={app} onClick={this.onCardClicked.bind(this)} raised={(this.props.selectedAppItem && this.props.selectedAppItem.display_text === appName)}>
                    <Card.Content>
                        {image}
                        <Card.Header>
                            {appName}
                        </Card.Header>
                    </Card.Content>
                </Card>)
            }
        }
        return (
            <Card.Group style={{ maxHeight: document.body.clientHeight, overflow: "auto" }}>
                {appCards}
            </Card.Group>

        )

    }
}

export default connect(mapStateToProps, mapDispatchToProps)(AppList);
