import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Button, Form, Header, Container, Dimmer, Loader } from 'semantic-ui-react'
import agent from '../../utils/agent';
import TagsInput from 'react-tagsinput';
import 'react-tagsinput/react-tagsinput.css'


import {
  CREATE_TRUSTED_ENTITIES,
  SET_TRUSTED_ENTITIES
} from '../../constants/actionTypes';

const mapStateToProps = state => ({
  ...state.common
});

const mapDispatchToProps = dispatch => ({
  setTrustedEntities: (trustedEntities) =>
    dispatch({ type: SET_TRUSTED_ENTITIES, payload: trustedEntities }),

});

class WhitelistItem extends Component {

  constructor(props) {
      super(props);
      this.state = {
        trustedEntitiesMap: {
          'trusted_domains' : [],
          'trusted_apps': [],
          isLoading: false
        }
      }
  }

  componentWillMount(){
    this.props.setTrustedEntities(agent.Setting.getTrustedEntities(this.props.currentUser['domain_id']))

  }

  componentWillReceiveProps(nextProps){
     if(nextProps.trustedEntities && Object.keys(nextProps.trustedEntities).length > 0){
       this.setState({
         trustedEntitiesMap: nextProps.trustedEntities
       })
     }

  }

  handleSubmit = () => {
    this.setState({
        isLoading: true
    })
    var input = this.state.trustedEntitiesMap
    input['domain_id'] = this.props.currentUser['domain_id']
    agent.Setting.createTrustedEntities(input).then(res => {
      this.setState({
          isLoading: false
      })
  }).catch({ });
  }


  handlechange = (key, value) => {
    var currentstate = {}
    currentstate = this.state.trustedEntitiesMap

     currentstate[key] = value
     this.setState({
       trustedEntitiesMap: currentstate
     })

  }

  render(){
    return(
      <Container>
        <Header >Trusted Domains and Apps</Header>
          <div style={{'marginBottom':'3%'}}>
                <TagsInput value={this.state.trustedEntitiesMap['trusted_domains'].length !== 0 ? this.state.trustedEntitiesMap['trusted_domains'] : []}
                  onChange={(e) => this.handlechange('trusted_domains', e)}
                  inputProps={{placeholder:"domains..."}} addOnBlur={true}
                  />
          </div>
          <div style={{'marginBottom':'3%'}}>
                <TagsInput value={this.state.trustedEntitiesMap['trusted_apps'].length !== 0 ?
                    this.state.trustedEntitiesMap['trusted_apps'] : []}
                    onChange={(e) => this.handlechange('trusted_apps', e)}
                   inputProps={{placeholder:"apps..."}} addOnBlur={true}
                  />
      </div>
          <Button basic color='green' type='reset' loading={this.state.isLoading} onClick={this.handleSubmit}>Save
          </Button>
      </Container>


    )
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(WhitelistItem);
