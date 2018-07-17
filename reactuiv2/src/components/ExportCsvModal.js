import React, { Component } from 'react'
import { Modal, Header, Checkbox, Button, Dimmer, Loader } from 'semantic-ui-react'

const ExportCsvModal = props =>  {

    let columnHeaderCheckboxInput = props.columnHeaders.map((columnName, index) => {
        return (
            <div>
            <Checkbox key={index} label={columnName} onChange={props.onCheckboxChange} checked={props.checkedColumns[columnName]} />
            </div>
            )
        })
    
    let dimmer = (
        <Dimmer active inverted>
            <Loader inverted content='Loading' />
        </Dimmer>
    )

    return (
        <Modal size='small' open={props.showExportModal}>
            <Modal.Header>
                Export documents as csv
            </Modal.Header>
            <Modal.Content>
            <Header> Fields to export </Header>
            <Checkbox label="Select All" onChange={props.onCheckboxChange} checked={props.selectAllColumns} />
            {columnHeaderCheckboxInput}
            <div style={{'marginTop': '10px'}}>
                <Button negative size="tiny" onClick={props.onClose}>Close</Button>
                <Button positive size="tiny" content='Submit' onClick={props.onSubmit} ></Button>
            </div>
            </Modal.Content>
            {props.isLoading ? dimmer : null}
        </Modal>
    )
}

export default ExportCsvModal;