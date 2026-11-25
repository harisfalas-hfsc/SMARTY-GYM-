/** Invitation letter and DM, filled with the partner's own details. */
export function invitationLetter(o: { name: string; code?: string; email?: string; password?: string }) {
  const first = o.name.split(" ")[0] || o.name;
  const link = o.code ? `https://smartygym.com/?ref=${o.code}` : "";
  const subject = "Personal note from Coach Haris Falas / Lifetime business partnership proposal";
  const body = `Hi ${first},

My name is Haris Falas. I am a Sports Scientist, Strength & Conditioning Coach, and the founder of SmartyGym.

I have been following your work, and I genuinely respect what you have built. Developing an audience, earning people's trust, and maintaining that standard over the years requires a tremendous amount of discipline, consistency, and commitment.

I understand that your audience is not simply a number. It represents years of your professional effort and the trust people have placed in you.

I am building SmartyGym, a digital fitness platform featuring more than 530 professionally designed workouts, structured training, training tools, and the Smarty Logbook, which helps members monitor their training history, training load, and progress — with 100% human coaching and zero AI shortcuts.

I am not approaching you simply to ask you to promote another fitness application for a small one-time fee. I would like to explore a genuine, equal, lifetime business partnership.

Some of us have built the audience; some of us have done the other hard work of building the product. I believe the opportunity should be shared equally.

That is why I propose a lifetime 50/50 revenue share on the net subscription revenue generated through your partnership:

From our €9.99 monthly subscription (€8.40 net after 19% VAT), you receive 50% — €4.20 per member — not only for their first month, but every single month they renew and remain subscribed. For example, 300 active members means €1,260 paid to you every month.

For complete transparency, you will have your own private Partner Dashboard inside SmartyGym showing your link clicks, sign-ups, active subscribers, renewals and payout history in real time.
${o.email && o.password ? `
I have already prepared a complimentary account for you so you can see everything first-hand:
Sign in at https://smartygym.com/auth
Email: ${o.email}
Temporary password: ${o.password} (you will be asked to choose your own)
` : ""}${link ? `
Your personal partner link: ${link}
` : ""}
Most importantly: I only want to do this if you look at SmartyGym yourself and genuinely believe it brings real value to your community. I appreciate the effort you put into everything you create.

Whatever your decision, I respect what you have achieved and wish you continued success.

Best regards,

Haris Falas
Founder & Head Coach | SmartyGym
https://smartygym.com`;
  return { subject, body };
}

export function invitationDm(name: string) {
  const first = name.split(" ")[0] || name;
  return `Hi ${first}, Haris Falas here — Sports Scientist and founder of SmartyGym. Loved your work. I'd like to propose a lifetime 50/50 partnership (€4.20 every month for every member you bring, renewals included) with your own live dashboard. Could I send you the details by email?`;
}

export function mailtoLink(to: string, subject: string, body: string) {
  return `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
