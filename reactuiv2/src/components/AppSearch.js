import React, { Component } from 'react'
import { Search, Grid } from 'semantic-ui-react'
import { Link } from 'react-router-dom'

import { connect } from 'react-redux';
import agent from '../utils/agent'

const mapStateToProps = state => ({
    ...state
});

const mapDispatchToProps = dispatch => ({
});

class AppSearch extends Component {
    componentWillMount() {
        
        this.resetComponent(this.props.common.currentView)
    }

    resultRenderer = (r) => {
        return <Link to={this.state.currentView || "/resources"}>{r.resource_name} </Link>
    }

    resetComponent = () => this.setState({ isLoading: false, results: [], value: '' })

    handleResultSelect = (e, { result }) => this.setState({

    })

    handleSearchChange = (e, { value }) => {
        this.setState({ isLoading: true, value })
        
        setTimeout(() => {
            if (this.state.value.length < 1) return this.resetComponent()
            console.log(this.props.common.currentView);
            const re = new RegExp(this.state.value, 'i')

            var results = [];
            if (this.props.common.currentView === "/users") {
                var keys = Object.keys(this.props.users.usersTreePayload)

                for (let index = 0; index < keys.length; index++) {
                    let row = this.props.users.usersTreePayload[keys[index]]
                    if (keys[index].match(re))
                    {
                        row.resource_name = keys[index];
                        results.push(row);
                    }
                }
                this.setState({
                    isLoading: false,
                    results: results,
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
                {...this.props}
            />
        )
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(AppSearch);