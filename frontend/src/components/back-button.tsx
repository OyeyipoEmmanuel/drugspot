import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { Button, type ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface BackButtonProps extends Omit<ButtonProps, "asChild" | "onClick"> {
  fallback?: string;
}

export function BackButton({
  children,
  className,
  fallback = "/welcome",
  variant = "ghost",
  ...buttonProps
}: BackButtonProps) {
  const navigate = useNavigate();

  const goBack = () => {
    const historyIndex = (window.history.state as { idx?: unknown } | null)?.idx;
    if (typeof historyIndex === "number" && historyIndex > 0) {
      navigate(-1);
      return;
    }
    navigate(fallback, { replace: true });
  };

  return (
    <Button
      {...buttonProps}
      className={cn("-ml-3", className)}
      variant={variant}
      onClick={goBack}
    >
      <ArrowLeft />
      {children}
    </Button>
  );
}