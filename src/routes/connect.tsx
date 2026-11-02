import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Check, Copy, Monitor, Plug, RefreshCw } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export const Route = createFileRoute("/connect")({
  head: () => ({
    meta: [
      { title: "Connect an AI assistant | SMARTYGYM" },
      {
        name: "description",
        content:
          "Link SMARTYGYM to an AI assistant like ChatGPT or Claude so it can search the exercise library and read your saved workouts.",
      },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: "Connect an AI assistant | SMARTYGYM" },
      {
        property: "og:description",
        content:
          "Link SMARTYGYM to an AI assistant like ChatGPT or Claude so it can search the exercise library and read your saved workouts.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ConnectPage,
});

const APP_NAME = "SMARTY GYM";
const APP_SLUG = "smarty-gym";

function StepList({ steps, start }: { steps: React.ReactNode[]; start?: number }) {
  return (
    <ol
      start={start}
      className="list-decimal space-y-2 pl-5 text-sm leading-6 text-muted-foreground"
    >
      {steps.map((step, i) => (
        <li key={i}>{step}</li>
      ))}
    </ol>
  );
}

function ConnectPage() {
  // The address is derived from the live origin so it is always correct,
  // on the preview, the published URL, or a custom domain.
  const [mcpUrl, setMcpUrl] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setMcpUrl(new URL("/mcp", window.location.origin).toString());
  }, []);

  const claudeLink = mcpUrl
    ? `https://claude.ai/customize/connectors?modal=add-custom-connector&connectorName=${encodeURIComponent(
        APP_NAME,
      )}&connectorUrl=${encodeURIComponent(mcpUrl)}`
    : "https://claude.ai/customize/connectors";

  const claudeCodeCommand = `claude mcp add --scope user --transport http ${APP_SLUG} '${mcpUrl.replace(/'/g, "'\\''")}'`;

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard unavailable; the address stays visible for manual selection.
    }
  };

  return (
    <div className="container mx-auto max-w-3xl px-4 py-10">
      <PageHeader
        eyebrow="Agent integrations"
        icon={Plug}
        title="Connect an AI assistant"
        subtitle="Link SMARTY GYM to an AI assistant like ChatGPT or Claude. Once connected, the assistant can search the exercise library and read your saved workouts while you are signed in."
      />

      <div
        role="note"
        className="mb-8 flex gap-3 rounded-lg border-2 border-primary bg-primary/10 p-4"
      >
        <Monitor className="mt-0.5 h-6 w-6 shrink-0 text-primary" />
        <div className="text-sm leading-6">
          <p className="font-semibold text-foreground">
            Use a desktop or laptop computer
          </p>
          <p className="text-muted-foreground">
            Connecting an AI assistant only works from a computer (Windows or
            Mac). It cannot be done from a mobile phone or from the ChatGPT or
            Claude phone apps — those settings do not exist there. Open your AI
            tool (ChatGPT, Claude or another) in a desktop browser, then follow
            the steps below.
          </p>
        </div>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-lg">Your SMARTY GYM address</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-3 text-sm text-muted-foreground">
            Every assistant below asks for this address. Copy it once and paste
            it when prompted.
          </p>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <code className="flex-1 break-all rounded-md border bg-muted px-3 py-2 text-sm">
              {mcpUrl || "…"}
            </code>
            <Button
              type="button"
              variant="outline"
              className="shrink-0"
              disabled={!mcpUrl}
              onClick={() => copy(mcpUrl)}
            >
              {copied ? (
                <Check className="mr-2 h-4 w-4" />
              ) : (
                <Copy className="mr-2 h-4 w-4" />
              )}
              {copied ? "Copied" : "Copy"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-lg">Connect</CardTitle>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="chatgpt">
              <AccordionTrigger>ChatGPT</AccordionTrigger>
              <AccordionContent>
                <StepList
                  steps={[
                    <>
                      On your computer, open chatgpt.com in a web browser (not
                      the phone app) and sign in.
                    </>,
                    <>
                      Open{" "}
                      <a
                        className="text-primary underline"
                        href="https://chatgpt.com/#settings/Connectors/Advanced"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        ChatGPT connector settings
                      </a>{" "}
                      and enable Developer mode (heed the risk notice shown
                      there). If Developer mode is unavailable, ask a ChatGPT
                      admin to enable it.
                    </>,
                    <>
                      Open the{" "}
                      <a
                        className="text-primary underline"
                        href="https://chatgpt.com/plugins#settings/Connectors?create-connector=true&redirectAfter=%2Fplugins"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        new connector dialog
                      </a>
                      .
                    </>,
                    <>
                      Enter <strong>{APP_NAME}</strong> as the name and paste
                      your SMARTY GYM address into the URL field.
                    </>,
                    <>
                      Review the details, check "I understand and want to
                      continue" (ChatGPT shows this warning for every custom
                      connector), then click <strong>Create</strong>.
                    </>,
                    <>
                      Enable SMARTY GYM from the chat composer, then ask ChatGPT
                      to use it.
                    </>,
                  ]}
                />
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="claude">
              <AccordionTrigger>Claude</AccordionTrigger>
              <AccordionContent>
                <StepList
                  steps={[
                    <>
                      On your computer, open claude.ai in a web browser (not
                      the phone app) and sign in.
                    </>,
                    <>
                      Open the{" "}
                      <a
                        className="text-primary underline"
                        href={claudeLink}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        custom connector dialog
                      </a>{" "}
                      — the name and address are already filled in.
                    </>,
                    <>
                      Review the details and click <strong>Add</strong>.
                    </>,
                    <>
                      If the prefilled form does not open, open Claude's
                      Connectors page, choose "Add custom connector", name it{" "}
                      <strong>{APP_NAME}</strong> and paste your SMARTY GYM
                      address.
                    </>,
                    <>
                      Enable the connector from the chat composer, then ask
                      Claude to use it.
                    </>,
                  ]}
                />
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="claude-code">
              <AccordionTrigger>Claude Code</AccordionTrigger>
              <AccordionContent>
                <StepList
                  steps={[
                    <>Run this one line in a terminal:</>,
                  ]}
                />
                <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center">
                  <code className="flex-1 break-all rounded-md border bg-muted px-3 py-2 text-xs">
                    {claudeCodeCommand}
                  </code>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="shrink-0"
                    disabled={!mcpUrl}
                    onClick={() => copy(claudeCodeCommand)}
                  >
                    <Copy className="mr-2 h-4 w-4" />
                    Copy
                  </Button>
                </div>
                <div className="mt-3">
                  <StepList
                    start={2}
                    steps={[
                      <>
                        Start Claude Code and run <code>/mcp</code> to confirm
                        SMARTY GYM is connected. Claude Code asks you to sign in
                        from that menu because SMARTY GYM protects its tools.
                      </>,
                      <>Ask Claude Code to use SMARTY GYM.</>,
                    ]}
                  />
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="other">
              <AccordionTrigger>Other MCP clients</AccordionTrigger>
              <AccordionContent>
                <StepList
                  steps={[
                    <>Open the client's MCP server or custom connector settings.</>,
                    <>Create a remote MCP server connection.</>,
                    <>
                      Name it <strong>{APP_NAME}</strong> and paste your SMARTY
                      GYM address.
                    </>,
                    <>Finish any sign-in or authorization prompts.</>,
                    <>
                      Enable the connection, then ask the assistant to use
                      SMARTY GYM.
                    </>,
                  ]}
                />
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <RefreshCw className="h-5 w-5 text-primary" />
            Refresh after the app changes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4 text-sm text-muted-foreground">
            A connected assistant remembers the tools it first saw. When
            SMARTY GYM ships changes, refresh the connection so the assistant
            picks up the latest tools.
          </p>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="refresh-chatgpt">
              <AccordionTrigger>ChatGPT</AccordionTrigger>
              <AccordionContent>
                <StepList
                  steps={[
                    <>Open ChatGPT's Plugins page and select SMARTY GYM.</>,
                    <>
                      Scroll down to "Information" and click{" "}
                      <strong>Refresh</strong>.
                    </>,
                    <>
                      ChatGPT can't update an existing connector's address — if
                      it changed, delete the connector and repeat the connect
                      steps above with the latest address.
                    </>,
                    <>Start a new chat and ask ChatGPT to use SMARTY GYM.</>,
                  ]}
                />
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="refresh-claude">
              <AccordionTrigger>Claude</AccordionTrigger>
              <AccordionContent>
                <StepList
                  steps={[
                    <>Open the Connectors page and select SMARTY GYM.</>,
                    <>Refresh or update the connector's tools.</>,
                    <>
                      Claude can't update an existing connector's address — if
                      it changed, remove the connector and repeat the connect
                      steps above with the latest address.
                    </>,
                    <>Ask Claude to use SMARTY GYM.</>,
                  ]}
                />
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="refresh-claude-code">
              <AccordionTrigger>Claude Code</AccordionTrigger>
              <AccordionContent>
                <StepList
                  steps={[
                    <>
                      Start a new Claude Code session — it loads SMARTY GYM's
                      latest tools when it connects.
                    </>,
                    <>
                      If the address changed, run{" "}
                      <code>claude mcp remove {APP_SLUG}</code>, then run the
                      install command above again with the latest address.
                    </>,
                    <>Ask Claude Code to use SMARTY GYM.</>,
                  ]}
                />
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="refresh-other">
              <AccordionTrigger>Other MCP clients</AccordionTrigger>
              <AccordionContent>
                <StepList
                  steps={[
                    <>Open the client's MCP server or connector settings.</>,
                    <>Select the SMARTY GYM connection.</>,
                    <>Refresh the tool list, reload the server, or reconnect it.</>,
                    <>
                      If the address changed, paste the latest address from
                      above.
                    </>,
                    <>
                      Start a new chat or session and ask the assistant to use
                      SMARTY GYM.
                    </>,
                  ]}
                />
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>
    </div>
  );
}
