import { useState, type RefObject } from "react";
import { Copy, Facebook, Instagram, Loader2, Mail, MessageCircle, Share2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { badgeVariants } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { blogShareDetails, blogSharePayload } from "@/lib/blog-share";
import { captureWorkoutShareCard } from "@/lib/workout/social-share";

export function BlogArticleShare({ article, headerRef }: {
  article: { slug: string; title: string; excerpt: string | null };
  headerRef: RefObject<HTMLDivElement | null>;
}) {
  const [open, setOpen] = useState(false);
  const [preparing, setPreparing] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const details = blogShareDetails(article);
  const text = `${details.text}\n${details.url}`;

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(details.url);
    } catch {
      const input = document.createElement("textarea");
      input.value = details.url;
      input.setAttribute("readonly", "");
      input.style.position = "fixed";
      input.style.left = "-9999px";
      document.body.appendChild(input);
      input.select();
      const copied = document.execCommand("copy");
      input.remove();
      if (!copied) { toast.error("Could not copy the article link."); return false; }
    }
    toast.success("Article link copied.");
    return true;
  }

  async function nativeShare(picture: File | null) {
    await navigator.share(blogSharePayload(details, picture, !!picture && !!navigator.canShare?.({ files: [picture] })));
  }

  async function share() {
    if (preparing) return;
    setPreparing(true);
    let picture: File | null = null;
    try {
      if (headerRef.current) {
        try { picture = await captureWorkoutShareCard(headerRef.current, article.title); }
        catch { toast.info("The picture could not be prepared. You can still share the article link."); }
      }
      setFile(picture);
      if (typeof navigator.share === "function") {
        try { await nativeShare(picture); return; }
        catch (error) { if (error instanceof Error && error.name === "AbortError") return; }
      }
      setOpen(true);
    } finally { setPreparing(false); }
  }

  return (
    <div data-html2canvas-ignore="true">
      <Button variant="secondary" title="Share article" aria-label="Share article" disabled={preparing} onClick={share}
        className={`${badgeVariants({ variant: "secondary" })} h-auto gap-1.5 shadow-none [&_svg]:size-3.5`}>
        {preparing ? <Loader2 className="animate-spin" /> : <Share2 />} Share
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="w-[calc(100%-2rem)] max-w-md rounded-2xl border-2 border-primary p-5 sm:p-6">
          <DialogTitle>Share article</DialogTitle>
          <DialogDescription>{article.title}</DialogDescription>
          <div className="grid grid-cols-2 gap-2">
            <Button asChild variant="outline" className="h-12 justify-start rounded-xl"><a href={`https://wa.me/?text=${encodeURIComponent(text)}`} target="_blank" rel="noreferrer"><MessageCircle className="mr-2 text-primary" /> WhatsApp</a></Button>
            <Button asChild variant="outline" className="h-12 justify-start rounded-xl"><a href={`viber://forward?text=${encodeURIComponent(text)}`}><MessageCircle className="mr-2 text-primary" /> Viber</a></Button>
            <Button asChild variant="outline" className="h-12 justify-start rounded-xl"><a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(details.url)}`} target="_blank" rel="noreferrer"><Facebook className="mr-2 text-primary" /> Facebook</a></Button>
            <Button variant="outline" className="h-12 justify-start rounded-xl" onClick={async () => { if (await copyLink()) window.location.href = "instagram://app"; }}><Instagram className="mr-2 text-primary" /> Instagram</Button>
            <Button asChild variant="outline" className="h-12 justify-start rounded-xl"><a href={`mailto:?subject=${encodeURIComponent(details.title)}&body=${encodeURIComponent(text)}`}><Mail className="mr-2 text-primary" /> Email</a></Button>
            <Button asChild variant="outline" className="h-12 justify-start rounded-xl"><a href={`sms:?body=${encodeURIComponent(text)}`}><MessageCircle className="mr-2 text-primary" /> Message</a></Button>
            <Button variant="outline" className="h-12 justify-start rounded-xl" onClick={copyLink}><Copy className="mr-2 text-primary" /> Copy link</Button>
          </div>
          {typeof navigator !== "undefined" && typeof navigator.share === "function" && (
            <Button className="h-12 w-full rounded-xl" onClick={async () => {
              try { await nativeShare(file); setOpen(false); }
              catch (error) { if (!(error instanceof Error && error.name === "AbortError")) toast.error("Your browser blocked the device share menu."); }
            }}><Share2 className="mr-2" /> More apps</Button>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}