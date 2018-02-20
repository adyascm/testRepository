import React, {Component} from 'react';
import {Tab,Segment,Sticky,Icon} from 'semantic-ui-react';
import {connect} from 'react-redux';
import ResourcePermissions from './ResourcePermissions';
import ResourceDetails from './ResourceDetails';
import {RESOURCES_TREE_SET_ROW_DATA} from '../../constants/actionTypes';

const mapStateToProps = state => ({
    ...state.resources
})

const mapDispatchToProps = dispatch => ({
    closingDetailsSection: (payload) => dispatch({ type:RESOURCES_TREE_SET_ROW_DATA, payload })
})

class ResourcePermissionSection extends Component {
    constructor(props) {
        super(props);
        this.state = {
            rowData: ''
        }
        this.closeDetailsSection = this.closeDetailsSection.bind(this);
    }

    componentWillReceiveProps(nextProps) {
        if (nextProps.rowData) {
            this.setState({
                rowData: nextProps.rowData
            })
        }
    }

    closeDetailsSection() {
        this.props.closingDetailsSection(undefined)
    }

    render() {
        let panes = [
            { menuItem: 'Permissions', render: () => <Tab.Pane attached={false}><ResourcePermissions rowData={this.state.rowData} /></Tab.Pane> }   
          ]
        return (
            <Segment>
                {/* <Sticky> */}
                    <Icon name='close' onClick={this.closeDetailsSection} />
                    <ResourceDetails rowData={this.props.rowData} />
                    <Tab menu={{ secondary: true, pointing: true }} panes={panes} />
                {/* </Sticky> */}
            </Segment>
        )
    }
}

export default connect(mapStateToProps,mapDispatchToProps)(ResourcePermissionSection);