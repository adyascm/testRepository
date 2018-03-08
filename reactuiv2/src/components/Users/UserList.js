import React, { Component } from 'react';
import { Card, Image, Label, Dimmer, Loader } from 'semantic-ui-react'

import UserCards from './UserCards';
import { connect } from 'react-redux';


import {
    USER_ITEM_SELECTED
} from '../../constants/actionTypes';


const mapStateToProps = state => ({
    groupSearchPayload: state.users.groupSearchPayload,
    usersTreePayload: state.users.usersTreePayload
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

    render() {
        if (this.state.rows) {
           return  <UserCards rows={this.state.rows} />
        }
        else {
            this.setTreeRows();
        }
        
        return null
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(UserList);
