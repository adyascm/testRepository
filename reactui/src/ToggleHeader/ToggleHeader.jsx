import React, { Component } from 'react';
//import { StyleSheet } from 'aphrodite/no-important';
//import { colors, spaces } from '../designTokens';
//import Icon from '../Icon';
import Button from '../Button';


// const styles = StyleSheet.create({
//   tabsContainer: {
//     listStyle: 'none',
//     padding: 0,
//     textAlign: 'center'
//   },
//   tab: {
//     display: 'inline-block',
//     textTransform: 'uppercase',
//     cursor: 'pointer',
//     width: '50%',
//     minWidth: spaces.xl,
//     paddingBottom: spaces.xs,
//     borderBottom: `solid ${spaces.xxs} ${colors.primaryTint7}`
//   },
//   tab__active: {
//     color: colors.textLight,
//     borderBottom: `solid ${spaces.xxs} ${colors.primary}`
//   }
// });

class TogglerHeaderComponent extends Component {
  toggleTab = (props,t1,t2) => {
    console.log(props.activeTab + " togglebutton " + t1.id + " 2nd one " + t2.id)
    if(t1.id === props.activeTab){
      console.log(true)
      props.setActiveTab(t2.id)
      console.log(t2.icon)
    }else{
      console.log(false)
      props.setActiveTab(t1.id)
    }
  }
  render() {
    let toggle1 = this.props.tabs[0];
    let toggle2 = this.props.tabs[1];
    const tabs = (
      <div>

        <Button
          isPrimary={true}
          disabled={this.props.activeUser === null}
          onClick={() => this.toggleTab(this.props,toggle1,toggle2)}
          label={this.props.activeTab === toggle1.id ? "View Accessible" : "View All"}
          size='s'>

        </Button>
      </div>
    );
    return (
      <div>{tabs}</div>
    );
  }
}

export default TogglerHeaderComponent;
