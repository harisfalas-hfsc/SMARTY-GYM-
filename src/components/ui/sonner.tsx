import { Toaster as Sonner } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:rounded-2xl group-[.toaster]:border-2 group-[.toaster]:border-primary group-[.toaster]:bg-card group-[.toaster]:text-foreground group-[.toaster]:shadow-soft",
          description: "group-[.toast]:text-muted-foreground",
          actionButton: "group-[.toast]:rounded-xl group-[.toast]:bg-primary group-[.toast]:font-bold group-[.toast]:text-primary-foreground",
          cancelButton: "group-[.toast]:rounded-xl group-[.toast]:bg-secondary group-[.toast]:text-secondary-foreground",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
