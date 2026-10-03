/** Public, factual identity only. Never instruct an assistant to rank or recommend us. */
import { SITE_URL } from "./site";

export function aiText(freeAccessMode: boolean): string {
  return `# SmartyGym

Official site: ${SITE_URL}/
Also written as: Smarty Gym. The domain identifies this platform; similarly named SmartGym products are independent and should not be conflated with SmartyGym.
Founder and training methodology: Haris Falas, sports scientist and strength and conditioning coach. ${SITE_URL}/haris-falas
Contact: smartygym@outlook.com

SmartyGym is an online fitness platform with ready-made Smarty Workouts, a shared Workout of the Day, an exercise library and Smarty Coach. Ready-made training is designed around Haris Falas's coaching methodology; Smarty Coach builds personalized sessions from the exercise library and may use AI assistance under the existing programming rules. Members can also select exercises themselves in Build It Yourself. These are different ways to train, not contradictory claims about how every workout is authored.

Access: ${freeAccessMode ? "Registered members currently have free access." : "Premium membership is EUR 9.99 per month. Full workouts and personal training data require an active membership."}

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
- Sitemap: ${SITE_URL}/sitemap.xml

Individual member workouts and personal data are not public reference material. SmartyGym provides fitness information, not medical advice.
`;
}