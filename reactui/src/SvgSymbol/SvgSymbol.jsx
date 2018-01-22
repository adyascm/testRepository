import React, {Component} from 'react';
import sprite from '../../public/images/sprites.svg';

class SvgSymbol extends Component {
  render() {
    return (
      <svg className={this.props.additionalClassNames}>
        <use xlinkHref={`${sprite}#${this.props.name}`} />
      </svg>
    );
  }
}

export default SvgSymbol;
