import React, { Component } from 'react';
import { Card, Image, Label, Dimmer, Loader } from 'semantic-ui-react'

import { connect } from 'react-redux';


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
            displaySearchData: false
        }
    }

    onCardClicked(event, param) {
        this.props.selectUserItem(param.user);
    }

    setTreeRows() {
        if (this.props.usersTreePayload) {
            let rows = []
            let keys = Object.keys(this.props.usersTreePayload)

            for (let index = 0; index < keys.length; index++) {
                let rowItem = this.props.usersTreePayload[keys[index]]
                if (!rowItem.key)
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
                if (this.state.showOnlyExternal || this.props.showOnlyExternal) {
                    if (rowItem.member_type !== 'EXT')
                        continue;
                }
                if (rowItem.type === "group") {
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
        if (nextProps.groupSearchPayload && (!this.state.displaySearchData || 
            (nextProps.showOnlyExternal !== this.state.showOnlyExternal))) {
            let rows = []
            let keys = Object.keys(nextProps.groupSearchPayload)

            for (let index = 0; index < keys.length; index++) {
                let rowItem = nextProps.groupSearchPayload[keys[index]]
                if (!rowItem.key)
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
                if (nextProps.showOnlyExternal) {
                    if (rowItem.member_type !== 'EXT')
                        continue;
                }
                if (rowItem.type === "group") {
                    continue;
                }
                rows.push(rowItem)
            }
            this.setState({
                rows: rows,
                displaySearchData: true,
                showOnlyExternal: nextProps.showOnlyExternal
            })
        }

        if (!nextProps.groupSearchPayload) {
            this.setState({
                rows: undefined,
                showOnlyExternal: nextProps.showOnlyExternal,
                displaySearchData: false
            })
        }
    }

    // shouldComponentUpdate(nextProps,nextState) {
    //     if (!nextProps.userDetailsViewActive)
    //         return true
    //     else 
    //         return false
    // }

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
                    <Card key={row.key} user={row} onClick={this.onCardClicked.bind(this)} color={this.props.selectedUserItem && this.props.selectedUserItem.key === row.key?'blue':null}>
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
