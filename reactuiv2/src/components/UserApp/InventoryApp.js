import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Loader, Dimmer, Image, Container, Segment, Form, Select, Header, Input, Checkbox, Button, Label, Icon, Modal, Card, Divider, Pagination } from 'semantic-ui-react';
import agent from '../../utils/agent';
import InventorySearch from './InventorySearch';
import {
    APPS_INVENTORY_LOAD_START,
} from '../../constants/actionTypes';

const mapStateToProps = state => ({
    ...state.apps,
    ...state.common
});

class InventoryApp extends Component {
    constructor(props) {
        super(props);
        this.state = {
            inventoryApps: undefined,
            showInventoryForm: false,
            selectedApps: {},
            lastPage: null,
            filterQueryValue: '',
            currentPage: 1,
            isLoading: false
        }
    }

    componentWillReceiveProps(nextProps) {
        if(nextProps.showInventoryForm){
            window.scrollTo(0, 0)
            this.setState({
                isLoading:true,
                showInventoryForm:nextProps.showInventoryForm,
            })
            this.getAvailableApps(0);
        }
        if(nextProps.showInventoryForm === false){
            this.setState({
                isLoading:false,
                showInventoryForm:false
            })
        }
    }

    submitInventoryForm = (event) => {
        let selectedApps = this.state.selectedApps
        let app_ids = []
        for (let key in selectedApps) {
            if (selectedApps[key]['id'] && selectedApps[key]['checked'])
                app_ids.push(selectedApps[key]['id'])
        }
        if(app_ids.length){
            agent.Apps.insertApps({ "app_ids": app_ids }).then((resp) => {
                this.props.fetchFirstInstalledApps()
            }).catch((err) => {
            })
        }
        this.props.closeInventoryForm(event)
    }

    handleInventoryAppChange = (event, data) => {
        if(!this.state.selectedApps[data.label])
            this.state.selectedApps[data.label] = {id: data.id, checked :data.checked } 
        else
            this.state.selectedApps[data.label]['checked'] = data.checked
    }

    handleNextClick = () => {
        this.setState({
            isLoading: true
        })
        this.getAvailableApps(this.state.currentPage, this.state.filterQueryValue);
        let currentPage = null
        if (this.state.lastPage > this.state.currentPage + 1) {
            currentPage = this.state.currentPage + 1
        }
        else {
            currentPage = 0
        }
        this.setState({
            currentPage: currentPage
        })
    }
    resetComponent = () => { this.setState({ isLoading: false, filterQueryValue: '' }) }
    
    handleEmptySearch = () => {
        this.setState({
            filterQueryValue: '',
            isLoading: true
        })
        this.getAvailableApps(0);
    }

    handleSearchChange = (e, { value }) => {
        this.setState({
            filterQueryValue: value
        })

        if (value == '') {
            this.handleEmptySearch()
            return
        }
        this.setState({
            isLoading: true
        })
        setTimeout(() => {
            if (value.length < 1) return this.resetComponent();
            this.getAvailableApps(0,this.state.filterQueryValue);
        }, 1000)
    }

    getAvailableApps = (page_num, val ) => {
        agent.Apps.getAvailableApps(page_num, val).then(payload => {
            if(!page_num){
                let lastPage = payload.last_page ? payload.last_page : 0;
                this.setState({
                    lastPage:lastPage,
                    currentPage:1
                })
            }
            
            this.setState({
                isLoading: false,
                inventoryApps: payload.apps,
            })
        }, error => {
        });
    }

    render() {
        let appCards = null
        if (this.state.inventoryApps) {
            appCards = this.state.inventoryApps.map((app, index) => {
                let app_id = app.id
                let app_img = app.image_url
                let app_name = app.name
                return (
                    <Card>
                        <Card.Content>
                            <Image floated='right' size='small' src={app_img} />
                            <Card.Header>{<Checkbox key={app_name} id={app.id} onChange={(event, data) => this.handleInventoryAppChange(event, data)} label={app_name} width={2} />}</Card.Header>
                        </Card.Content>
                    </Card>
                )
            })
        }

        return (
            <Modal size='large' dimmer="inverted" className="scrolling" open={this.state.showInventoryForm}>
                <Modal.Header style={{ border: '0' }}>
                    <div style={{ display: "inline-flex", width: "100%" }}>
                        <span style={{ padding: "5px", width: '70%' }}>Select and add applications </span><span style={{ width: '100px', float: 'right' }}><InventorySearch handleEmptySearch={() => this.handleEmptySearch()} handleSearchChange={this.handleSearchChange} filterQueryValue={this.state.filterQueryValue} /></span>
                    </div>
                </Modal.Header>
                <Modal.Content>
                    <Card.Group itemsPerRow={5}>
                        { !this.state.isLoading && (!appCards || !appCards.length) ? 'No Applications in inventory' : appCards } 
                        <Dimmer active={this.state.isLoading} inverted>
                            <Loader inverted content='Loading...' />
                        </Dimmer>
                    </Card.Group>
                    <Divider hidden />
                        <Modal.Actions style={{ "textAlign": 'right' }}>
                            {this.state.lastPage > 1  ? <Button size="mini" style={{ float: 'left' }} onClick={this.handleNextClick}>Show More</Button> : null }
                            <Button negative onClick={this.props.closeInventoryForm}>Close</Button>
                            {this.state.inventoryApps && this.state.inventoryApps.length ? <Button style={{ "marginRight": '0' }} positive content='Add' icon='checkmark' labelPosition='right' onClick={this.submitInventoryForm} />
                            : null}
                        </Modal.Actions> 
                </Modal.Content>
            </Modal>
        )
    }
}


export default InventoryApp;