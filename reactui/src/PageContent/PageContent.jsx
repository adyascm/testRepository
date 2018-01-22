import React, {Component} from 'react';
import { StyleSheet, css } from 'aphrodite/no-important';
import { spaces, components } from '../designTokens';
import { BASE_RATIO } from '../designConstants';
import MenuModelContent from '../MenuModelContent';

import Columnizer from '../Columnizer';

type TPageContentProps = {
  children?: React$Element<any>[] // FIXME: make this non-optional when Flow supports JSX children.
};


const styles = StyleSheet.create({
  pageContent: {
    overflow: 'hidden',
    paddingLeft: spaces.ms,
    paddingRight: spaces.ms,
    paddingTop: spaces.ms,
    height: (() => {
      let height = 'auto';

      if (components.pageHeader.height) {
        height = `calc(85vh - ${components.pageHeader.height})`;
      }

      return height;
    })(),
  }
});

class PageContent extends Component {
  props: TPageContentProps;

  render() {
    const resourcesColumnWidth = 100 / Math.pow(BASE_RATIO, 2);
    return (
      <div className={css(styles.pageContent)}>
        <Columnizer isFullHeight={true}
                    isOneBlock={this.props.isOneBlock ? true : false}
                    hasGutter={true}
                    widthPercentages={[100 - resourcesColumnWidth, resourcesColumnWidth]}>
          {this.props.children}
        </Columnizer>
        <MenuModelContent />
      </div>
    );
  }
}

export default PageContent;
