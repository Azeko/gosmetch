import { Image, ImageStyle, StyleProp } from 'react-native';

const logo = require('../assets/gosmetch-logo-square.png');

const BrandLogo = ({
  size = 120,
  style,
}: {
  size?: number,
  style?: StyleProp<ImageStyle>,
}) => (
  <Image
    accessibilityLabel="ГосМэтч"
    resizeMode="contain"
    source={logo}
    style={[{ width: size, height: size }, style]}
  />
);

export { BrandLogo };
