import { OctagonAlert } from "lucide-react";
import { Toaster as Sonner, ToasterProps } from "sonner";

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      className="toaster group"
      style={
        {
          "--normal-bg": "var(--secondary)",
          "--normal-text": "var(--secondary-foreground)",
          "--normal-border": "var(--primary)",
          fontFamily: "monospace",
        } as React.CSSProperties
      }
      icons={{ error: <OctagonAlert /> }}
      {...props}
    />
  );
};

export { Toaster };
