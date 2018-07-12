import React, { Component } from 'react';
import { connect } from 'react-redux';
import { IntlProvider, FormattedNumber } from 'react-intl';
import { Container, Loader, Dimmer, Button, Table, Dropdown, Form, Image, Input, Label, Checkbox, Icon, Segment, Divider, Grid, Message, Popup } from 'semantic-ui-react';
import agent from '../../utils/agent';
import InventoryApp from './InventoryApp'
import Actions from '../actions/Actions'
import {
    APPS_ITEM_SELECTED, DELETE_APP_ACTION_LOAD, SET_POLICY_FILTER
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
                "Potential Savings",
                ""
            ],
            showInventoryForm: false,
            columnHeaderDataNameMap: {
                "Riskiness": "score",
                "Annual Cost": "annual_cost",
                "Category": 'category',
                "Application":'application',
                "#Users":'num_users',
                "Subscription (in $)":'unit_price'
                // "Annual Savings":'annual_savings'
            },
            sortColumnName: this.props.sortColumnName,
            sortOrder: this.props.sortOrder,
            totalCost: null,
            appIdToBeDeleted: undefined,
            currentPage: 1,
            lastPage: undefined,
            appsPayload: undefined,
            isLoadingApps: true,
            listFilters:{},
            isLicenseUpdating:{}
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
                isLoadingApps: false
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


    saveAppLicense = (event, index, unitNum, unitPrice, selectedModel, app_id) => {
        if (unitNum && unitPrice) {
            const isLicenseUpdating = this.state.isLicenseUpdating
            isLicenseUpdating[index] = true
            this.setState({
                isLicenseUpdating
            })
            agent.Apps.updateApps({ "unit_num": unitNum, "unit_price": unitPrice, "pricing_model": selectedModel, "application_id": app_id }).then((resp) => {
                isLicenseUpdating[index] = false
                this.setState({
                    isLicenseUpdating
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
            agent.Apps.getInstalledApps(this.state.currentPage - 1, mappedColumnName, 'desc', this.state.listFilters.appName ? this.state.listFilters.appName.value:"").then((payload) => {
                let lastPage = payload.last_page ? payload.last_page : null;
                this.setState({
                    isLoadingApps: false,
                    sortColumnName: mappedColumnName,
                    sortOrder: 'desc',
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
            let isSortable = (['Riskiness', 'Annual Cost', 'Category', 'Application', '#Users', 'Subscription'].indexOf(headerName) >=0)  
            let headerCellStyle = !isSortable ? {pointerEvents:"none"}:{pointerEvents:'auto'}
            return (
                <Table.HeaderCell key={headerName} style={headerCellStyle} sorted={this.state.sortColumnName === mappedColumnName ? (this.state.sortOrder === 'asc' ? 'ascending':'descending') : null} onClick={ isSortable ? () => this.handleColumnSort(mappedColumnName) : null}>
                {headerName === "Application" ? <Input style={{ 'width': '20rem' }} icon={this.state.listFilters.appName && this.state.listFilters.appName.value ? <Icon name='close' link onClick={(event) => this.clearFilter(event, "appName")} /> : null} placeholder="Filter by Application ..."
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
                let appInfo = rowData
                let selectedModel = rowData["pricing_model"]
                let dsImage = null
                let appId = appInfo.id
                let score = appInfo["score"]
                let scoreColor = score < 1 ? 'grey' : (score < 4 ? 'blue' : (score > 7 ? 'red' : 'yellow'))
                let appCost = null
                let appSavings = null
                let unitNum = rowData["unit_num"]
                let unitPrice = rowData["unit_price"]
                let inactive_users = rowData["inactive_users"]
                if (appInfo.datasource_id) {
                    dsImage = <Image inline size='mini' src={dsMap[appInfo.datasource_id] && dsMap[appInfo.datasource_id].logo} circular></Image>
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
                
                let catColor = appInfo && appInfo["category"] ? 'teal' : 'orange'
                return (
                    <Table.Row key={index}>
                        <Table.Cell width="1" style={{textAlign:'center'}}>{rowData['is_installed_via_ds']?<Button style={{cursor:'pointer'}} circular icon="angle right" onClick={(e) => this.onCardClicked(e, appInfo)} />: null}</Table.Cell>
                        <Table.Cell width="1"><Label color={scoreColor}></Label></Table.Cell>
                        <Table.Cell width="3" style={{maxWidth:"350px", overflow:'hidden', textOverflow:'ellipsis',whiteSpace:'no-wrap'}}>
                            <span style={{ padding: "2px"}}>{(appInfo && appInfo['publisher_url']) ? <a target="_blank" href={appInfo["publisher_url"]}>{appInfo["display_text"]}</a> : appInfo["display_text"]}</span>
                            {appInfo ? <Image inline style={{ float: "right" }} src={appInfo["image_url"]} rounded size='mini' /> : ''}
                        </Table.Cell>
                        <Table.Cell width="2">
                            <Label color={catColor} size='mini' >
                                {appInfo && appInfo["category"] ? appInfo["category"] : 'Un-categorized'}
                            </Label>
                        </Table.Cell>
                        <Table.Cell width='1'><Input transparent compact type="text" placeholder='#licenses' value={unitNum > 0 ? unitNum : null} onChange={(event, data) => this.handleRowChange(event, index, 'ENTER_UNIT_NUM')} />  </Table.Cell>
                        <Table.Cell width='3'>
                        <Input transparent compact type="text" placeholder='Price' value={unitPrice > 0 ? unitPrice : null} onChange={(event, data) => this.handleRowChange(event, index, 'ENTER_UNIT_PRICE')} label={<Dropdown width="1" basic defaultValue={selectedModel} options={modelOptions} onChange={(event, data) => this.handleRowChange(event, index, 'SELECT_PLAN_PRICING_MODEL', data)} />}
                                labelPosition='right' /></Table.Cell>
                        <Table.Cell width='1'>{unitNum && unitPrice ? <IntlProvider><FormattedNumber value={appCost} style="currency" currency="USD" /></IntlProvider> : null}</Table.Cell>
                        <Table.Cell width='1'>{inactive_users && unitPrice ? <IntlProvider><FormattedNumber value={appSavings} style="currency" currency="USD" /></IntlProvider> : null}</Table.Cell>
                        <Table.Cell width='4' style={{ 'textAlign': 'center' }}><span><Button size="mini" negative onClick={(e) => this.triggerDeleteAction(e, appId, appInfo.display_text)}>Remove</Button> <Button size="mini" positive loading={this.state.isLicenseUpdating[index]} onClick={(event) => this.saveAppLicense(event, index, unitNum, unitPrice, selectedModel, appInfo.id)} content='Update' /></span> </Table.Cell>
                    </Table.Row>
                )
            })
        }
        console.log('loading state', this.state.isLoadingApps)
        return (
            <div style={{ 'minHeight': document.body.clientHeight / 1.25, display: "block" }}>
                <div style={{ position: 'relative', height: '50px', width: '100%' }}> {exploreBtn} {this.state.totalCost ? <span style={{ float: "right", fontWeight: 600, fontSize: this.props.style.fontSize, padding: "5px", width: this.props.style.width }}>Total Annual Cost -  {<IntlProvider><FormattedNumber value={this.state.totalCost} style="currency" currency="USD" /></IntlProvider>}</span> : null}
                </div>
                <div style={{ position: 'relative', top: '10px', left: '10px', right: '10px', overflowY: 'scroll', height: '70vh' }}>
                    <Table style={{ minWidth: "1300px" }} sortable selectable striped celled compact='very'>
                        <Table.Header style={{ 'position': 'sticky', 'top': '50px', 'width': '100%' }}>
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
