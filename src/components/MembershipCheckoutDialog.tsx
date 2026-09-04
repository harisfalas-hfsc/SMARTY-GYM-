import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { PaymentTestModeBanner } from "@/components/PaymentTestModeBanner";
import { StripeEmbeddedCheckout } from "@/components/StripeEmbeddedCheckout";
import { MEMBERSHIP_PRICE_ID } from "@/lib/stripe";

/** Inline membership checkout — never rendered while Free Access Mode is ON. */
export function MembershipCheckoutDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="mx-auto max-h-[88vh] w-[calc(100%-2rem)] max-w-xl overflow-y-auto rounded-3xl p-4 sm:p-6">
        <DialogTitle className="text-base font-extrabold uppercase tracking-[0.14em] text-primary">
          Smarty Gym membership
        </DialogTitle>
        <PaymentTestModeBanner />
        {open && (
          <StripeEmbeddedCheckout
            priceId={MEMBERSHIP_PRICE_ID}
            returnUrl={
              typeof window !== "undefined"
                ? `${window.location.origin}/checkout/return?session_id={CHECKOUT_SESSION_ID}`
                : undefined
            }
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
