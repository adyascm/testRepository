import React, { Component } from 'react'

import { connect } from 'react-redux';
import GroupSearch from './GroupSearch';
import ResourceSearch from './ResourceSearch';
import AppsSearch from './AppsSearch';


const mapStateToProps = state => ({
    ...state
});

const mapDispatchToProps = dispatch => ({
});

class AppSearch extends Component {

    render() {
        return (
            <div style={{textAlign: 'left'}}>
                {this.props.common.currentUrl === "/users" ? <GroupSearch /> : 
                    this.props.common.currentUrl === "/apps" ? <AppsSearch /> : <ResourceSearch />}
            </div>
        )
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(AppSearch);
