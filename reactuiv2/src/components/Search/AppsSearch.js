import React, { Component } from 'react';
import { connect } from 'react-redux';

import { Search } from 'semantic-ui-react';

const mapStateToProps = state => ({
    ...state.apps
})

class AppsSearch extends Component {
    constructor(props) {
        super(props);

        this.state = {
            isLoading: false,
            value: '',
            results: []
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
        this.setState({ isLoading: true, value })

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
                results: results
            })
        }, 1000)
    }

    handleResultSelect = (e, { result }) => {
        this.setState({
            value: result.display_text
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
            />
        )
    }
}

export default connect(mapStateToProps)(AppsSearch);