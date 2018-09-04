import React, { Component } from 'react';
import { connect } from 'react-redux';
import { IntlProvider, FormattedNumber } from 'react-intl';
import { Container, Loader, Dimmer, Button, Table, Dropdown, Form, Image, Input, Label, Checkbox, Icon, Segment, Divider, Grid, Message, Popup } from 'semantic-ui-react';
import agent from '../../utils/agent';
import InventoryApp from './InventoryApp'
import Actions from '../actions/Actions'
import {
    APPS_ITEM_SELECTED, DELETE_APP_ACTION_LOAD
} from '../../constants/actionTypes';


const mapStateToProps = state => ({
    ...state.common,
    ...state.apps
});

const mapDispatchToProps = dispatch => ({
    selectAppItem: (payload) => dispatch({ type: APPS_ITEM_SELECTED, payload }),
    deleteApp: (payload) => dispatch({ type: DELETE_APP_ACTION_LOAD, payload })
});

class InstalledApp extends Component {
    constructor(props) {
        super(props);

        this.state = {
            columnHeaders: [
                "",
                "Riskiness",
                "Application",
                "Category",
                "#Users",
                "Subscription (in $)",
                "Annual Cost",
                "Potential Saving",
                ""
            ],
            showInventoryForm: false,
            columnHeaderDataNameMap: {
                "Riskiness": "score",
                "Annual Cost": "annual_cost",
                "Category": 'category',
                "Application":'application',
                "#Users":'num_users',
                "Subscription (in $)":'unit_price',
                "Potential Saving":"potential_saving"
            },
            sortColumnName: this.props.sortColumnName,
            sortOrder: this.props.sortOrder,
            totalCost: null,
            appIdToBeDeleted: undefined,
            currentPage: 1,
            lastPage: undefined,
            appsPayload: undefined,
            isLoadingApps: true,
            listFilters:{}
        }
    }

    componentWillMount() {
        window.scrollTo(0, 0)
        this.setState({
            lastPage: this.props.lastPage,
            appsPayload: this.props.appsPayload,
            isLoadingApps: true
        })
        agent.AppsPrice.getPriceStats().then((res) => {
            this.setState({
                totalCost: res["totalCount"],
            })
        })
        this.fetchFirstInstalledApps();
    }

    componentWillReceiveProps(nextProps) {
        if (nextProps.appsPayload)
            this.setState({
                appsPayload: nextProps.appsPayload,
                isLoadingApps: false,
                lastPage: nextProps.lastPage
            })
    }

    getInstalledApps = (page_num, col_name, sort_order, app_name) => {
        this.setState({
            isLoadingApps: true,
            appsPayload: []
        })
        agent.Apps.getInstalledApps(page_num, col_name, sort_order, app_name).then(payload => {
            let lastPage = null
            if (!page_num) {
                lastPage = payload.last_page ? payload.last_page : null;
            }
            this.setState({
                appsPayload: payload.apps,
                isLoadingApps: false
            })

            if (lastPage) {
                this.setState({
                    lastPage: lastPage
                })
            }
        })
    }


    fetchFirstInstalledApps = () => {
        this.getInstalledApps(this.state.currentPage - 1, this.state.sortColumnName, this.state.sortOrder)
    }


    saveAppLicense = (event, index, unitNum, unitPrice, category, selectedModel, app_id) => {
        let newPayload = [...this.state.appsPayload]
        if (newPayload[index]['is_category_box_visible'] || unitNum && unitPrice) {
            newPayload[index]['is_license_updating'] = true
            agent.Apps.updateApps({"category": category, "unit_num": unitNum, "unit_price": unitPrice, "pricing_model": selectedModel, "application_id": app_id }).then((resp) => {
                newPayload[index]['is_license_updating'] = false
                if(newPayload[index]['is_category_box_visible']){
                    newPayload[index]['is_category_box_visible'] = false
                }
                this.setState({
                    appsPayload:newPayload
                })
            }).catch((err) => {
                this.state.failedMsg = err["message"]
            })
        }
    }

    handleRowChange = (event, index, event_type, data) => {
        let newPayload = [...this.state.appsPayload]
        if (event_type == 'ENTER_UNIT_NUM') {
            newPayload[index]['unit_num'] = event.target.value;
        }
        else if (event_type == 'ENTER_UNIT_PRICE')
            newPayload[index]['unit_price'] = event.target.value;
        else if (event_type == 'SELECT_PLAN_PRICING_MODEL') {
            newPayload[index]['pricing_model'] = data.value;
        }
        else if(event_type == 'CHANGE_CATEGORY'){
            newPayload[index]['category'] = ''
            newPayload[index]['is_category_box_visible'] = true 
        }
        else if(event_type == 'ENTER_CATEGORY'){
            newPayload[index]['category'] = event.target.value;
        }

        this.setState({
            appsPayload: newPayload
        })
    }

    exploreAppsLicenses = () => {
        this.setState({
            showInventoryForm: true,
        })
    }

    closeInventoryForm = (event) => {
        event.preventDefault()
        this.setState({
            showInventoryForm: false
        })
    }

    triggerDeleteAction = (e, appId, appName) => {
        this.setState({
            appIdToBeDeleted: appId
        })
        this.props.deleteApp({ 'actionType': 'remove_app_for_domain', 'app_id': appId, 'app_name': appName })
    }

    handleColumnSort = (mappedColumnName) => {
        let payload = null
        if (this.state.sortColumnName !== mappedColumnName) {
            this.setState({
                isLoadingApps: true
            })
            agent.Apps.getInstalledApps(this.state.currentPage - 1, mappedColumnName, 'asc', this.state.listFilters.appName ? this.state.listFilters.appName.value:"").then((payload) => {
                let lastPage = payload.last_page ? payload.last_page : null;
                this.setState({
                    isLoadingApps: false,
                    sortColumnName: mappedColumnName,
                    sortOrder: 'asc',
                    lastPage: lastPage,
                    appsPayload: payload.apps
                })
            })
        }
        else {
            let sortOrder = this.state.sortOrder === 'asc' ? 'desc' : 'asc';
            this.setState({
                isLoadingApps: true,
            })
            agent.Apps.getInstalledApps(this.state.currentPage - 1, mappedColumnName, sortOrder, this.state.listFilters.appName ? this.state.listFilters.appName.value:"").then((payload) => {
                let lastPage = payload.last_page ? payload.last_page : null;
                this.setState({
                    isLoadingApps: false,
                    sortOrder: sortOrder,
                    lastPage: lastPage,
                    appsPayload: payload.apps
                })
            })
        }
    }

    handleNextClick = () => {
        this.getInstalledApps(this.state.currentPage, this.state.sortColumnName, this.state.sortOrder, this.state.listFilters.appName ? this.state.listFilters.appName.value:"")
        this.setState({
            currentPage: this.state.currentPage + 1
        })
    }
    handlePrevClick = () => {
        this.getInstalledApps(this.state.currentPage-2, this.state.sortColumnName, this.state.sortOrder, this.state.listFilters.appName ? this.state.listFilters.appName.value:"")
        this.setState({
            currentPage: this.state.currentPage - 1
        })
    }

    onCardClicked = (e, param) => {
        this.props.selectAppItem(param)
    }

    handleColumnFilterChange = (event, data, filterType) => {
        this.changeFilter(filterType, data.value, data.value)
    }

    clearFilter = (event, filterType) => {
        event.stopPropagation()
        this.changeFilter(filterType, '', '');
    }

    changeFilter = (filterType, filterText, filterValue) => {
        let newFilter = Object.assign({}, this.state.listFilters);
        if (filterValue) {
            newFilter[filterType] = {"text": filterText, "value": filterValue};
        }
        else {
            delete newFilter[filterType];
        }
        this.setState({
            listFilters:newFilter,
            isLoadingApps:true
        })

        this.getInstalledApps(this.state.currentPage - 1, this.state.sortColumnName, this.state.sortOrder, filterValue || "")
    }

    handleClick = (event) => {
        event.stopPropagation()
    }

    render() {
        let exploreBtn = <Button style={{margin:"5px", fontSize: this.props.style.fontSize}} positive onClick={(event) => this.exploreAppsLicenses()} content='Add Applications' />
        let tableHeaders = this.state.columnHeaders.map((headerName, index) => {
            let mappedColumnName = this.state.columnHeaderDataNameMap[headerName]
            let isSortable = (['Riskiness', 'Annual Cost', 'Category', 'Application', '#Users', 'Subscription', 'Potential Saving'].indexOf(headerName) >=0)  
            let headerCellStyle = !isSortable ? {pointerEvents:"none"}:{pointerEvents:'auto'}
            return (
                <Table.HeaderCell key={headerName} style={headerCellStyle} sorted={this.state.sortColumnName === mappedColumnName ? (this.state.sortOrder === 'asc' ? 'ascending':'descending') : null} onClick={ isSortable ? () => this.handleColumnSort(mappedColumnName) : null}>
                {headerName === "Application" ? <Input icon={this.state.listFilters.appName && this.state.listFilters.appName.value ? <Icon name='close' link onClick={(event) => this.clearFilter(event, "appName")} /> : null} placeholder="Filter by Application ..."
                        value={this.state.listFilters.appName ? this.state.listFilters.appName.value : ''} onClick={(event) => this.handleClick(event)} onChange={(event, data) => this.handleColumnFilterChange(event, data, "appName")} /> : headerName}
               </Table.HeaderCell>
            )
        })
        let containerStyle = {
            height: "100%",
            textAlign: "left",
        };
        let tableRowData = null
        let loader = (<Container style={containerStyle}>
            <Dimmer active inverted>
                <Loader inverted content='Loading' />
            </Dimmer>
        </Container >)
        let modelOptions = [{ 'text': '/month', 'value': 'MONTHLY' }, { 'text': '/year', 'value': 'YEARLY' }]
        let multiplierValues = { 'MONTHLY': 12, 'YEARLY': 1 }
        let dsMap = this.props.datasourcesMap
        if (this.state.appsPayload && this.state.appsPayload.length) {
            tableRowData = this.state.appsPayload.map((rowData, index) => {
                let selectedModel = rowData["pricing_model"]
                let dsImage = null
                let appId = rowData.id
                let score = rowData["score"]
                let scoreColor = score < 1 ? 'grey' : (score < 4 ? 'blue' : (score > 7 ? 'red' : 'yellow'))
                let appCost = null
                let appSavings = null
                let unitNum = rowData["unit_num"]
                let unitPrice = rowData["unit_price"]
                let inactive_users = rowData["inactive_users"]
                let is_category_box_visible = rowData["is_category_box_visible"] 
                if (rowData.datasource_id) {
                    dsImage = <Image inline size='mini' src={dsMap[rowData.datasource_id] && dsMap[rowData.datasource_id].logo} circular></Image>
                }
                if (unitNum) {
                    let multiplier = multiplierValues[selectedModel]
                    if(unitPrice){
                        appCost = (parseFloat(unitNum) * parseFloat(unitPrice) * multiplier).toFixed(2)
                    }
                    if(inactive_users){
                        appSavings = (parseFloat(inactive_users) * parseFloat(unitPrice) * multiplier).toFixed(2)
                    }
                }
                
                let catColor = rowData && rowData["category"] ? 'teal' : 'orange'
                let category = !is_category_box_visible ? (rowData && rowData["category"] ? rowData["category"] : 'Un-categorized'): rowData["category"]
                return (
                    <Table.Row key={index}>
                        <Table.Cell collapsing style={{textAlign:'center'}}>{rowData['is_installed_via_ds']?<Button style={{cursor:'pointer'}} circular icon="angle right" onClick={(e) => this.onCardClicked(e, rowData)} />: null}</Table.Cell>
                        <Table.Cell collapsing textAlign="center"><Label color={scoreColor}></Label></Table.Cell>
                        <Table.Cell style={{maxWidth:"350px", overflow:'hidden', textOverflow:'ellipsis',whiteSpace:'no-wrap'}}>
                            <span style={{ padding: "2px"}}>{(rowData && rowData['publisher_url']) ? <a target="_blank" href={rowData["publisher_url"]}>{rowData["display_text"]}</a> : rowData["display_text"]}</span>
                            {rowData ? <Image inline style={{ float: "right" }} src={rowData["image_url"]} rounded size='mini' /> : ''}
                        </Table.Cell>
                        <Table.Cell >
                            {!is_category_box_visible ? <Label color={catColor} size='mini' >
                                {category}
                                <Icon name='close' onClick={(event) => this.handleRowChange(event, index, 'CHANGE_CATEGORY')} />
                            </Label>: <Input transparent type="text" placeholder='Add Category' value={category} onChange={(event, data) => this.handleRowChange(event, index, 'ENTER_CATEGORY')} />
                            }
                        </Table.Cell>
                        <Table.Cell collapsing><Input style={{maxWidth:'100px'}} transparent type="text" placeholder='#licenses' value={unitNum > 0 ? unitNum : null} onChange={(event, data) => this.handleRowChange(event, index, 'ENTER_UNIT_NUM')} /></Table.Cell>
                        <Table.Cell collapsing>
                        <Input transparent type="text" placeholder='Price' value={unitPrice > 0 ? unitPrice : null} onChange={(event, data) => this.handleRowChange(event, index, 'ENTER_UNIT_PRICE')} label={<Dropdown basic defaultValue={selectedModel} options={modelOptions} onChange={(event, data) => this.handleRowChange(event, index, 'SELECT_PLAN_PRICING_MODEL', data)} />}
                                labelPosition='right' /></Table.Cell>
                        <Table.Cell style={{maxWidth:'100px'}}>{unitNum && unitPrice ? <IntlProvider><FormattedNumber value={appCost} style="currency" currency="USD" /></IntlProvider> : null}</Table.Cell>
                        <Table.Cell collapsing>{inactive_users && unitPrice ? <IntlProvider><FormattedNumber value={appSavings} style="currency" currency="USD" /></IntlProvider> : null}</Table.Cell>
                        <Table.Cell collapsing style={{ 'textAlign': 'center'}}><span><Button size="mini" negative onClick={(e) => this.triggerDeleteAction(e, appId, rowData.display_text)}>Remove</Button> <Button size="mini" positive loading={rowData['is_license_updating']} onClick={(event) => this.saveAppLicense(event, index, unitNum, unitPrice, category, selectedModel, rowData.id)} content='Update' /></span> </Table.Cell>
                    </Table.Row>
                )
            })
        }
        return (
            <div style={{ 'minHeight': document.body.clientHeight / 1.25, display: "block" }}>
                <div style={{ position: 'relative', height: '50px', width: '100%' }}> {exploreBtn} {this.state.totalCost ? <span style={{ float: "right", fontWeight: 600, fontSize: this.props.style.fontSize, padding: "5px", width: this.props.style.width }}>Total Annual Cost -  {<IntlProvider><FormattedNumber value={this.state.totalCost} style="currency" currency="USD" /></IntlProvider>}</span> : null}
                </div>
                <div style={{ position: 'relative', top: '10px', left: '10px', right: '10px', overflowY: 'scroll', height: '70vh' }}>
                    <Table sortable selectable striped celled compact='very'>
                        <Table.Header style={{'width': '100%' }}>
                            <Table.Row>
                                {tableHeaders}
                            </Table.Row>
                        </Table.Header>
                        <Table.Body>
                            {this.state.isLoadingApps ? loader : tableRowData ? tableRowData : null}
                        </Table.Body>
                    </Table>
                    <InventoryApp fetchFirstInstalledApps={this.fetchFirstInstalledApps} showInventoryForm={this.state.showInventoryForm}
                        closeInventoryForm={this.closeInventoryForm} />
                    <Actions />
                </div>
                <div style={{ position: 'relative', margin: '20px' }}>
                { this.state.currentPage > 1 ? <Button color='green' size="mini" style={{ float: 'left', width: '80px' }} onClick={() => { this.handlePrevClick() }}>Previous</Button>: null}
                { this.state.currentPage < this.state.lastPage  ? <Button color='green' size="mini" style={{ float: 'left', width: '80px' }} onClick={() => { this.handleNextClick() }}>Next</Button>: null}
                </div>
            </div>
        )
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(InstalledApp);
