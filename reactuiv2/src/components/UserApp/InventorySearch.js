import React, { Component } from 'react'
import { Search, Icon } from 'semantic-ui-react'

class InventorySearch extends Component {
    constructor(props) {
        super(props);
    }

    clearSearchResult = () => {
        this.props.handleEmptySearch()
    }

    render() {
        return (
            <Search
                aligned="right"
                onSearchChange={this.props.handleSearchChange}
                value={this.props.filterQueryValue}
                open={false}
                fluid={true}
                icon={this.props.filterQueryValue && (this.props.filterQueryValue.length > 0) ? <Icon name='close' link onClick={() => this.clearSearchResult()} /> : 'search'}
            />
        )
    }
}

export default InventorySearch