import React, {Component} from 'react'
import ReactTags from 'react-tag-autocomplete'
import agent from '../utils/agent'
import { connect } from 'react-redux'

import { UPDATE_POLICY_ACTION_EMAIL } from '../constants/actionTypes'

const mapStateToProps = state => ({
    actionEmail: state.policy.actionEmail
})

const mapDispatchToProps = dispatch => ({
    updateActionEmail: (actionType, email) => dispatch({ type: UPDATE_POLICY_ACTION_EMAIL, actionType, email })    
})

class UserTagging extends Component {
    constructor(props) {
        super(props)

        this.state = {
            tags: [],
            suggestions: []
        }
    }

    componentWillMount() {
        console.log(this.props.actionEmail)
        let tags = []
            for (let index in this.props.actionEmail) {
                let tag_obj = {}
                tag_obj['id'] = index
                tag_obj['name'] = this.props.actionEmail[index]
                tags.push(tag_obj)
            }
            this.setState({
                tags:tags
            })
    }

    handleChange = (data) => {
        agent.Users.getUsersList('',data,'',this.props.datasource,'','','','','').then(users => {
            console.log(users)
            let suggestions = []
            for (let index in users) {
                let suggestion = {}
                suggestion['id'] = index
                suggestion['name'] = users[index]['email']
                suggestions.push(suggestion)
            }
            this.setState({
                suggestions: suggestions
            })
        }).catch(err => {
            console.log(err)
        })
    }

    handleAddition = (tag) => {
        let tags = [...this.state.tags]
        tags.push(tag)
        this.setState({
            tags: tags
        })
        this.props.updateActionEmail('SET', tags)
    }

    handleDelete = (index) => {
        let tags = [...this.state.tags]
        tags.splice(index,1)
        this.setState({
            tags: tags
        })
        this.props.updateActionEmail('SET', tags)
    }

    render() {
        
        return (
            <ReactTags 
                tags={this.state.tags}
                suggestions={this.state.suggestions}
                handleInputChange={(data) => this.handleChange(data)}
                handleAddition={(data)=>this.handleAddition(data)}
                handleDelete={(index)=>this.handleDelete(index)}
                allowNew={true}
                placeholder='Add new email'
            />
        )
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(UserTagging)