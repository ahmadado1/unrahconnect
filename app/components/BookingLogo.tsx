// Official Booking.com logo (white on blue), from our Booking.com affiliate kit on CJ.
import { Image, type ImageStyle, type StyleProp } from "react-native"

const RATIO = 480 / 191

export default function BookingLogo({ height = 24, style }: { height?: number; style?: StyleProp<ImageStyle> }) {
  return (
    <Image
      source={require("../../assets/images/booking-logo.png")}
      style={[{ height, width: height * RATIO, borderRadius: height * 0.15 }, style]}
      resizeMode="contain"
      accessibilityLabel="Booking.com"
    />
  )
}
