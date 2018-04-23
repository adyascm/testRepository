import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Card, Image, Label, Container, Accordion, Icon } from 'semantic-ui-react'
import { USER_ITEM_SELECTED } from '../../constants/actionTypes'


const mapStateToProps = state => ({
    selectedUserItem: state.users.selectedUserItem
});

const mapDispatchToProps = dispatch => ({
    selectUserItem: (payload) =>
    dispatch({ type: USER_ITEM_SELECTED, payload })
});

class UserCards extends Component {
    
    constructor(props) {
        super(props);
        this.state = {
            activeIndex: 0,
            domainDict : {}    
        }
    }
    
    accordionTitleStyle = { background:'#add8e6', 'margin':'10px' }

    handleClick = (e, titleProps) => {
        const { index } = titleProps
        const { activeIndex } = this.state
        const newIndex = activeIndex === index ? -1 : index
        
        this.setState({ activeIndex: newIndex })
    }
    
    onCardClicked(event, param) {
        this.props.selectUserItem(param.user);
    }
    
    componentWillMount() {
        const { activeIndex } = this.state.activeIndex
        var domainDict = {}
        for(var i in this.props.rows){
            var row = this.props.rows[i]
            var email = row['key']
            var domainName = email.substring((email.lastIndexOf('@')+1)).trim()
            if(!(domainName in domainDict)){
                domainDict[domainName] = [row]
            } else{
                domainDict[domainName].push(row)
            }
        }
        this.setState({
            domainDict : domainDict
        })
    }

    createCards(domainName){
        return this.state.domainDict[domainName].map(row =>{
            var image = null;
            if (row.photo_url) {
                image = <Image inline floated='right' size='mini' src={row.photo_url} circular></Image>
            } else {
                image = <Image floated='right' size='tiny' ><Label style={{ fontSize: '1.2rem' }} circular >{row.name.charAt(0)}</Label></Image>
            }
            return ((
                <Card key={row.key} user={row} onClick={this.onCardClicked.bind(this)} color={this.props.selectedUserItem && this.props.selectedUserItem.key === row.key?'blue':null}>
                <Card.Content>
                {image}
                <Card.Header>
                {row.name}
                </Card.Header>
                <Card.Description>
                {row.key}
                </Card.Description>
                </Card.Content>
                </Card>
            ))
        })
    }

    render() {
        
        var userDomains = Object.keys(this.state.domainDict).sort().map((domainName, index) => {
            return(
                <Accordion key={index} fluid>
                <Accordion.Title style={this.accordionTitleStyle} active={this.state.activeIndex === index} index={index} onClick={this.handleClick}>
                <Icon name='dropdown' />
                {domainName}
                </Accordion.Title>
                <Accordion.Content active={this.state.activeIndex === index }>
                <Container>
                <Card.Group style={{ maxHeight: document.body.clientHeight, overflow: "auto" }}>
                {this.createCards(domainName)}
                </Card.Group>
                </Container>
                </Accordion.Content>
                </Accordion>
            )
        });  

        return (
            <div>
            {userDomains}
            </div>
        )
    }
}

export default connect(mapStateToProps,mapDispatchToProps)(UserCards);