import { ShieldX } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { BackButton } from "@/components/back-button";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/providers/auth-provider";

export function UnauthorizedPage() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [isReturning, setIsReturning] = useState(false);

  const returnToLogin = async () => {
    setIsReturning(true);
    try {
      await logout();
    } finally {
      navigate("/login", { replace: true });
    }
  };

  return <main className="grid min-h-screen place-items-center bg-background p-4 text-center"><section><BackButton>Back</BackButton><div className="mx-auto grid size-16 place-items-center rounded-2xl bg-red-100 text-red-700"><ShieldX /></div><h1 className="mt-5 text-3xl font-bold">Access unavailable</h1><p className="mt-2 text-muted-foreground">Your account does not have permission to open this area.</p><Button className="mt-6" disabled={isReturning} onClick={returnToLogin}>{isReturning ? "Returning to login…" : "Return to login"}</Button></section></main>;
}
