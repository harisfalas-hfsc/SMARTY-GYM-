import { useEffect, useState, type ReactNode } from "react";
import { AlertTriangle, Info, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

type DialogTone = "default" | "danger" | "warning";
const toneIcon = { default: Info, danger: Trash2, warning: AlertTriangle };

export function AppConfirmDialog({
  open, onOpenChange, title, description, confirmLabel, cancelLabel = "Cancel",
  tone = "default", busy = false, onConfirm, details,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel?: string;
  tone?: DialogTone;
  busy?: boolean;
  onConfirm: () => void | Promise<void>;
  details?: ReactNode;
}) {
  const Icon = toneIcon[tone];
  const danger = tone === "danger";
  return (
    <AlertDialog open={open} onOpenChange={(next) => !busy && onOpenChange(next)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className={danger ? "app-dialog-icon text-destructive" : "app-dialog-icon text-primary"}>
            <Icon className="h-5 w-5" />
          </div>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        {details}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={busy}>{cancelLabel}</AlertDialogCancel>
          <AlertDialogAction
            className={danger ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : undefined}
            disabled={busy}
            onClick={(event) => { event.preventDefault(); void onConfirm(); }}
          >
            {busy ? "Please wait…" : confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function AppInputDialog({
  open, onOpenChange, title, description, initialValue, placeholder,
  confirmLabel = "Save", minLength = 1, maxLength = 120, busy = false, onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  initialValue: string;
  placeholder?: string;
  confirmLabel?: string;
  minLength?: number;
  maxLength?: number;
  busy?: boolean;
  onConfirm: (value: string) => void | Promise<void>;
}) {
  const [value, setValue] = useState(initialValue);
  useEffect(() => { if (open) setValue(initialValue); }, [initialValue, open]);
  const normalized = value.trim().replace(/\s+/g, " ");
  const valid = normalized.length >= minLength && normalized.length <= maxLength;
  return (
    <Dialog open={open} onOpenChange={(next) => !busy && onOpenChange(next)}>
      <DialogContent>
        <DialogHeader>
          <div className="app-dialog-icon text-primary"><Pencil className="h-5 w-5" /></div>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <Input
          autoFocus value={value} maxLength={maxLength} placeholder={placeholder}
          className="h-12 rounded-2xl" onChange={(event) => setValue(event.target.value)}
          onKeyDown={(event) => { if (event.key === "Enter" && valid && !busy) void onConfirm(normalized); }}
        />
        <p className="text-right text-xs text-muted-foreground">{normalized.length} / {maxLength}</p>
        <DialogFooter>
          <Button variant="outline" className="h-12 rounded-2xl" disabled={busy} onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button className="h-12 rounded-2xl" disabled={!valid || busy} onClick={() => void onConfirm(normalized)}>
            {busy ? "Please wait…" : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}