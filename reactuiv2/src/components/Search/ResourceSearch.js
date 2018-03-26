import React, { Component } from 'react'
import { Search } from 'semantic-ui-react'

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
    onLoadStart: () => dispatch({ type: RESOURCES_PAGE_LOAD_START }),
    onLoad: (payload) => dispatch({ type: RESOURCES_PAGE_LOADED, payload }),
    onsearchLoad: (payload) => dispatch({ type: RESOURCES_SEARCH_PAYLOAD, payload }),
    onsearchEmpty: () => dispatch({ type: RESOURCES_SEARCH_EMPTY })
});

class ResourceSearch extends Component {

    constructor(props) {
        super(props);
        this.state = {
            isLoading: false,
            value: this.props.defaultValue? this.props.defaultValue : '',
            results: []

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
        this.props.onsearchLoad(this.state.results)

        if (this.props.onChangeReportInput) {
           var entityinfokey = ["selected_entity",  "selected_entity_name"]
           var entityinfovalue = [result.resource_id, result.resource_name]
           this.props.onChangeReportInput(entityinfokey, entityinfovalue)
        }
        this.setState({
            value: result.resource_name
        })
    }

    handleSearchChange = (e, { value }) => {
        if (value === '') {
            this.props.onsearchEmpty()
            this.setState({ value })
            return 
        }
        this.setState({ isLoading: true, value })

        setTimeout(() => {
            if (this.state.value.length < 1) return this.resetComponent()
            //const re = new RegExp(this.state.value, 'i')
            //var results = [];

            if (this.props.filterMetadata) {
                this.props.filterMetadata['prefix'] = this.state.value
                agent.Resources.getResourcesTree(this.props.filterMetadata).then(res => {
                    this.setState({
                        isLoading: false,
                        results: res
                    })
                }, error => {
                    this.setState({
                        isLoading: false,
                        results: []
                    })
                })
            }            
            else {
                agent.Resources.searchResources(this.state.value).then(res => {
                    this.setState({
                        isLoading: false,
                        results: res,
                    })
                }, error => {
                    this.setState({
                        isLoading: false,
                        results: [],
                    })
                });
            }
        }, 1000)
    }

    render() {
        const { isLoading, value, results } = this.state

        return (
            <Search aligned="left"
                loading={isLoading}
                onResultSelect={this.handleResultSelect}
                onSearchChange={this.handleSearchChange.bind(this)}
                results={results}
                value={value}
                resultRenderer={this.resultRenderer}
                fluid
                // {...this.props} 
            />
        )
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(ResourceSearch);
