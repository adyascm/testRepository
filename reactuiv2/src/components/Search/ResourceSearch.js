import React, { Component } from 'react'
import { Search, Grid } from 'semantic-ui-react'
import { Link } from 'react-router-dom'

import { connect } from 'react-redux';
import agent from '../../utils/agent'

const mapStateToProps = state => ({
    ...state
});

const mapDispatchToProps = dispatch => ({
});

class ResourceSearch extends Component {

    constructor(props) {
        super(props);
        this.state = {
            isLoading: false,
            value: '',
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
        console.log("search result : ", result)
        if (this.props.onChangeReportInput) {
            this.props.onChangeReportInput("selected_entity", result.resource_id)



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
                {...this.props} />
        )
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(ResourceSearch);
