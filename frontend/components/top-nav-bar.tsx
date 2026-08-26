import {
  View,
  ViewStyle,
} from 'react-native';
import { StatusBarSpacer } from './status-bar-spacer';
import { isMobile } from '../util/util';
import { BrandLogo } from './brand-logo';
import { useAppTheme } from '../app-theme/app-theme';

const TopNavBar = (props: {
  containerStyle?: ViewStyle,
  style?: ViewStyle,
  backgroundColor?: string,
  children?: React.ReactNode,
}) => {
  const { appTheme } = useAppTheme();

  return (
    <View
      style={{
        backgroundColor: appTheme.primaryColor,
        zIndex: 999,
        width: '100%',
        overflow: 'visible',
        ...props.containerStyle,
      }}
    >
      <StatusBarSpacer/>
      <View
        style={{
          width: '100%',
          maxWidth: 600,
          height: 40,
          alignSelf: 'center',
          alignItems: 'center',
          justifyContent: 'center',
          ...props.style,
        }}
      >
        {props.children}
      </View>
    </View>
  );
};

const DuoliciousTopNavBar = (props: {
  style?: ViewStyle,
  backgroundColor?: string,
  textColor?: string,
  children?: React.ReactNode,
}) => {
  const { style, backgroundColor, children } = props;

  if (!isMobile() && !children) {
    return <View style={{ height: 10 }} />;
  }

  return (
    <TopNavBar
      style={{
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        gap: 1,
        ...style,
      }}
      backgroundColor={backgroundColor}
    >
      {isMobile() && <>
        <BrandLogo size={40} />
        </>
      }
      {children}
    </TopNavBar>
  );
};

export {
  DuoliciousTopNavBar,
  TopNavBar,
};
