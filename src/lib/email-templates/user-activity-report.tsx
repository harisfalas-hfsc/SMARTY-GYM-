import { EmailBrandFooter } from "./brand-footer";
import React from "react";
import { Body, Button, Container, Head, Heading, Hr, Html, Preview, Section, Text } from "@react-email/components";
import type { TemplateEntry } from "./registry";
import { fmtDate, KIND_LABEL, sampleReport, type ActivityReport } from "../activity/report";

const MAX_USERS = 80;
const MAX_EVENTS = 40;
const time = (iso: string) => new Date(iso).toLocaleString("en-GB", { timeZone: "Europe/Nicosia", day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });

const Email = ({ report }: { report?: ActivityReport }) => {
  const r = report ?? sampleReport();
  const period = r.fromDate === r.toDate ? fmtDate(`${r.fromDate}T12:00:00Z`) : `${fmtDate(`${r.fromDate}T12:00:00Z`)} – ${fmtDate(`${r.toDate}T12:00:00Z`)}`;
  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>{`User activity — ${r.totals.users} members, ${r.totals.events} activities`}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Text style={brand}>SMARTYGYM — USER ACTIVITY</Text>
          <Heading style={heading}>User activity · {period}</Heading>
          <Text style={text}>
            <b>{r.totals.users}</b> active member{r.totals.users === 1 ? "" : "s"} · <b>{r.totals.events}</b> activit{r.totals.events === 1 ? "y" : "ies"} · Cyprus time
          </Text>
          {r.users.length === 0 && <Text style={text}>No member activity in this period.</Text>}
          {r.users.slice(0, MAX_USERS).map((u) => (
            <Section key={u.userId} style={card}>
              <Text style={name}>{u.name}</Text>
              <Text style={meta}>
                {u.email} · {u.access} · Joined {fmtDate(u.joinedAt)}
                {u.membershipEndsAt ? ` · Membership ends ${fmtDate(u.membershipEndsAt)}` : ""}
              </Text>
              {u.events.slice(0, MAX_EVENTS).map((e, i) => (
                <Text key={i} style={row}>
                  <span style={{ color: "#6b7280" }}>{time(e.at)}</span> · <b>{KIND_LABEL[e.kind]}</b> — {e.text}
                </Text>
              ))}
              {u.events.length > MAX_EVENTS && <Text style={meta}>+ {u.events.length - MAX_EVENTS} more in the Admin panel</Text>}
            </Section>
          ))}
          {r.users.length > MAX_USERS && <Text style={meta}>+ {r.users.length - MAX_USERS} more members in the Admin panel.</Text>}
          <Section style={{ textAlign: "center", margin: "20px 0" }}>
            <Button href="https://smartygym.com/admin" style={button}>Open User activity</Button>
          </Section>
          <Hr style={{ borderColor: "#e5e7eb" }} />
          <Text style={meta}>Download the full report or choose other dates in Admin → User activity. Change the time or recipient in Admin → Cron jobs.</Text>
          <EmailBrandFooter />
        </Container>
      </Body>
    </Html>
  );
};

export const template = {
  component: Email,
  subject: (d: Record<string, any>) => {
    const r = (d["report"] as ActivityReport | undefined) ?? sampleReport();
    return `${d["test"] ? "[TEST] " : ""}User activity ${r.fromDate === r.toDate ? r.fromDate : `${r.fromDate} → ${r.toDate}`} — ${r.totals.users} members, ${r.totals.events} activities`;
  },
  displayName: "Daily user activity report",
  previewData: { report: sampleReport() },
} satisfies TemplateEntry;

const main = { backgroundColor: "#ffffff", fontFamily: "Arial, Helvetica, sans-serif" };
const container = { padding: "28px 20px", maxWidth: "640px" };
const brand = { fontSize: "12px", letterSpacing: "2px", color: "#1193c7", fontWeight: 700 as const };
const heading = { fontSize: "22px", color: "#0b1220", margin: "8px 0 8px" };
const text = { fontSize: "15px", lineHeight: "24px", color: "#1f2937" };
const card = { border: "1px solid #e5e7eb", borderLeft: "4px solid #1193c7", borderRadius: "10px", padding: "10px 14px", margin: "12px 0" };
const name = { fontSize: "16px", fontWeight: 700 as const, color: "#0b1220", margin: "0 0 2px" };
const meta = { fontSize: "12px", lineHeight: "18px", color: "#6b7280", margin: "0 0 6px" };
const row = { fontSize: "14px", lineHeight: "21px", color: "#1f2937", margin: "2px 0" };
const button = { backgroundColor: "#1193c7", color: "#ffffff", borderRadius: "8px", padding: "12px 20px", fontWeight: 700 as const, fontSize: "14px" };
