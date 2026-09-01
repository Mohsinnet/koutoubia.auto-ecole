import { useTheme } from "@/contexts/ThemeContext";
import { Toaster as Sonner, type ToasterProps } from "sonner";

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      richColors
      closeButton
      position="top-center"
      className="toaster group"
      toastOptions={{
        style: {
          borderRadius: "14px",
          fontFamily: "inherit",
          fontSize: "14px",
          boxShadow: "0 8px 30px rgba(9, 37, 43, 0.18)",
        },
      }}
      style={
        {
          "--normal-bg": "var(--card)",
          "--normal-text": "var(--card-foreground)",
          "--normal-border": "var(--border)",
          "--success-bg": "oklch(0.96 0.03 155)",
          "--success-text": "oklch(0.32 0.06 160)",
          "--error-bg": "oklch(0.95 0.03 25)",
          "--error-text": "oklch(0.45 0.15 25)",
        } as React.CSSProperties
      }
      {...props}
    />
  );
};

export { Toaster };
