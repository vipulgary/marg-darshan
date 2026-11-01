import { Icon, type IconAnimation, type IconName } from "@/components/icons";
import { cn } from "@/lib/cn";

// Named shorthands over the shared line-icon set (components/icons), kept for the section components.
type P = { className?: string; animate?: IconAnimation };

const make = (name: IconName, defaults: Omit<P, "className"> = {}) =>
  function NamedIcon({ className, animate = defaults.animate }: P) {
    return <Icon name={name} className={className} animate={animate} />;
  };

export const ArrowRightIcon = make("arrow-right");
export const CheckIcon = make("check", { animate: "draw" });
export const ChevronDownIcon = make("chevron-down");
export const VideoIcon = make("video");
export const MapPinIcon = make("map-pin");
export const ClockIcon = make("clock");
export const MailIcon = make("mail");
export const CalendarIcon = make("calendar");
export const ShieldIcon = make("shield");
export const CompassIcon = make("compass");
export const GemIcon = make("gem");
export const SunIcon = make("sun");
export const HourglassIcon = make("hourglass");
export const PlayIcon = make("play");
export const LockIcon = make("lock");
export const WhatsAppIcon = make("whatsapp");

/** Rating star: stroked outline with a soft tint so a row of stars still reads as "filled". */
export function StarIcon({ className }: { className?: string }) {
  return <Icon name="star" size={16} className={cn("fill-current/25", className)} />;
}
