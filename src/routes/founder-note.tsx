import { iconTone } from "@/lib/icon-tone";
import { createFileRoute, Link } from "@tanstack/react-router";
import { withExtendedKeywords } from "@/lib/seo/extended-keywords";
import { Heart, Quote, UserRound } from "lucide-react";
import harisPhoto from "@/assets/haris-falas-coach.jpg";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/PageHeader";

const URL = "https://smartygym.com/founder-note";
const TITLE = "A Note From The Founder | Smarty Gym";
const DESCRIPTION =
  "Haris Falas explains why he created Smarty Gym and his mission to make expert, science-based fitness guidance available worldwide.";

export const Route = createFileRoute("/founder-note")({
  head: () => ({
    meta: [
      {
        name: "keywords",
        content:
          withExtendedKeywords("/founder-note", "smartygym founder note, founder letter, why smartygym, online gym, science based workouts, haris falas"),
      },
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "article" },
      { property: "og:url", content: URL },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: URL }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "WebPage",
              "@id": `${URL}#webpage`,
              url: URL,
              name: "A note from the founder",
              inLanguage: "en",
              isPartOf: { "@id": "https://smartygym.com/#website" },
              publisher: { "@id": "https://smartygym.com/#organization" },
            },
            {
              "@type": "BreadcrumbList",
              itemListElement: [
                { "@type": "ListItem", position: 1, name: "Home", item: "https://smartygym.com/" },
                { "@type": "ListItem", position: 2, name: "A note from the founder", item: URL },
              ],
            },
          ],
        }),
      },
    ],
  }),
  component: FounderNotePage,
});

function Brand({ children }: { children: React.ReactNode }) {
  return <span className="font-extrabold text-primary">{children}</span>;
}

function Paragraph({ children }: { children: React.ReactNode }) {
  return <p className="text-base leading-8 text-muted-foreground">{children}</p>;
}

function NoteCard({
  icon,
  title,
  children,
  emphasized,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
  emphasized?: boolean;
}) {
  return (
    <Card className={emphasized ? "bg-primary/5" : undefined}>
      <CardHeader className="flex-row items-center gap-3 space-y-0 pb-4">
        <span className={`shrink-0 rounded-xl p-2.5 ${iconTone(title)}`}>{icon}</span>
        <CardTitle className="text-base font-extrabold uppercase sm:text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">{children}</CardContent>
    </Card>
  );
}

function FounderNotePage() {
  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-8 sm:py-12 lg:px-8 lg:py-16">
      <div className="text-center">
        <div className="mx-auto mb-6 h-28 w-28 overflow-hidden rounded-full border-4 border-primary sm:h-36 sm:w-36">
          <img
            src={harisPhoto}
            alt="Haris Falas — founder of Smarty Gym"
            className="h-full w-full object-cover object-center"
            width={320}
            height={320}
            loading="eager"
            decoding="async"
          />
        </div>
        <PageHeader
          className="mb-0"
          eyebrow="A note from the founder"
          title={<>Haris <span className="text-primary">Falas</span></>}
          subtitle={
            <Link to="/haris-falas" className="font-semibold text-primary underline underline-offset-2">
              Read the full coach profile
            </Link>
          }
        />
      </div>

      <div className="mt-8 space-y-6">
        <NoteCard icon={<Quote size={20} />} title="Why I built this">
          <Paragraph>
            <Brand>Smarty Gym</Brand> is a powerful online gym that brings personal,
            science-based training to you wherever you are. It gives you workouts shaped around
            your goals, your level, your available time, your training environment, and the
            equipment you have.
          </Paragraph>
          <Paragraph>
            I built it because, after more than 25 years in the fitness industry, I wanted to help
            more people than could ever physically reach me. Throughout my career, I have worked
            with everyday people, children, adults, professional athletes, and people returning
            from injury. I have helped people improve their health, movement, strength,
            performance, and confidence through training that respects the individual.
          </Paragraph>
          <Paragraph>
            Everything here carries my experience, knowledge, and standards as a sports
            scientist and coach. I create the training principles behind your workouts, write the
            educational articles, build the tools, and continue developing Smarty Gym so it can
            become a complete online gym that fits anyone.
          </Paragraph>
        </NoteCard>

        <NoteCard icon={<UserRound size={20} />} title="My work and my mission">
          <Paragraph>
            I also run my own physical gym, <a href="https://hfsc.eu" target="_blank" rel="noreferrer" className="font-bold text-primary underline underline-offset-2">HFSC</a>,
            where I work directly with real people and real training challenges. That daily
            experience keeps my work practical, personal, and grounded in what people genuinely
            need.
          </Paragraph>
          <Paragraph>
            Smarty Gym belongs to the <strong className="text-foreground">Smarty family</strong>,
            together with <a href="https://smartydiet.com" target="_blank" rel="noreferrer" className="font-bold text-primary underline underline-offset-2">Smarty Diet</a>,
            created to support personalised nutrition, and <a href="https://smartymove.com" target="_blank" rel="noreferrer" className="font-bold text-primary underline underline-offset-2">Smarty Move</a>,
            created for movement analysis, movement quality, and corrective guidance. Each one
            focuses on a different part of a healthier life, while sharing the same commitment to
            expert knowledge, individual needs, and practical support.
          </Paragraph>
          <Paragraph>
            My mission is to give people everywhere the opportunity to benefit from real expertise
            and science-based training anytime, anywhere—no matter where they train or what
            equipment they have. I want to help people build healthier, stronger, and more
            fulfilling lives, and I will keep growing Smarty Gym toward that purpose.
          </Paragraph>
        </NoteCard>

        <NoteCard icon={<Heart size={20} />} title="My promise to you" emphasized>
          <Paragraph>
            I will keep applying my knowledge, experience, and care to every part of Smarty Gym.
            My promise is to keep improving it, expanding it, and building a trusted online gym
            that helps you train with purpose and confidence wherever life takes you.
          </Paragraph>
          <div className="border-t-2 border-primary/30 pt-5 text-center">
            <p className="text-sm font-semibold italic text-muted-foreground sm:text-base">Yours in good health,</p>
            <p className="mt-1 text-base font-extrabold text-foreground sm:text-lg">Haris Falas</p>
            <p className="text-sm text-muted-foreground">BSc Sports Science, EXOS Specialist, CSCS</p>
          </div>
        </NoteCard>
      </div>

      <div className="mt-10 flex flex-col items-center gap-3">
        <Button asChild size="lg" className="font-extrabold uppercase">
          <Link to="/create-your-workout">Create your workout</Link>
        </Button>
        <Link to="/haris-falas" className="text-sm font-semibold text-primary underline underline-offset-2">
          More about Haris Falas
        </Link>
      </div>
    </main>
  );
}