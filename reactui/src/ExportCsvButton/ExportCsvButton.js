import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import './index.css';

class ExportCsvButton extends Component {
	constructor(props) {
		super(props)
	}
  
  render() {

  	let exportbuttonClassName= (this.props.getActiveResourceListType()==="permissions/resourceListTypeFlat")? 
   							               "export_button_LTR": "export_button"
    return(
    	<div className={exportbuttonClassName} onClick={this.props.onBtExport}>Export to CSV</div>
    )
  }
}

export default ExportCsvButton;