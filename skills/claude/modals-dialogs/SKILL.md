---
name: modals-dialogs
description: "Radix/shadcn Dialog, confirmation dialogs, sheets for mobile, focus trapping, scroll lock, and nested dialog support."
homepage: https://yepapi.com/skills/modals-dialogs
metadata:
  tags: [modals, dialogs, sheets, drawers]
---

# Modals & Dialogs

## Rules

- Use Radix Dialog or shadcn `<Dialog>` — accessible, focus-trapped, scroll-locked by default
- Confirmation dialogs for destructive actions: "Delete this project?" with Cancel (secondary) and Delete (destructive) buttons
- Sheets/drawers for mobile: `<Sheet>` from shadcn — slides from bottom or side, better touch target than centered modals
- Focus trap: Radix handles automatically — first focusable element receives focus on open, returns on close
- Scroll lock: prevent body scroll when modal is open — Radix handles this with `<Dialog.Overlay>`
- Close triggers: Escape key, click outside overlay, explicit close button — all provided by Radix
- Controlled state: `open` + `onOpenChange` props — don't rely on internal state for modals triggered by external events
- Forms in dialogs: submit on Enter, close on success, show errors inline — don't close on validation failure
- Mobile: use `<Sheet>` (bottom drawer) instead of centered `<Dialog>` for actions on small screens

## Patterns

```tsx
// Confirmation dialog with shadcn
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader,
  AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

function DeleteButton({ onDelete }: { onDelete: () => Promise<void> }) {
  const [loading, setLoading] = useState(false);
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive">Delete project</Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete this project?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete the project and all its data. This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={async () => { setLoading(true); await onDelete(); setLoading(false); }}
            disabled={loading}
          >
            {loading ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// Sheet for mobile-friendly actions
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

function MobileMenu() {
  return (
    <Sheet>
      <SheetTrigger asChild><Button variant="ghost" size="icon"><MenuIcon /></Button></SheetTrigger>
      <SheetContent side="bottom">
        <SheetHeader><SheetTitle>Actions</SheetTitle></SheetHeader>
        <nav className="flex flex-col gap-2 py-4">
          <Button variant="ghost">Edit</Button>
          <Button variant="ghost">Share</Button>
          <Button variant="destructive">Delete</Button>
        </nav>
      </SheetContent>
    </Sheet>
  );
}
```

## Avoid

- Building custom modals with `position: fixed` and manual focus management — use Radix/shadcn Dialog
- Missing Escape key and click-outside-to-close — Radix handles both, don't override them
- Centered modals on mobile for action menus — use bottom Sheet/Drawer for better thumb reach
- Closing dialog on form validation failure — keep open, show inline errors, let user fix and resubmit
- Nested dialogs without proper stacking context — if needed, use Radix's nested Dialog support with proper `z-index`
