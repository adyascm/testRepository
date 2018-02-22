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

class GroupSearch extends Component {

  constructor(props) {
    super(props);
    this.state = {
      isLoading: false,
      value: '',
      results: []

    }
  }

  resultRenderer = (r) => {
      return <div>{r.resource_name}</div>
  }

    resetComponent = () => this.setState({ isLoading: false, results: [], value: '' })

    handleResultSelect = (e, { result }) => {
      console.log("search result : ", result)
      if(this.props.onChangeReportInput){
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
            }, 1000)
          }

    render() {
        const { isLoading, value, results } = this.state
        console.log("this.props.defaultValue ", this.props.defaultValue);

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
