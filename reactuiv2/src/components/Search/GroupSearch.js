import React, { Component } from 'react'
import { Search, Grid, Card, Image, Label } from 'semantic-ui-react'
import { Link } from 'react-router-dom'

import { connect } from 'react-redux';
import agent from '../../utils/agent'

import {
    USERS_PAGE_LOADED,
  } from '../../constants/actionTypes';

const mapStateToProps = state => ({
    ...state
});

const mapDispatchToProps = dispatch => ({
    onUsersLoad: (payload) =>
    dispatch({ type: USERS_PAGE_LOADED, payload }),
});

class GroupSearch extends Component {

    constructor(props) {
        super(props);
        this.state = {
            isLoading: false,
            value: '',
            results: []

        }
        if(!this.props.users.usersTreePayload)
        {
            this.props.onUsersLoad(agent.Users.getUsersTree());
        }
    }

    resultRenderer = (r) => {
        var image = null;
                if (r.photo_url) {
                    image = <Image inline floated='right' size='mini' src={r.photo_url} circular></Image>
                } else {
                    image = <Image floated='right' size='tiny' ><Label style={{ fontSize: '1.2rem' }} circular >{r.name.charAt(0)}</Label></Image>
                }

        return (
            <Card >
                <Card.Content>
                    {image}
                    <Card.Header>
                        {r.name}
                    </Card.Header>
                    <Card.Description>
                        {r.email}
                    </Card.Description>
                </Card.Content>
            </Card>
        )
    }

    resetComponent = () => this.setState({ isLoading: false, results: [], value: '' })

    handleResultSelect = (e, { result }) => {
        console.log("search result : ", result)
        if (this.props.onChangeReportInput) {
            this.props.onChangeReportInput("selected_entity", result.resource_name)
        }
        this.setState({
            value: result.resource_name
        })
    }

    handleSearchChange = (e, { value }) => {
        this.setState({ isLoading: true, value })

        setTimeout(() => {
            if (this.state.value.length < 1) return this.resetComponent()
            const re = new RegExp(this.state.value, 'i')

            var results = [];
            var keys = Object.keys(this.props.users.usersTreePayload)
            for (let index = 0; index < keys.length; index++) {
                let row = this.props.users.usersTreePayload[keys[index]]
                if (keys[index].match(re)) {
                    row.name = row.first_name + " " + row.last_name
                    results.push(row);
                }
            }
            this.setState({
                isLoading: false,
                results: results,
            })
        }, 1000)
    }

    render() {
        const { isLoading, value, results } = this.state
        console.log("this.props.defaultValue ", this.props.defaultValue);
        if(!this.props.users.usersTreePayload)
            return null;
        return (
            <Search aligned="left"
                loading={isLoading}
                onResultSelect={this.handleResultSelect}
                onSearchChange={this.handleSearchChange.bind(this)}
                results={results}
                value={value}
                resultRenderer={this.resultRenderer}
                {...this.props}
            />
        )
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(GroupSearch);
