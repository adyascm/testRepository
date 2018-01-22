import React, {Component} from 'react';
import { StyleSheet, css } from 'aphrodite/no-important';
import { Link } from 'react-router';
import { colors, spaces } from '../designTokens';
import Icon from '../Icon';
import '../GlobalStyles/NavMenuGlobalStyles';
import { SET_WIDGET_REPORT as setWidgetReport } from '../PermissionsApp/actions';
import { selectors } from '../PermissionsApp/reducer';
import {connect} from 'react-redux';

const mapDispatchToProps = {
  setWidgetReport
}

const mapStateToProps = state => ({
  getWidgetReport: () => selectors.getWidgetReport(state)
});

const linkModifierStyles = {
  color: colors.linkLightHover,
  textDecoration: 'none',
};

const s = StyleSheet.create({
  nav: {
    margin: 0,
  },
  link: {
    display: 'block',
    position:'relative',
    margin: `0 0 0 ${spaces.m}`,
    color: colors.linkLight,
    cursor: 'pointer',
    padding:spaces.s,

    ':hover': {...linkModifierStyles},
    ':active': {...linkModifierStyles},
    ':focus': {...linkModifierStyles},
    ':first-child': {
      marginLeft: 0
    }
  },
  active: {
    color: colors.linkLightHover
  },
  link_isActive: {...linkModifierStyles},
  link_isInline: {
    display: 'inline-block'
  },
  link_isPrimary: {
    // fontWeight: typography.fontWeightBold,
  },
  icon: {
    // opacity: opacities.low,
  },
  iconRight: {
    marginLeft: spaces.xs
  },
  iconLeft: {
    marginRight: spaces.xs
  },
});

class Nav extends Component {
  static defaultProps = {
    isPrimary: false,
    isInline: false
  }

  render() {
    let linkEls = [];

    this.props.links.forEach((l, i) => {
      let iconRightEl;
      if (l.iconRight) {
        iconRightEl = <Icon name={l.iconRight} size='xs' isInline additionalClassNames={css(s.icon, s.iconRight)}/>
      }

      let iconLeftEl;
      if (l.iconLeft) {
        iconLeftEl = <Icon name={l.iconLeft} size='xs' isInline additionalClassNames={css(s.icon, s.iconLeft)}/>
      }

      let linkEl;
      if (l.forceExternal) {
        linkEl = (
          <a key={i}
             href={l.url}
             onClick={l.onClick}
             className={css(
              s.link,
              this.props.isInline ? s.link_isInline : null,
              this.props.isPrimary ? s.link_isPrimary : null,
              l.active ? s.link_isActive : null,
            )}>
             {iconLeftEl}
             {l.label}
             {iconRightEl}
          </a>
        );
      } else if(l.submenu) {
        linkEl = (
          <div key={i}
            //to={l.url || null}
            //onClick={l.onClick || null}
            className={"navMenu "+css(
              s.link,
              this.props.isInline ? s.link_isInline : null,
              this.props.isPrimary ? s.link_isPrimary : null,
              l.active ? s.active : null,
            )}>
            {/*{iconLeftEl}*/}
            {l.label}
            {iconRightEl}
            <div className="navSubmenu">
              {l.submenu.map((subItem, j)=> {
                if(subItem.subSubmenu) {
                  return (
                    <div className="sublist" key={j}>{subItem.text}
                      <div className="navSubSubmenu">
                        {
                          subItem.subSubmenu.map((item, k)=> {
                            return (
                              <div key={k}><a onClick={item.onClick || null} href={item.url || null}>{item.text}</a></div>
                            )
                          })
                        }
                      </div>
                    </div>
                  )
                } else {
                  if (window.location.href.includes('reports')) {
                    if (this.props.getWidgetReport() === true) {
                      this.props.setWidgetReport(false);
                    }
                  }
                  return (
                    // <a href={subItem.url || null} onClick={subItem.onClick || null} key={j}>{subItem.text}</a>
                    <Link key={j} to={subItem.url || null} onClick={subItem.onClick || null}>{subItem.text}</Link>
                  )
                }
              })}
            </div>
          </div>
        );

      } else {
        linkEl = (
          <Link key={i}
            to={l.url || null}
            onClick={l.onClick || null}
            className={css(
              s.link,
              this.props.isInline ? s.link_isInline : null,
              this.props.isPrimary ? s.link_isPrimary : null,
              l.active ? s.active : null
            )}>
            {iconLeftEl}
            {l.label}
            {iconRightEl}
          </Link>
        );
      }

      linkEls.push(linkEl);
    });

    return (
      <div className={css(s.nav)}>
        {linkEls}
      </div>
    );
  }
}

export default connect(mapStateToProps,mapDispatchToProps)(Nav);
