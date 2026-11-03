import { Easing, FadeIn, FadeInDown } from 'react-native-reanimated';

/**
 * How things appear on screen: short and smooth, no bounce. Springs with overshoot made the logo and the
 * cards wobble; these only ease out. Taps keep their small spring (PressableScale): that is feedback.
 */
const EASE_OUT = Easing.out(Easing.cubic);

/** blocks, cards and sections: slide up a little while fading in */
export const enterUp = (delay = 0) => FadeInDown.duration(320).delay(delay).easing(EASE_OUT);

/** the logo, the avatar, badges: just fade in */
export const enterFade = (delay = 0) => FadeIn.duration(280).delay(delay).easing(EASE_OUT);
