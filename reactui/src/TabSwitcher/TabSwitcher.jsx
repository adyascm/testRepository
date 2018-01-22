import React, { Component } from 'react';
import TabSwitcherHeader from '../TabSwitcherHeader';
import find from 'lodash/find';

class TabSwitcher extends Component {
  constructor(props) {
    super(props);

    this.state = {
      activeTab: this.props.tabs[0].id
    };
  }

  setActiveTab = id => this.setState({ activeTab: id });
  
  render() {
    const activeComponent = find(this.props.tabs, tab => tab.id === this.state.activeTab).component;

    return (
      <div>
        <TabSwitcherHeader tabs={this.props.tabs}
                           activeTab={this.state.activeTab}
                           setActiveTab={this.setActiveTab} />
        <div>{activeComponent}</div>
      </div>
    );
  }

}

export default TabSwitcher;
