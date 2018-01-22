import React, { Component } from 'react';

class ManageDataSourceCell extends Component {
	constructor(props) {
		super(props);
		this.state = {
			datasourceVal : this.props.value,
			usersourceVal : this.props.value
		}
	}
	handleDatasourceChange = (event) => {
		this.setState({
			datasourceVal: this.props.handleDatasourceChange(event)
		});
	}
	handleusersourceChange = (event) => {
		this.setState({
			usersourceVal: this.props.handleusersourceChange(event)
		});
	}

  render() {
  	if(this.props.getUserSource()) {
  		return (
	      <div style={{margin: 0}}>
	      {this.props.getEdit(this.props) ? <div>
	      <input onBlur={()=>{}} onChange={this.handleusersourceChange} className="ag-grid-edit-input" type="text" value={this.state.usersourceVal} />
	      </div>
	      :
	      	<div>
	  			<span>{this.props.value}</span>
	  		</div>
	  	  }
	      </div>
	    );
  	}
    return (
      <div style={{margin: 0}}>
        
      	{this.props.getEdit(this.props) ? <div>
      		<input onBlur={()=>{}} onChange={this.handleDatasourceChange} className="ag-grid-edit-input" type="text" value={this.state.datasourceVal} />
      		</div>
      		:
      		<div>
      			<input type="radio" onChange={()=>{}} checked={this.props.getIsActive(this.props) ? "checked" : ""} className="inputRadioBtn" value={this.props.data[0]} /><span>{this.props.value}</span>
      		</div>
      	}
      </div>
    );
  }
}

export default ManageDataSourceCell;
