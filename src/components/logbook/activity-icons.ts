import { BookOpen, ClipboardCheck, Heart, MessageCircle, Share2, Sparkles, Star, ThumbsUp, Trophy, type LucideIcon } from "lucide-react";
import { iconInk } from "@/lib/icon-tone";
import type { ActivityKind } from "@/lib/logbook/activity";

/** One icon per activity, reusing each feature's own icon and identity colour. */
export const ACTIVITY_ICON: Record<ActivityKind, { Icon: LucideIcon; ink: string }> = {
  completed: { Icon: Trophy, ink: iconInk("Logbook") },
  created: { Icon: Sparkles, ink: iconInk("Create Your Own Workout") },
  added: { Icon: BookOpen, ink: iconInk("Logbook") },
  shared: { Icon: Share2, ink: iconInk("Shared Workouts") },
  favorited: { Icon: Heart, ink: "text-destructive" },
  checkin: { Icon: ClipboardCheck, ink: iconInk("Smarty Check-ins") },
  comment: { Icon: MessageCircle, ink: iconInk("Smarty Community") },
  reaction: { Icon: ThumbsUp, ink: iconInk("Smarty Community") },
  rating: { Icon: Star, ink: iconInk("Smarty Community") },
};
