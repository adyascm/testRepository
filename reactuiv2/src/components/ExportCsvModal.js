import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Modal, Checkbox, Button, Dimmer, Loader, Divider } from 'semantic-ui-react'

const mapStateToProps = state => ({
});

const mapDispatchToProps = dispatch => ({
});

class ExportCsvModal extends Component {

    constructor(props) {
        super(props);

        let columnFields = []
        let columns = Object.keys(this.props.columnHeaders);
        for (let index in columns) {
            columnFields.push({ "fieldName": columns[index], "fieldKey": this.props.columnHeaders[columns[index]], "isSelected": true });
        }
        this.state = {
            isLoading: false,
            showModal: false,
            selectionUpdated: true,
            selectAllColumns: true,
            columnFields: columnFields
        }
    }
    handleAllFieldsSelection = (event, data) => {
        let selectAllColumns = !this.state.selectAllColumns
        for (let index in this.state.columnFields) {
            this.state.columnFields[index]["isSelected"] = selectAllColumns;
        }
        this.setState({
            selectAllColumns: selectAllColumns,
        })
    }
    handleFieldSelection = (event, data) => {
        let columnName = data.label
        let allSelected = true;
        for (let index in this.state.columnFields) {
            if (this.state.columnFields[index]["fieldName"] === columnName) {
                this.state.columnFields[index]["isSelected"] = !this.state.columnFields[index]["isSelected"]
            }
            if (!this.state.columnFields[index]["isSelected"]) {
                allSelected = false;
            }
        }
        this.setState({
            selectionUpdated: true,
            selectAllColumns: allSelected,
        })
    }
    onSubmitClick = () => {
        this.setState({
            isLoading: true
        })
        let selectedFields = [];
        for (let index in this.state.columnFields) {
            if (this.state.columnFields[index]["isSelected"]) {
                selectedFields.push(this.state.columnFields[index]["fieldKey"]);
            }
        }
        let filterMetadata = this.props.filterMetadata;
        filterMetadata["selectedFields"] = selectedFields
        this.props.apiFunction(filterMetadata).then(response => {
            window.location = response
            this.setState({
                isLoading: false,
                showModal: false
            })
        });
    }
    onExportClick = () => {
        this.setState({
            showModal: true,
        });
    }
    onCloseClick = () => {
        this.setState({
            showModal: false,
        });
    }
    render() {
        if (!this.state.selectionUpdated)
            return null;
        let columnHeaderCheckboxInput = this.state.columnFields.map((columnField, index) => {
            return (
                <div>
                    <Checkbox label={columnField["fieldName"]} onChange={this.handleFieldSelection} checked={columnField["isSelected"]} />
                </div>
            )
        })


        let dimmer = (
            <Dimmer active inverted>
                <Loader inverted content='Loading' />
            </Dimmer>
        )
        let exportButtonStyle = {
            'float': 'right',
            'margin-bottom': '5px'
        }
        return (
            <div>
                <Button style={exportButtonStyle} onClick={this.onExportClick} > Export </Button>
                <Modal size='small' open={this.state.showModal}>
                    <Modal.Header>
                        Export to a csv file
            </Modal.Header>
                    <Modal.Content>
                        <Checkbox label="Select all" onChange={this.handleAllFieldsSelection} checked={this.state.selectAllColumns} />
                        <Divider />
                        {columnHeaderCheckboxInput}
                        <div style={{ 'marginTop': '10px' }}>
                            <Button negative size="tiny" onClick={this.onCloseClick}>Close</Button>
                            <Button positive size="tiny" content='Submit' onClick={this.onSubmitClick} ></Button>
                        </div>
                    </Modal.Content>
                    {this.state.isLoading ? dimmer : null}
                </Modal>
            </div>
        )
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(ExportCsvModal);