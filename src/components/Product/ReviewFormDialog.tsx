"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import ReviewForm from "./ReviewForm";

interface ReviewFormDialogProps {
  slug: string;
  /** When true, the name field is hidden (the customer is identified server-side). */
  isLoggedIn: boolean;
  /** Reveal the reward code on success — only the /myorders (verified) flow. */
  showReward?: boolean;
  /** Trigger button label (default "Arvostele tuote"). */
  triggerLabel?: string;
  /** Trigger button size (default "lg"). */
  triggerSize?: "sm" | "lg";
}

/**
 * "Arvostele tuote" button that opens the review form in a modal, so the form
 * isn't taking up space on the page when it's not needed. Radix unmounts the
 * dialog content on close, so the form state resets between opens.
 */
export default function ReviewFormDialog({
  slug,
  isLoggedIn,
  showReward = false,
  triggerLabel = "Arvostele tuote",
  triggerSize = "lg",
}: ReviewFormDialogProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size={triggerSize} className="gap-2">
          <Star className="h-4 w-4" />
          {triggerLabel}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{triggerLabel}</DialogTitle>
        </DialogHeader>
        <ReviewForm slug={slug} isLoggedIn={isLoggedIn} showReward={showReward} />
      </DialogContent>
    </Dialog>
  );
}
