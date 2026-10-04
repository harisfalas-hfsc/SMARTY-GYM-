import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { ParqWaiverDialog } from "@/components/ParqWaiverDialog";
import { setParqAck } from "@/lib/parq-ack";

/**
 * The one PAR-Q health-warning screen shown before any workout opens —
 * logbook, Smarty Workouts and Shared Workouts all use it.
 */
export function ParqBlockedScreen({
  flags,
  onConfirmed,
}: {
  flags: string[];
  onConfirmed: () => void;
}) {
  const [open, setOpen] = useState(true);
  return (
    <div className="mx-auto max-w-xl px-4 py-16 text-center">
      <h1 className="text-xl font-extrabold uppercase tracking-tight">Health warning</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Your PAR-Q has a YES answer. Confirm the waiver to open this workout, or update your answers
        in your Training Profile.
      </p>
      <div className="mt-4 grid gap-2">
        <Button className="h-12 rounded-2xl" onClick={() => setOpen(true)}>
          Read and confirm
        </Button>
        <Button asChild variant="secondary" className="h-12 rounded-2xl">
          <Link to="/profile">Update my PAR-Q answers</Link>
        </Button>
      </div>
      <ParqWaiverDialog
        open={open}
        flags={flags}
        confirmLabel="I confirm — open my workout"
        onConfirm={() => {
          setParqAck();
          setOpen(false);
          onConfirmed();
        }}
        onCancel={() => setOpen(false)}
      />
    </div>
  );
}
