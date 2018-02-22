import React, { Component } from 'react'
import { Search, Grid } from 'semantic-ui-react'
import { Link } from 'react-router-dom'

import { connect } from 'react-redux';
import agent from '../../utils/agent';
import GroupSearch  from './GroupSearch';
import ResourceSearch  from './ResourceSearch';


const mapStateToProps = state => ({
    ...state
});

const mapDispatchToProps = dispatch => ({
});

class AppSearch extends Component {


    componentWillMount() {

        this.resetComponent(this.props.common.currentView)
    }

    resetComponent = () => this.setState({ isLoading: false, results: [], value: '' })


    render() {

        console.log();
        return(
          <div>
          {this.props.common.currentView === "/users" ?   <GroupSearch /> : <ResourceSearch />}

          </div>
        )


    }
}

export default connect(mapStateToProps, mapDispatchToProps)(AppSearch);
