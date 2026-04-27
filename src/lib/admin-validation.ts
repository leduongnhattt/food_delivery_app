import {
  validateAddress,
  validateEmail,
  validatePassword,
  validatePhone,
  validateUsername,
} from "@/lib/validation";

export type EnterpriseForm = {
  username: string;
  email: string;
  password: string;
  enterpriseName: string;
  phoneNumber: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
  openHours: string;
  closeHours: string;
  description?: string;
};

export type EnterpriseFormErrors = Partial<Record<keyof EnterpriseForm, string>>;

export function validateEnterpriseForm(form: EnterpriseForm): EnterpriseFormErrors {
  const e: EnterpriseFormErrors = {};
  const un = validateUsername(form.username);
  if (!un.isValid) e.username = un.errors[0] || "Username is invalid";

  const em = validateEmail(form.email);
  if (!em.isValid) e.email = em.errors[0] || "Email is invalid";

  const pw = validatePassword(form.password);
  if (!pw.isValid) e.password = pw.errors[0] || "Password is invalid";
  if (!e.password && form.password.length < 8)
    e.password = "Password must be at least 8 characters";

  if (!form.enterpriseName?.trim()) e.enterpriseName = "Enterprise name is required";

  const ph = validatePhone(form.phoneNumber);
  if (!ph.isValid) e.phoneNumber = ph.errors[0] || "Phone is invalid";

  const ad = validateAddress(form.address);
  if (!ad.isValid) e.address = ad.errors[0] || "Address is invalid";

  if (form.latitude === null || form.longitude === null) {
    e.latitude = "Please select a precise location on map";
  } else {
    if (form.latitude < -90 || form.latitude > 90) e.latitude = "Latitude is out of range";
    if (form.longitude < -180 || form.longitude > 180)
      e.longitude = "Longitude is out of range";
  }

  if (!/^\d{2}:\d{2}$/.test(form.openHours)) e.openHours = "Use HH:mm";
  if (!/^\d{2}:\d{2}$/.test(form.closeHours)) e.closeHours = "Use HH:mm";

  return e;
}

export function canProceedStep0(errors: EnterpriseFormErrors) {
  return ["username", "email", "password"].every(
    (f) => !errors[f as keyof EnterpriseForm],
  );
}

export function canProceedStep1(errors: EnterpriseFormErrors) {
  return [
    "enterpriseName",
    "phoneNumber",
    "address",
    "latitude",
    "longitude",
    "openHours",
    "closeHours",
  ].every((f) => !errors[f as keyof EnterpriseForm]);
}

export interface CategoryFormData {
  categoryName: string;
  description: string;
}

export interface CategoryFormErrors {
  categoryName?: string;
  description?: string;
}

export function validateCategoryForm(form: CategoryFormData): CategoryFormErrors {
  const errors: CategoryFormErrors = {};

  // Category name validation
  if (!form.categoryName) {
    errors.categoryName = "Category name is required";
  } else if (form.categoryName.length < 2) {
    errors.categoryName = "Category name must be at least 2 characters";
  } else if (form.categoryName.length > 50) {
    errors.categoryName = "Category name must be less than 50 characters";
  } else if (!/^[a-zA-Z0-9\s\-&]+$/.test(form.categoryName)) {
    errors.categoryName =
      "Category name can only contain letters, numbers, spaces, hyphens, and ampersands";
  }

  // Description validation (optional but if provided, should be reasonable)
  if (form.description && form.description.length > 255) {
    errors.description = "Description must be less than 255 characters";
  }

  return errors;
}

export function canProceedCategoryForm(errors: CategoryFormErrors): boolean {
  return !errors.categoryName && !errors.description;
}

