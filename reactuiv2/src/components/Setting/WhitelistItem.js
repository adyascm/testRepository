import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Button, Checkbox, Form, Dropdown, Container } from 'semantic-ui-react'
import agent from '../../utils/agent';
import TagsInput from 'react-tagsinput';
import 'react-tagsinput/react-tagsinput.css'


import {
  CREATE_TRUSTED_PARTNER,
  SET_TRUSTED_PARTNER
} from '../../constants/actionTypes';

const mapStateToProps = state => ({
  ...state.common
});

const mapDispatchToProps = dispatch => ({
  addTrustedPartners: (trustedPartners) => {
    dispatch({ type: CREATE_TRUSTED_PARTNER, payload: agent.Setting.createTrustedPartners(trustedPartners) })
  },
  setTrustedPartners: (trustedPartners) =>
    dispatch({ type: SET_TRUSTED_PARTNER, payload: trustedPartners }),

});

class WhitelistItem extends Component {

  constructor(props) {
      super(props);
      this.state = {
        trustedPartnerMap: {
          'trusted_domains' : [],
          'trusted_apps': []
        }
      }
  }

  componentWillMount(){
    this.props.setTrustedPartners(agent.Setting.getTrustedPartners(this.props.currentUser['domain_id']))

  }

  componentWillReceiveProps(nextProps){
     if(nextProps.trustedPartners && Object.keys(nextProps.trustedPartners).length > 0){
       this.setState({
         trustedPartnerMap: nextProps.trustedPartners
       })
     }

  }

  handleSubmit = () => {
    var input = this.state.trustedPartnerMap
    input['domain_id'] = this.props.currentUser['domain_id']
    this.props.addTrustedPartners(input)

  }


  handlechange = (key, value) => {
    var currentstate = {}
    currentstate = this.state.trustedPartnerMap

     currentstate[key] = value
     this.setState({
       trustedPartnerMap: currentstate
     })

  }

  render(){
    return(
      <div>
          <div style={{'marginBottom':'3%'}}>
                <TagsInput value={this.state.trustedPartnerMap['trusted_domains'].length !== 0 ? this.state.trustedPartnerMap['trusted_domains'] : []}
                  onChange={(e) => this.handlechange('trusted_domains', e)}
                  inputProps={{placeholder:"Add Domain"}}
                  />
          </div>
          <div style={{'marginBottom':'3%'}}>
                <TagsInput value={this.state.trustedPartnerMap['trusted_apps'].length !== 0 ?
                    this.state.trustedPartnerMap['trusted_apps'] : []}
                    onChange={(e) => this.handlechange('trusted_apps', e)}
                   inputProps={{placeholder:"Add Apps"}}
                  />
      </div>
          <Button basic color='green' type='reset' onClick={this.handleSubmit}>Save</Button>  
      </div>


    )
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(WhitelistItem);
