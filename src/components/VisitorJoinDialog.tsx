import { Link, useRouterState } from "@tanstack/react-router";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";

/** Dismissable announcement shown when a signed-out visitor reaches a Premium-only result. */
export function VisitorJoinDialog({
  open,
  onOpenChange,
  title = "Premium members only",
  text = "Join SmartyGym or log in to get the real result. You can keep exploring everything else.",
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  text?: string;
}) {
  const href = useRouterState({ select: (s) => s.location.href });
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="mx-auto w-[calc(100%-2.5rem)] max-w-md rounded-3xl p-6 text-center">
        <DialogTitle className="flex items-center justify-center gap-2 text-lg font-extrabold text-foreground">
          <Lock className="h-5 w-5 text-primary" /> {title}
        </DialogTitle>
        <DialogDescription className="text-sm text-muted-foreground">{text}</DialogDescription>
        <div className="mt-2 flex justify-center gap-3">
          <Button asChild>
            <Link to="/auth" search={{ next: href, mode: "signup" }}>Join now</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/auth" search={{ next: href, mode: "signin" }}>Log in</Link>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
