import { zodResolver } from "@hookform/resolvers/zod";
import { Building2, FileBadge2, LoaderCircle, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { z } from "zod";

import { FormField } from "@/components/form-field";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/providers/auth-provider";

const schema = z.object({
  firstName: z.string().min(2, "Enter the pharmacist-in-charge's first name."),
  lastName: z.string().min(2, "Enter the pharmacist-in-charge's last name."),
  email: z.email("Enter a valid account email."),
  phone: z.string().min(7, "Enter a valid phone number."),
  password: z.string().min(8, "Use at least 8 characters."),
  pharmacyName: z.string().min(2, "Enter the pharmacy name."),
  pharmacyEmail: z.email("Enter a valid business email."),
  pharmacyPhone: z.string().min(7, "Enter a valid business phone."),
  address: z.string().min(5, "Enter the full address."),
  city: z.string().min(2),
  state: z.string().min(2),
  country: z.string().min(2),
  pharmacyLicenseNumber: z.string().min(3, "Enter the pharmacy licence number."),
  pharmacyLicenseIssuedBy: z.string().min(2, "Enter the issuing authority."),
  pharmacyLicenseDocumentUrl: z.url("Enter a valid link to the pharmacy licence document."),
  pharmacistLicenseNumber: z.string().min(3, "Enter the pharmacist licence number."),
  pharmacistLicenseIssuedBy: z.string().min(2, "Enter the issuing authority."),
  pharmacistLicenseDocumentUrl: z.url("Enter a valid link to the pharmacist credential."),
});

type FormValues = z.infer<typeof schema>;

export function RegisterPharmacyPage() {
  const { registerPharmacy } = useAuth();
  const navigate = useNavigate();
  const [submitError, setSubmitError] = useState("");
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { country: "Nigeria" },
  });

  const onSubmit = handleSubmit(async (values) => {
    setSubmitError("");
    try {
      await registerPharmacy({
        firstName: values.firstName,
        lastName: values.lastName,
        email: values.email,
        phone: values.phone,
        password: values.password,
        pharmacy: {
          name: values.pharmacyName,
          email: values.pharmacyEmail,
          phone: values.pharmacyPhone,
          address: values.address,
          city: values.city,
          state: values.state,
          country: values.country,
          description: "",
          hours: "Mon-Sat, 8:00 AM-8:00 PM",
          supportsDelivery: true,
          supportsPickup: true,
          deliveryFee: 0,
        },
        pharmacyLicense: {
          licenseNumber: values.pharmacyLicenseNumber,
          issuedBy: values.pharmacyLicenseIssuedBy,
          documentUrl: values.pharmacyLicenseDocumentUrl,
        },
        pharmacistLicenseNumber: values.pharmacistLicenseNumber,
        pharmacistLicenseIssuedBy: values.pharmacistLicenseIssuedBy,
        pharmacistLicenseDocumentUrl: values.pharmacistLicenseDocumentUrl,
      });
      navigate("/pharmacy-application", { replace: true });
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Unable to submit the pharmacy application.");
    }
  });

  return (
    <section className="w-full max-w-4xl rounded-3xl border bg-card p-6 shadow-xl shadow-blue-950/5 sm:p-8">
      <div className="grid size-12 place-items-center rounded-2xl bg-secondary text-primary"><Building2 /></div>
      <h1 className="mt-5 text-3xl font-bold">Register your pharmacy</h1>
      <p className="mt-2 text-sm text-muted-foreground">Create the vendor account and submit the pharmacy and pharmacist-in-charge credentials for one review.</p>
      <form className="mt-8 space-y-8" onSubmit={onSubmit}>
        <fieldset className="space-y-5">
          <legend className="flex items-center gap-2 text-lg font-bold"><ShieldCheck className="size-5 text-primary" />Account and pharmacist-in-charge</legend>
          <div className="grid gap-5 sm:grid-cols-2">
            <FormField id="vendorFirstName" label="First name" error={errors.firstName?.message} {...register("firstName")} />
            <FormField id="vendorLastName" label="Last name" error={errors.lastName?.message} {...register("lastName")} />
            <FormField id="vendorEmail" label="Account email" type="email" error={errors.email?.message} {...register("email")} />
            <FormField id="vendorPhone" label="Account phone" type="tel" error={errors.phone?.message} {...register("phone")} />
          </div>
          <FormField id="vendorPassword" label="Password" type="password" error={errors.password?.message} {...register("password")} />
        </fieldset>

        <fieldset className="space-y-5 border-t pt-7">
          <legend className="flex items-center gap-2 text-lg font-bold"><Building2 className="size-5 text-primary" />Pharmacy details</legend>
          <div className="grid gap-5 sm:grid-cols-2">
            <FormField id="pharmacyName" label="Pharmacy name" error={errors.pharmacyName?.message} {...register("pharmacyName")} />
            <FormField id="pharmacyEmail" label="Business email" type="email" error={errors.pharmacyEmail?.message} {...register("pharmacyEmail")} />
            <FormField id="pharmacyPhone" label="Business phone" error={errors.pharmacyPhone?.message} {...register("pharmacyPhone")} />
            <FormField id="pharmacyAddress" label="Full address" error={errors.address?.message} {...register("address")} />
            <FormField id="pharmacyCity" label="City" error={errors.city?.message} {...register("city")} />
            <FormField id="pharmacyState" label="State" error={errors.state?.message} {...register("state")} />
            <FormField id="pharmacyCountry" label="Country" error={errors.country?.message} {...register("country")} />
          </div>
        </fieldset>

        <div className="grid gap-6 border-t pt-7 lg:grid-cols-2">
          <fieldset className="space-y-4 rounded-2xl bg-muted/60 p-5">
            <legend className="flex items-center gap-2 text-lg font-bold"><FileBadge2 className="size-5 text-primary" />Pharmacy licence</legend>
            <FormField id="pharmacyLicenceNumber" label="Licence number" error={errors.pharmacyLicenseNumber?.message} {...register("pharmacyLicenseNumber")} />
            <FormField id="pharmacyLicenceAuthority" label="Issued by" error={errors.pharmacyLicenseIssuedBy?.message} {...register("pharmacyLicenseIssuedBy")} />
            <FormField id="pharmacyLicenceDocument" label="Certificate/document URL" type="url" error={errors.pharmacyLicenseDocumentUrl?.message} {...register("pharmacyLicenseDocumentUrl")} />
          </fieldset>
          <fieldset className="space-y-4 rounded-2xl bg-muted/60 p-5">
            <legend className="flex items-center gap-2 text-lg font-bold"><ShieldCheck className="size-5 text-primary" />Pharmacist credentials</legend>
            <FormField id="pharmacistLicenceNumber" label="Pharmacist licence number" error={errors.pharmacistLicenseNumber?.message} {...register("pharmacistLicenseNumber")} />
            <FormField id="pharmacistLicenceAuthority" label="Issued by" error={errors.pharmacistLicenseIssuedBy?.message} {...register("pharmacistLicenseIssuedBy")} />
            <FormField id="pharmacistLicenceDocument" label="Certificate/document URL" type="url" error={errors.pharmacistLicenseDocumentUrl?.message} {...register("pharmacistLicenseDocumentUrl")} />
          </fieldset>
        </div>
        {submitError && <p className="rounded-xl bg-red-50 p-3 text-sm font-medium text-red-700">{submitError}</p>}
        <Button className="w-full" size="lg" disabled={isSubmitting}>{isSubmitting && <LoaderCircle className="animate-spin" />}Submit pharmacy for verification</Button>
      </form>
      <p className="mt-6 text-center text-sm text-muted-foreground">Already registered? <Link to="/login" className="font-semibold text-primary hover:underline">Sign in</Link></p>
    </section>
  );
}
