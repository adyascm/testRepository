import React, { Component } from 'react';
import agent from '../../utils/agent'
import { Item, Card, Image, Label } from 'semantic-ui-react'

import { connect } from 'react-redux';


import { AgGridReact } from "ag-grid-react";
import 'ag-grid/dist/styles/ag-grid.css';
import 'ag-grid/dist/styles/ag-theme-fresh.css';

import {
    USER_ITEM_SELECTED
} from '../../constants/actionTypes';


const mapStateToProps = state => ({
    ...state.users
});

const mapDispatchToProps = dispatch => ({
    selectUserItem: (payload) =>
        dispatch({ type: USER_ITEM_SELECTED, payload })
});



class UserList extends Component {
    constructor(props) {
        super(props);
        this.state = {
            rows: undefined,
        }
    }

    componentWillMount() {
    }

    onCardClicked(event, param) {
        this.props.selectUserItem(param.user);
    }

    setTreeRows() {
        if (this.props.usersTreePayload) {
            let rows = []
            let emailRowMap = {}
            let keys = Object.keys(this.props.usersTreePayload)

            for (let index = 0; index < keys.length; index++) {
                let rowItem = this.props.usersTreePayload[keys[index]]
                rowItem.key = keys[index]

                if (rowItem.depth === undefined)
                    rowItem.depth = 0
                rowItem.isExpanded = rowItem.isExpanded || false
                if (!rowItem.name) {
                    rowItem.type = rowItem.type || "user";
                    rowItem.name = rowItem.firstName + " " + rowItem.lastName;
                }
                else
                    rowItem.type = rowItem.type || "group";
                if (this.state.showOnlyExternal) {
                    if (rowItem.member_type != 'EXT')
                        continue;
                }
                if (rowItem.type == "group") {
                    continue;
                }
                rows.push(rowItem)
            }
            this.setState({
                ...this.state,
                rows: rows
            })
        }
    }
    render() {
        if (this.state.rows) {
            var userCards = this.state.rows.map(row => {
                return ((
                    <Card user={row} onClick={this.onCardClicked.bind(this)}>
                        <Card.Content>
                            <Image floated='right' size='tiny'><Label style={{ fontSize: '1rem' }} circular >{row.name.charAt(0)}</Label></Image>

                            <Card.Header>
                                {row.name}
                            </Card.Header>
                            <Card.Description>
                                {row.key}
                            </Card.Description>
                        </Card.Content>
                    </Card>
                ))
            });
        }
        else{
            this.setTreeRows();
        }
        return (
            <Card.Group>
                {userCards}
            </Card.Group>

        )

    }
}

export default connect(mapStateToProps, mapDispatchToProps)(UserList);
