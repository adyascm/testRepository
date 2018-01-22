// @flow
import React, {Component} from 'react';
import Modal from '../Modal';
import Columnizer from '../Columnizer';
import Button from '../Button';
import {spaces} from '../designTokens';

type TPermissionsModalProps = {};

class PermissionsModal extends Component {
  props: TPermissionsModalProps;

  render() {
    if (!this.props.isVisible) {
      return null;
    }
    
    const modalFooterEl = (
      <Columnizer hasGutter={true}>
        <Button size='s' label="Close" isPrimary={true} onClick={() => this.props.onClose()} />
      </Columnizer>
    );

    return (
      <Modal title='Change Permissions'
             footerContent={modalFooterEl}
             isVisible={true}>
        <div style={{padding: spaces.s}}>
          <label htmlFor="#perm-radio-1">
            <input type="radio" id="#perm-radio-1" name="perm-radio" value="n" defaultChecked={true}/> No Access
          </label>
          <label htmlFor="#perm-radio-2">
            <input type="radio" id="#perm-radio-2" name="perm-radio" value="r"/> Read Only
          </label>
          <label htmlFor="#perm-radio-3">
            <input type="radio" id="#perm-radio-3" name="perm-radio" value="rw"/> Read & Write
          </label>
        </div>
      </Modal>
    );
  }
}

export default PermissionsModal;
