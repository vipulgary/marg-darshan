import { Icon, type IconAnimation, type IconName } from "@/components/icons";

// Layout-shell shorthands over the shared line-icon set (components/icons).
type IconProps = { size?: number; className?: string; animate?: IconAnimation };

const make = (name: IconName) =>
  function NamedIcon({ size = 20, className, animate }: IconProps) {
    return <Icon name={name} size={size} className={className} animate={animate} />;
  };

export const IconMenu = make("menu");
export const IconClose = make("x");
export const IconChevronDown = make("chevron-down");
export const IconArrowRight = make("arrow-right");
export const IconExternal = make("external");
export const IconMapPin = make("map-pin");
export const IconClock = make("clock");
/** Sun with orbit — Jyotish. */
export const IconAstrology = make("astrology");
/** House with compass needle — Vastu. */
export const IconVastu = make("vastu");
export const IconGem = make("gem");
export const IconHourglass = make("hourglass");
export const IconSparkle = make("sparkle");
export const IconWhatsApp = make("whatsapp");
