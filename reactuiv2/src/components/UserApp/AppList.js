import React, { Component } from 'react';
import { Card, Image, Label } from 'semantic-ui-react'
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
    selectAppItem: (payload) =>
        dispatch({ type: APPS_ITEM_SELECTED, payload })
});



class AppList extends Component {
    constructor(props) {
        super(props);
        this.state = {
            apps: undefined
        }
    }

    onCardClicked(event, param) {
        this.props.selectAppItem(param.app)
    }

    render() {
        var appCards = []
        if (this.props.appPayLoad) {
            var searchData;

            if (this.props.appsSearchPayload)
                searchData = this.props.appsSearchPayload
            else
                searchData = this.props.appPayLoad
            let dsMap = this.props.datasourcesMap;
            for (let appkey in searchData) {
                var app = searchData[appkey]
                var appName = app.display_text.length > 25 ? app.display_text.slice(0,25) : app.display_text
                var dsImage = null;
                if (app.datasource_id) {
                    dsImage = <Image floated='right'  inline size='mini' src={dsMap[app.datasource_id] && dsMap[app.datasource_id].logo} circular></Image>
                }
                // var image = <Image key={appkey} floated='right' size='tiny' ><Label style={{ fontSize: '1.2rem' }} circular >{appName.charAt(0)}</Label></Image>
                var color = app.score < 1 ? 'grey' : (app.score < 4 ? 'blue' : (app.score > 7 ? 'red' : 'yellow'))

                appCards.push(<Card key={appkey} color={color} app={app} onClick={this.onCardClicked.bind(this)} raised={(this.props.selectedAppItem && this.props.selectedAppItem.display_text === appName)}>
                    <Card.Content>
                        {dsImage}
                        <Card.Header>
                            {appName}
                        </Card.Header>
                    </Card.Content>
                </Card>)
            }
        }
        return (
            <Card.Group style={{ maxHeight: document.body.clientHeight/1.05, overflow: "auto" }}>
                {appCards}
            </Card.Group>

        )

    }
}

export default connect(mapStateToProps, mapDispatchToProps)(AppList);
