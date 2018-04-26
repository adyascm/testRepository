import React, { Component } from 'react'
import { Search } from 'semantic-ui-react'

import { connect } from 'react-redux';

import {
    GROUP_SEARCH_PAYLOAD,
    GROUP_SEARCH_EMPTY,
    USER_ITEM_SELECTED
  } from '../../constants/actionTypes';

const mapStateToProps = state => ({
    ...state
});

const mapDispatchToProps = dispatch => ({
    onsearchLoad: (payload) =>
        dispatch({ type: GROUP_SEARCH_PAYLOAD, payload }),
    onsearchEmpty: () =>
        dispatch({ type: GROUP_SEARCH_EMPTY }),
    setSelectedUser: (payload) =>
        dispatch({ type: USER_ITEM_SELECTED, payload })
});

class GroupSearch extends Component {

    constructor(props) {
        super(props);
        this.state = {
            isLoading: false,
            value: this.props.defaultValue ? this.props.defaultValue : '',
            results: [],
            resultsMap: {},
            hideSearchMenu: true,
            showNoResults: false
        }
        // if(!this.props.users.usersTreePayload)
        // {
        //     this.props.onUsersLoad(agent.Users.getUsersTree());
        // }
    }

    resultRenderer = (r) => {
        //var image = null;
        // var image;
        //         if (r.photo_url) {
        //             image = <Image inline avatar src={r.photo_url} floated='left'></Image>
        //         } else {
        //             image = <Image inline floated='left'><Label style={{ fontSize: '1.2rem' }} circular >{r.name.charAt(0)}</Label></Image>
        //         }

        return (
            <div>
                {/* {image} */}
                <span>{r.email}</span>
                </div>
        )
    }

    resetComponent = () => this.setState({ isLoading: false, results: [], value: '' })

    handleResultSelect = (e, { result }) => {
        this.props.onsearchLoad(this.state.resultsMap)
        this.props.setSelectedUser(result)
        console.log("search result : ", result)
        if (this.props.onChangeReportInput) {
          var entityinfokey = ["selected_entity",  "selected_entity_name"]
          var entityinfovalue = [result.email, result.email]
           this.props.onChangeReportInput(entityinfokey, entityinfovalue)

        }
        this.setState({
            value: result.email,
            hideSearchMenu: true,
            showNoResults: false
        })
    }

    handleSearchChange = (e, { value }) => {
        if (value === '') {
            this.props.onsearchEmpty()
            this.setState({ 
                value: value,
                results: [],
                hideSearchMenu: true
            })
            return
        }
        this.setState({ 
            isLoading: true, 
            value: value,
            hideSearchMenu: false 
        })

        setTimeout(() => {
            if (this.state.value.length < 1) return this.resetComponent()
            const re = new RegExp(this.state.value, 'i')

            var results = [];
            var resultsMap = {}
            var keys = Object.keys(this.props.users.usersTreePayload)
            for (let index = 0; index < keys.length; index++) {
                let row = this.props.users.usersTreePayload[keys[index]]
                if (keys[index].match(re)) {
                    //row.name = row.first_name + " " + row.last_name
                    results.push(row);
                    resultsMap[keys[index]] = row
                }
            }
            this.setState({
                isLoading: false,
                results: results,
                resultsMap: resultsMap,
                showNoResults: results.length > 0 ? false : true
            })
        }, 1000)
    }

    handleKeyPress = (event) => {
        if (event.key === 'Enter') {
            this.props.onsearchLoad(this.state.resultsMap)
            this.props.setSelectedUser(undefined)
            this.setState({
                hideSearchMenu: true,
                showNoResults: false
            })
        }
    }

    render() {
        const { isLoading, value, results } = this.state
        // if(!this.props.users.usersTreePayload)
        //     return null;
        return (
            <Search aligned="left"
                loading={isLoading}
                onResultSelect={this.handleResultSelect}
                onSearchChange={this.handleSearchChange.bind(this)}
                results={results}
                value={value}
                resultRenderer={this.resultRenderer}
                onKeyPress={this.handleKeyPress}
                open={!this.state.hideSearchMenu}
                showNoResults={this.state.showNoResults}
                // {...this.props}
            />
        )
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(GroupSearch);
