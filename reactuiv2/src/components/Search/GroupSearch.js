import React, { Component } from 'react'
import { Search, Icon } from 'semantic-ui-react'

import { connect } from 'react-redux';
import agent from '../../utils/agent';

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
            //resultsMap: {},
            hideSearchMenu: true,
            showNoResults: false
        }
    }

    resultRenderer = (r) => {
        return (
            <div>
                {/* {image} */}
                <span>{r.email}</span>
                </div>
        )
    }

    resetComponent = () => this.setState({ isLoading: false, results: [], value: '' })

    handleResultSelect = (e, { result }) => {
        //this.props.onsearchLoad(this.state.resultsMap)
        this.props.setSelectedUser(result)
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
            agent.Users.getUsersList("", this.state.value, "").then(res => {
                this.setState({
                    isLoading: false,
                    results: res,
                    showNoResults: res.length > 0 ? false : true
                });
            });
        }, 1000)
    }

    handleKeyPress = (event) => {
        if (event.key === 'Enter') {
            //this.props.onsearchLoad(this.state.resultsMap)
            this.props.setSelectedUser(undefined)
            this.setState({
                hideSearchMenu: true,
                showNoResults: false
            })
        }
    }

    clearSearchResult = () => {
        this.props.onsearchEmpty()
        this.setState({
            results: [],
            value: '',
            showNoResults: false
        })
    }    

    render() {
        const { isLoading, value, results } = this.state
        return (
            <Search 
                aligned="left"
                loading={isLoading}
                onResultSelect={this.handleResultSelect}
                onSearchChange={this.handleSearchChange.bind(this)}
                results={results}
                value={value}
                resultRenderer={this.resultRenderer}
                onKeyPress={this.handleKeyPress}
                open={!this.state.hideSearchMenu}
                showNoResults={this.state.showNoResults}
                fluid={true}
                icon={(this.state.results.length > 0 || this.state.showNoResults) ? <Icon link name='close' onClick={this.clearSearchResult} /> : 'search'}
            />
        )
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(GroupSearch);
