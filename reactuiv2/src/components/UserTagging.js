import React, {Component} from 'react'
import ReactTags from 'react-tag-autocomplete'
import agent from '../utils/agent'
import { connect } from 'react-redux'

import { UPDATE_POLICY_ACTION_EMAIL, UPDATE_TRUSTED_ENTITIES } from '../constants/actionTypes'

const mapStateToProps = state => ({
    // actionEmail: state.policy.actionEmail
})

const mapDispatchToProps = dispatch => ({
    updateActionEmail: (actionType, email) => dispatch({ type: UPDATE_POLICY_ACTION_EMAIL, actionType, email }),
    updateTrustedEntities: (actionType, entityName, entityList) => dispatch({ type: UPDATE_TRUSTED_ENTITIES, actionType, entityName, entityList })    
})

class UserTagging extends Component {
    constructor(props) {
        super(props)

        this.state = {
            tags: [],
            suggestions: [],
            itemsList: this.props.itemsList,
            placeholder: {
                "policy": "Add new email",
                "domain": "Add new domain",
                "app": "Add new app"
            }
        }
    }

    componentWillMount() {
        console.log(this.state.itemsList)
        let tags = []
        for (let index in this.state.itemsList) {
            let tag_obj = {}
            tag_obj['id'] = index
            tag_obj['name'] = this.state.itemsList[index]
            tags.push(tag_obj)
        }
        this.setState({
            tags: tags
        })
    }

    componentWillReceiveProps(nextProps) {
        if (nextProps.itemsList !== this.props.itemsList) {
            let tags = []
            for (let index in nextProps.itemsList) {
                let tag_obj = {}
                tag_obj['id'] = index
                tag_obj['name'] = nextProps.itemsList[index]
                tags.push(tag_obj)
            }
            this.setState({
                tags: tags
            })
        }
    }

    handleChange = (data) => {
        if (this.props.source === "policy") {
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
    }

    handleAddition = (tag) => {
        let tags = [...this.state.tags]
        tags.push(tag)
        this.setState({
            tags: tags
        })
        if (this.props.source === "policy")
            this.props.updateActionEmail('SET', tags)
        else
            this.props.updateTrustedEntities('SET', this.props.source, tags)
    }

    handleDelete = (index) => {
        let tags = [...this.state.tags]
        tags.splice(index,1)
        this.setState({
            tags: tags
        })
        if (this.props.source === "policy")
            this.props.updateActionEmail('SET', tags)
        else
            this.props.updateTrustedEntities('SET', this.props.source, tags)
    }

    render() {
        
        return (
            <ReactTags 
                className="react-tags__search-input input"
                tags={this.state.tags}
                suggestions={this.state.suggestions}
                handleInputChange={(data) => this.handleChange(data)}
                handleAddition={(data)=>this.handleAddition(data)}
                handleDelete={(index)=>this.handleDelete(index)}
                allowNew={true}
                placeholder={this.state.placeholder[this.props.source]}
            />
        )
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(UserTagging)