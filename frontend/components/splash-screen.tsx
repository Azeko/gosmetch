import { useState, useEffect, useRef } from 'react';
import { Animated } from 'react-native';
import { BrandLogo } from './brand-logo';
import { BRAND_BLUE } from '../brand/brand';

const SplashScreen = ({ loading }: { loading: boolean }) => {
  const [isFaded, setIsFaded] = useState(false);
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!loading) {
      Animated.timing(opacity, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }).start(() => setIsFaded(true));
    }
  }, [loading]);

  if (isFaded) {
    return null;
  } else {
    return (
      <Animated.View
        style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          left: 0,
          right: 0,
          alignItems: 'center',
          flexDirection: 'column',
          justifyContent: 'space-around',
          backgroundColor: BRAND_BLUE,
          opacity: opacity,
          zIndex: 999,
        }}
      >
        <BrandLogo size={180} />
      </Animated.View>
    );
  }
};

export { SplashScreen };
