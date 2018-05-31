import React, { Component } from 'react';
import { connect } from 'react-redux';

import { Search, Icon } from 'semantic-ui-react';

import agent from '../../utils/agent';

import {
    APPS_ITEM_SELECTED,
    APP_USERS_LOAD_START,
    APP_USERS_LOADED,
    APPS_SEARCH_PAYLOAD,
    APPS_SEARCH_EMPTY
} from '../../constants/actionTypes';

const mapStateToProps = state => ({
    ...state.apps
});

const mapDispatchToProps = dispatch => ({
    selectAppItem: (payload) =>
        dispatch({ type: APPS_ITEM_SELECTED, payload }),
    appUsersLoadStart: () =>
        dispatch({ type: APP_USERS_LOAD_START }),
    appUsersLoaded: (payload) =>
        dispatch({ type: APP_USERS_LOADED, payload }),
    setAppsSearchResults: (payload) =>
        dispatch({ type: APPS_SEARCH_PAYLOAD, payload }),
    onSearchEmpty: () =>
        dispatch({ type: APPS_SEARCH_EMPTY })
});

class AppsSearch extends Component {
    constructor(props) {
        super(props);

        this.state = {
            isLoading: false,
            value: '',
            results: [],
            hideSearchMenu: true,
            showNoResults: false
        }
    }

    resetComponent = () => this.setState({ isLoading: false, results: [], value: '' })

    resultRenderer = (r) => {
        return (
            <div>
                <span>{r.display_text}</span>
            </div>
        )
    }

    handleSearchChange = (e, { value }) => {
        if (value === '') {
            this.props.onSearchEmpty()
            this.setState({
                value: value,
                results: [],
                hideSearchMenu: true,
                showNoResults: false
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
            var allApps = this.props.appPayLoad

            for (let index = 0; index < allApps.length; index++) {
                if (allApps[index]["display_text"].match(re)) {
                    results.push(allApps[index]);
                }
            }
            this.setState({
                isLoading: false,
                results: results,
                showNoResults: results.length > 0 ? false : true
            })
        }, 1000)
    }

    handleResultSelect = (e, { result }) => {
        this.props.setAppsSearchResults(this.state.results)
        this.props.selectAppItem(result)
        this.props.appUsersLoadStart()
        this.props.appUsersLoaded(agent.Apps.getappusers(result.client_id, result.datasource_id))
        this.setState({
            value: result.display_text,
            hideSearchMenu: true,
            showNoResults: false
        })
    }

    handleKeyPress = (event) => {
        if (event.key === 'Enter') {
            this.props.setAppsSearchResults(this.state.results)
            this.setState({
                hideSearchMenu: true,
                showNoResults: false
            })
        }
    }

    clearSearchResult = () => {
        this.props.onSearchEmpty()
        this.setState({
            results: [],
            value: '',
            showNoResults: false
        })
    }

    render() {
        return (
            <Search aligned="left"
                loading={this.state.isLoading}
                onResultSelect={this.handleResultSelect}
                onSearchChange={this.handleSearchChange.bind(this)}
                results={this.state.results}
                value={this.state.value}
                resultRenderer={this.resultRenderer}
                onKeyPress={this.handleKeyPress}
                open={!this.state.hideSearchMenu}
                showNoResults={this.state.showNoResults}
                icon={(this.state.results.length > 0 || this.state.showNoResults) ? <Icon link name='close' onClick={this.clearSearchResult} /> : 'search'}
            />
        )
    }
}

export default connect(mapStateToProps,mapDispatchToProps)(AppsSearch);
