import React, { Component } from 'react'
import { Search, Icon } from 'semantic-ui-react'

import { connect } from 'react-redux';
import agent from '../../utils/agent'

import {
    RESOURCES_PAGE_LOAD_START,
    RESOURCES_PAGE_LOADED,
    RESOURCES_SEARCH_PAYLOAD,
    RESOURCES_SEARCH_EMPTY
} from '../../constants/actionTypes';

const mapStateToProps = state => ({
    ...state
});

const mapDispatchToProps = dispatch => ({
    onsearchLoad: (payload, prefix) => dispatch({ type: RESOURCES_SEARCH_PAYLOAD, payload, prefix }),
    onsearchEmpty: () => dispatch({ type: RESOURCES_SEARCH_EMPTY })
});

class ResourceSearch extends Component {

    constructor(props) {
        super(props);
        this.state = {
            isLoading: false,
            value: this.props.defaultValue? this.props.defaultValue : '',
            results: [],
            hideSearchMenu: true,
            showNoResults: false
        }
    }

    resultRenderer = (r) => {
        var parent = ""
        if(r.parent_name)
            parent = " (under " + r.parent_name + ")";
        return <div>{r.resource_name}{parent}</div>
    }


    resetComponent = () => this.setState({ isLoading: false, results: [], value: '' })

    handleResultSelect = (e, { result }) => {
        this.props.onsearchLoad(this.state.results, this.state.value)

        if (this.props.onChangeReportInput) {
           var entityinfokey = ["selected_entity",  "selected_entity_name"]
           var entityinfovalue = [result.resource_id, result.resource_name]
           this.props.onChangeReportInput(entityinfokey, entityinfovalue)
        }
        this.setState({
            value: result.resource_name,
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
            //const re = new RegExp(this.state.value, 'i')
            //var results = [];
            let filterMetadata = {};
            if (this.props.filterMetadata)
            {
                filterMetadata = Object.assign({}, this.props.filterMetadata);;
            } 
            filterMetadata['prefix'] = this.state.value
            agent.Resources.getResources(filterMetadata).then(res => {
                this.setState({
                    isLoading: false,
                    results: res,
                    showNoResults: res.length > 0 ? false : true
                })
            }, error => {
                this.setState({
                    isLoading: false,
                    results: [],
                    showNoResults: true
                })
            })
        }, 1000)
    }

    handleKeyPress = (event) => {
        if (event.key === 'Enter') {
            this.props.onsearchLoad(this.state.results, this.state.value)
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
                icon={(this.state.results.length > 0 || this.state.showNoResults) ? <Icon name='close' link onClick={this.clearSearchResult} /> : 'search'}
                // {...this.props} 
            />
        )
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(ResourceSearch);
