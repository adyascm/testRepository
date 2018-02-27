import React, { Component } from 'react';

class Toolbar extends Component {
    componentDidMount() {
      this.props.onToggleFilter();
    }
  
    render() {
      return null;
    }
  }

  export default Toolbar;