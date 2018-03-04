import React, { Component } from 'react'

import { connect } from 'react-redux';
import GroupSearch from './GroupSearch';
import ResourceSearch from './ResourceSearch';


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
        return (
            <div style={{textAlign: 'left'}}>
                {this.props.common.currentView === "/users" ? <GroupSearch /> : <ResourceSearch />}
            </div>
        )
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(AppSearch);
