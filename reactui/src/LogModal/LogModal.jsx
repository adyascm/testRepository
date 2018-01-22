import React, { Component } from 'react';
import Modal from '../Modal';
import Columnizer from '../Columnizer';
import Button from '../Button';
//import Activity from '../Activity';
import LogModelData from '../LogModelData';
import LoaderBox from '../LoaderBox';
import { LOG_TYPE_FILE, LOG_TYPE_USER } from '../constants';

const logTypeMap = {
  [LOG_TYPE_USER]: 'user',
  [LOG_TYPE_FILE]: 'resource'
};

class LogModal extends Component {
  render() {
    const showUserColumn = this.props.logType === LOG_TYPE_FILE;
    const showResourceColumn = this.props.logType === LOG_TYPE_USER;
    
    let title;
    if (this.props.logType && this.props.logResourceName) {
      title = `Log for ${logTypeMap[this.props.logType]} ${this.props.logResourceName}`;
    } else {
      title = `Log`;
    }
    
    let modalContent;
    
    if (this.props.isFetchingLog) {
      modalContent = <LoaderBox isFullHeight={true} size='l'/>;
    } else if (!this.props.log || this.props.log.length === 0) {
      modalContent = <p>No log to display.</p>;
    } else {
      modalContent = <LogModelData log={this.props.log}
                                getUserNameForUserId={this.props.getUserNameForUserId}
                                showUserColumn={showUserColumn}
                                showResourceColumn={showResourceColumn} />
    }
    
    const modalFooterEl = (
      <Columnizer hasGutter={true}>
        <Button size='s' label="Close" isPrimary={true} onClick={() => this.props.onClose()} />
      </Columnizer>
    );

    return (
      <Modal title={title}
             isVisible={this.props.isVisible}
             footerContent={modalFooterEl}
             isExpanded={true}
             onClose={() => this.props.onClose()}>{modalContent}</Modal>
    );
  }
}

export default LogModal;
