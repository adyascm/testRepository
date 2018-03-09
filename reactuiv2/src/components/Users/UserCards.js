import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Card, Image, Label } from 'semantic-ui-react'
import { USER_ITEM_SELECTED } from '../../constants/actionTypes'


const mapStateToProps = state => ({
    selectedUserItem: state.users.selectedUserItem
});

const mapDispatchToProps = dispatch => ({
    selectUserItem: (payload) =>
        dispatch({ type: USER_ITEM_SELECTED, payload })
});

class UserCards extends Component {

    onCardClicked(event, param) {
        this.props.selectUserItem(param.user);
    }

    render() {
        var userCards = this.props.rows.map(row => {
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
        });
        
        return (
            <Card.Group style={{ maxHeight: document.body.clientHeight, overflow: "auto" }}>
                {userCards}
            </Card.Group>
        )
    }
}

export default connect(mapStateToProps,mapDispatchToProps)(UserCards);