import { ADMIN_MENU_TRIGGER_CLASS } from "@/components/admin/shared/admin-field-classes";
import { mergeClasses } from "@/lib/utils";

export function adminFilterMenuTriggerClass(open: boolean) {
  return mergeClasses(ADMIN_MENU_TRIGGER_CLASS, open && "ring-2 ring-inset ring-blue-500");
}

