import React, {Component} from 'react';
import {Tab} from 'semantic-ui-react';
import {connect} from 'react-redux';
import ResourcePermissions from './ResourcePermissions';

const mapStateToProps = state => ({
    ...state.resources
})

class ResourcePermissionSection extends Component {
    constructor(props) {
        super(props);
        this.state = {
            rowData: ''
        }
    }

    componentWillReceiveProps(nextProps) {
        if (nextProps.rowData) {
            this.setState({
                rowData: nextProps.rowData
            })
        }
    }

    render() {
        let panes = [
            { menuItem: 'Permissions', render: () => <Tab.Pane attached={false}><ResourcePermissions rowData={this.state.rowData} /></Tab.Pane> }   
          ]
        return (
            <Tab menu={{ secondary: true, pointing: true }} panes={panes} />
        )
    }
}

export default connect(mapStateToProps)(ResourcePermissionSection);