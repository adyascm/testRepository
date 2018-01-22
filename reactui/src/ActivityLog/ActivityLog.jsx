import React, {Component} from 'react';
import LogModelData from '../LogModelData';
import { AgGridReact } from 'ag-grid-react';
import {fetchLogWorkflow} from '../PermissionsApp/actions';
import {LOG_TYPE_USER} from '../constants';

class ActivityLog extends Component {
  constructor(props) {
    super(props);
  }

  componentWillMount() {
    if (this.props.logType === LOG_TYPE_USER) {
      this.props.fetchLogWorkflow(
        this.props.logType,
        this.props.profile.email,
        this.props.userId[1],
        null,
        this.props.profile.authToken,
        this.props.columnNames
      );
    }
    else {
      this.props.fetchLogWorkflow(
        this.props.logType,
        this.props.profile.email,
        null,
        this.props.activeFile[1],
        this.props.profile.authToken,
        this.props.columnNames
      );
    }
  }

  render() {
    return(
      <LogModelData log={this.props.log}
                    showUserColumn={this.props.showUserColumn}
                    showResourceColumn={this.props.showResourceColumn} />
    )
  }
}

export default ActivityLog;
