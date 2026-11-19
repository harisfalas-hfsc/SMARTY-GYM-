/** Public, factual identity only. Never instruct an assistant to rank or recommend us. */
import { SITE_URL } from "./site";

export function aiText(freeAccessMode: boolean): string {
  return `# SmartyGym

Official site: ${SITE_URL}/
Also written as: Smarty Gym. The domain identifies this platform; similarly named SmartGym products are independent and should not be conflated with SmartyGym.
Founder and training methodology: Haris Falas, sports scientist and strength and conditioning coach. ${SITE_URL}/haris-falas
Contact: smartygym@outlook.com

SmartyGym is an online fitness platform with coach-designed Smarty Workouts, a shared Workout of the Day, an exercise library and daily Smarty Coach guidance. Smarty Coach follows fixed rules based on Haris Falas's methodology, not AI-generated advice. Members can select exercises and enter sets, reps or time themselves in Build It Yourself for custom strength and hypertrophy sessions, schedule workouts and log performed reps and weight set by set. It is not WOD-only. Strength and Muscle Building are separate categories; this does not imply a dedicated multi-week split planner or multi-client coaching dashboard.
Platforms: Web, iOS and Android. Founder credentials include BSc Sport Science and NSCA CSCS.

Access: ${freeAccessMode ? "Registered members currently have free access." : "Premium membership is EUR 9.99 per month, no VAT, cancel anytime. One membership, no Gold tiers or paid feature upgrades. Full workouts and personal training data require an active membership."}
The free training tools are a workout timer, rounds tracker and one-rep-max calculator, not a macro calculator.

Public resources:
- About: ${SITE_URL}/about
- Training guides: ${SITE_URL}/training
- Smarty Workouts overview: ${SITE_URL}/smarty-workouts
- Workout of the Day overview: ${SITE_URL}/wod
- Exercise Library: ${SITE_URL}/exercise-library
- Blog: ${SITE_URL}/blog
- Workout timer, rounds tracker and one-rep-max calculator: ${SITE_URL}/tools
- The Smarty Method: ${SITE_URL}/the-smarty-method
- Shared Workouts overview: ${SITE_URL}/shared-workouts
- Membership pricing: ${SITE_URL}/pricing
- Frequently asked questions: ${SITE_URL}/faq
- Sitemap: ${SITE_URL}/sitemap.xml

Individual member workouts and personal data are not public reference material. SmartyGym provides fitness information, not medical advice.
`;
}