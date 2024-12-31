import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Building2, Users } from "lucide-react";

const UserTypeModal = () => {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<"vendor" | "couple" | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    const checkUserType = async () => {
      if (!user?.id) return;

      const { data, error } = await supabase
        .from("user_preferences")
        .select("is_vendor")
        .eq("id", user.id)
        .single();

      if (error) {
        console.error("Error checking user type:", error);
        return;
      }

      if (data.is_vendor === null) {
        setOpen(true);
      }
    };

    checkUserType();
  }, [user]);

  const handleSubmit = async () => {
    if (!user?.id || selected === null) {
      toast.error("Please make a selection");
      return;
    }

    try {
      const { error } = await supabase
        .from("user_preferences")
        .update({
          is_vendor: selected === "vendor",
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (error) throw error;
      setOpen(false);
    } catch (error) {
      console.error("Error updating user type:", error);
      toast.error("Failed to update preferences");
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (open === true && newOpen === false) return;
    setOpen(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-xl p-6">
        <DialogHeader className="pb-6 relative">
          <div className="absolute -top-1 left-1/2 -translate-x-1/2">
            <div className="w-12 h-1 bg-black rounded-full" />
          </div>
          <DialogTitle className="text-center">
            <div className="flex flex-col items-center space-y-3">
              <div className="text-2xl md:text-3xl font-bold">
                Welcome to AnyWeds
              </div>
              <p className="text-sm md:text-base text-muted-foreground max-w-sm">
                Let us know how you'll be using the platform
              </p>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={() => setSelected("vendor")}
            className={`relative overflow-hidden group rounded-xl border transition-all duration-300
              ${
                selected === "vendor"
                  ? "border-black bg-black text-white"
                  : "border-stone-200 hover:border-black bg-white"
              }`}
          >
            <div className="p-6 flex flex-col items-center text-center space-y-4">
              <div
                className={`rounded-full p-3 transition-colors duration-300
                ${
                  selected === "vendor"
                    ? "bg-white/10"
                    : "bg-stone-100 group-hover:bg-stone-200"
                }`}
              >
                <Building2
                  className={`h-6 w-6 transition-colors duration-300
                  ${selected === "vendor" ? "text-white" : "text-stone-600"}`}
                />
              </div>
              <div>
                <h3
                  className={`text-lg font-semibold mb-1 transition-colors duration-300
                  ${selected === "vendor" ? "text-white" : "text-stone-900"}`}
                >
                  I'm a Wedding Vendor
                </h3>
                <p
                  className={`text-sm transition-colors duration-300
                  ${
                    selected === "vendor" ? "text-stone-300" : "text-stone-600"
                  }`}
                >
                  List your services and connect with couples
                </p>
              </div>
            </div>
          </button>

          <button
            onClick={() => setSelected("couple")}
            className={`relative overflow-hidden group rounded-xl border transition-all duration-300
              ${
                selected === "couple"
                  ? "border-black bg-black text-white"
                  : "border-stone-200 hover:border-black bg-white"
              }`}
          >
            <div className="p-6 flex flex-col items-center text-center space-y-4">
              <div
                className={`rounded-full p-3 transition-colors duration-300
                ${
                  selected === "couple"
                    ? "bg-white/10"
                    : "bg-stone-100 group-hover:bg-stone-200"
                }`}
              >
                <Users
                  className={`h-6 w-6 transition-colors duration-300
                  ${selected === "couple" ? "text-white" : "text-stone-600"}`}
                />
              </div>
              <div>
                <h3
                  className={`text-lg font-semibold mb-1 transition-colors duration-300
                  ${selected === "couple" ? "text-white" : "text-stone-900"}`}
                >
                  I'm Planning a Wedding
                </h3>
                <p
                  className={`text-sm transition-colors duration-300
                  ${
                    selected === "couple" ? "text-stone-300" : "text-stone-600"
                  }`}
                >
                  Discover and book amazing venues and vendors
                </p>
              </div>
            </div>
          </button>
        </div>

        <div className="mt-6 flex justify-end">
          <Button
            onClick={handleSubmit}
            disabled={!selected}
            className="w-full h-12 text-base font-medium bg-black hover:bg-stone-800 disabled:bg-stone-300"
          >
            Continue
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UserTypeModal;
