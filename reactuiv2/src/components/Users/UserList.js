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
                    rowItem.name = rowItem.first_name + " " + rowItem.last_name;
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
                rows: rows
            })
        }
    }
    componentWillReceiveProps(nextProps) {
        this.setState({
            rows: undefined,
            showOnlyExternal: nextProps.showOnlyExternal
        })
    }
    render() {
        if (this.state.rows) {
            var userCards = this.state.rows.map(row => {
                var image = null;
                if (row.photo_url) {
                    image = <Image inline floated='right' size='mini' src={row.photo_url} circular></Image>
                } else {
                    image = <Image floated='right' size='tiny' ><Label style={{ fontSize: '1.2rem' }} circular >{row.name.charAt(0)}</Label></Image>
                }
                return ((
                    <Card user={row} onClick={this.onCardClicked.bind(this)}>
                        <Card.Content>
                            {image}

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
        else {
            this.setTreeRows();
        }
        return (
            <Card.Group style={{ maxHeight: document.body.clientHeight, overflow: "auto" }}>
                {userCards}
            </Card.Group>

        )

    }
}

export default connect(mapStateToProps, mapDispatchToProps)(UserList);
