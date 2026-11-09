"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { DashboardLayout } from "@/components/dashboard-layout";
import { useUIStore } from "@/store/ui-store";
import { translate } from "@/lib/translations";
import { 
  ArrowLeft, ArrowRight, Save, ClipboardList, CheckCircle, 
  Sun, Sunrise, Sunset, Moon, Car, Plane, Train, Bus, Navigation, Hotel, MapPin, Clock
} from "lucide-react";
import { toast } from "sonner";
import { MediaUploader } from "@/components/media-uploader";
import { MediaItemInput } from "@/lib/media-sync";
import { PersonSearchSelect, PersonValue } from "@/components/person-search-select";

interface VerificationFormInput {
  // Section 1
  convenerName: string;
  churchMinistryName: string;
  stateDistrictCity: string;
  contactNumber: string;
  meetingDates: string;
  numberOfDays: number;
  expectedAttendance: number;
  // New Logistical Fields
  meetingSession: "Morning" | "Afternoon" | "Evening";
  travelMode: "Car" | "Flight" | "Train" | "Bus" | "Other";
  travelOtherDetails?: string;
  stayLocation: string;
  // Section 2
  yearsOfMinistry: number;
  churchMembers: number;
  workersLeaders: number;
  // Section 3
  knowAboutWcm: string;
  readWcmBooks: string; // "true" | "false" in form, boolean in DB
  attendedProphetMeeting: string; // "true" | "false"
  // Section 4
  meetingHallStage: string;
  soundSystem: string;
  accommodationTeam: string;
  volunteerSupport: string;
}

export default function VerificationPage() {
  const { language } = useUIStore();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
    trigger,
  } = useForm<VerificationFormInput>({
    defaultValues: {
      numberOfDays: 1,
      expectedAttendance: 100,
      meetingSession: "Morning",
      travelMode: "Car",
      travelOtherDetails: "",
      stayLocation: "",
      yearsOfMinistry: 0,
      churchMembers: 0,
      workersLeaders: 0,
      knowAboutWcm: "YouTube Messages",
      readWcmBooks: "false",
      attendedProphetMeeting: "false",
      meetingHallStage: "Good",
      soundSystem: "Good",
      accommodationTeam: "Arranged",
      volunteerSupport: "Strong",
    },
  });

  const selectedSession = watch("meetingSession");
  const selectedTravelMode = watch("travelMode");

  const [arrangedBy, setArrangedBy] = useState<PersonValue>({
    personId: null,
    name: "",
    phoneNumber: "",
    notes: "",
  });
  const [arrangedByError, setArrangedByError] = useState("");

  const nextStep = async () => {
    // Validate fields for current step before moving forward
    let fieldsToValidate: any[] = [];
    if (step === 1) {
      if (!arrangedBy.name.trim()) {
        setArrangedByError("Person Name for Meeting Arranged By / Referred By is required");
        toast.error("Please enter who arranged or referred this meeting.");
        return;
      } else {
        setArrangedByError("");
      }

      fieldsToValidate = [
        "convenerName", "churchMinistryName", "stateDistrictCity", 
        "contactNumber", "meetingDates", "numberOfDays", "expectedAttendance",
        "meetingSession", "travelMode", "stayLocation"
      ];
      if (selectedTravelMode === "Other") {
        fieldsToValidate.push("travelOtherDetails");
      }
    } else if (step === 2) {
      fieldsToValidate = ["yearsOfMinistry", "churchMembers", "workersLeaders"];
    } else if (step === 3) {
      fieldsToValidate = ["knowAboutWcm", "readWcmBooks", "attendedProphetMeeting"];
    }

    const isValid = await trigger(fieldsToValidate);
    if (isValid) {
      setStep((s) => s + 1);
    } else {
      toast.error("Please correct the errors in the form before continuing.");
    }
  };

  const prevStep = () => {
    setStep((s) => Math.max(1, s - 1));
  };

  const [submitting, setSubmitting] = useState(false);
  const [verificationImages, setVerificationImages] = useState<MediaItemInput[]>([]);

  const saveVerification = async (data: VerificationFormInput, shouldSubmit: boolean) => {
    if (shouldSubmit && verificationImages.length < 1) {
      toast.error("Verification Images required: Please upload at least 1 image (up to 5).");
      return;
    }
    if (shouldSubmit && !arrangedBy.name.trim()) {
      setArrangedByError("Person Name for Meeting Arranged By / Referred By is required");
      toast.error("Please enter who arranged or referred this meeting.");
      setStep(1);
      return;
    }
    if (shouldSubmit) {
      setSubmitting(true);
    } else {
      setSaving(true);
    }
    try {
      const payload = {
        ...data,
        arrangedByPersonId: arrangedBy.personId || null,
        arrangedByName: arrangedBy.name.trim(),
        arrangedByPhone: arrangedBy.phoneNumber?.trim() || null,
        arrangedByNotes: arrangedBy.notes?.trim() || null,
        numberOfDays: Number(data.numberOfDays),
        expectedAttendance: Number(data.expectedAttendance),
        yearsOfMinistry: Number(data.yearsOfMinistry),
        churchMembers: Number(data.churchMembers),
        workersLeaders: Number(data.workersLeaders),
        readWcmBooks: data.readWcmBooks === "true",
        attendedProphetMeeting: data.attendedProphetMeeting === "true",
        images: verificationImages,
        submit: shouldSubmit,
      };

      const res = await fetch("/api/reports/verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await res.json();
      if (!res.ok) {
        toast.error(result.error || "Failed to save verification sheet");
      } else {
        toast.success(shouldSubmit ? "Verification Form Submitted & Forwarded to Zonal Leader" : "Verification Draft Saved Successfully");
        router.push("/coordinator/dashboard");
      }
    } catch (err) {
      toast.error("An unexpected error occurred");
    } finally {
      setSaving(false);
      setSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLFormElement>) => {
    if (e.key === "Enter" && (e.target as HTMLElement).tagName === "INPUT") {
      e.preventDefault();
    }
  };

  const stepsList = [
    { num: 1, label: "Basic Details" },
    { num: 2, label: "Ministry Background" },
    { num: 3, label: "WCM Connection" },
    { num: 4, label: "Arrangements" },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header section */}
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">
            Verification Sheet
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Please fill in this verification form before the meeting starts.
          </p>
        </div>

        {/* Progress indicator */}
        <div className="flex items-center justify-between bg-white dark:bg-slate-900 rounded-xl p-3 sm:p-4 shadow-sm border border-slate-100 dark:border-slate-800 overflow-x-auto no-scrollbar">
          {stepsList.map((s, idx) => (
            <React.Fragment key={s.num}>
              <div className="flex items-center gap-2 shrink-0">
                <div 
                  className={`h-8 w-8 rounded-full flex items-center justify-center font-semibold text-sm transition-colors ${
                    step >= s.num 
                      ? "bg-sky-600 text-white" 
                      : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                  }`}
                >
                  {step > s.num ? <CheckCircle className="h-5 w-5" /> : s.num}
                </div>
                <span className={`text-xs font-semibold ${step === s.num ? "text-sky-600 dark:text-sky-400" : "text-slate-500"}`}>
                  {s.label}
                </span>
              </div>
              {idx < stepsList.length - 1 && (
                <div className={`flex-1 h-0.5 min-w-5 mx-4 transition-colors ${step > s.num ? "bg-sky-600" : "bg-slate-200 dark:bg-slate-800"}`} />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Form Container */}
        <form onSubmit={(e) => e.preventDefault()} onKeyDown={handleKeyDown} className="space-y-6">
          {/* Step 1: Basic Details */}
          {step === 1 && (
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl p-4 sm:p-6 shadow-sm space-y-6">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3">
                {translate("Section 1 - Basic Outreach Details", language)}
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                    {translate("Convener Name", language)} *
                  </label>
                  <input
                    type="text"
                    {...register("convenerName", { required: "Convener Name is required" })}
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-4 py-2.5 text-sm text-slate-900 dark:text-white"
                    placeholder="Enter convener name"
                  />
                  {errors.convenerName && (
                    <span className="text-red-500 text-xs mt-1 block">{errors.convenerName.message}</span>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                    {translate("Church / Ministry Name", language)} *
                  </label>
                  <input
                    type="text"
                    {...register("churchMinistryName", { required: "Church/Ministry Name is required" })}
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-4 py-2.5 text-sm text-slate-900 dark:text-white"
                    placeholder="Enter church/ministry name"
                  />
                  {errors.churchMinistryName && (
                    <span className="text-red-500 text-xs mt-1 block">{errors.churchMinistryName.message}</span>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                    {translate("State / District / City", language)} *
                  </label>
                  <input
                    type="text"
                    {...register("stateDistrictCity", { required: "State/District/City is required" })}
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-4 py-2.5 text-sm text-slate-900 dark:text-white"
                    placeholder="e.g. AP, Krishna, Vijayawada"
                  />
                  {errors.stateDistrictCity && (
                    <span className="text-red-500 text-xs mt-1 block">{errors.stateDistrictCity.message}</span>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                    Contact Number *
                  </label>
                  <input
                    type="text"
                    {...register("contactNumber", { required: "Contact Number is required" })}
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-4 py-2.5 text-sm text-slate-900 dark:text-white"
                    placeholder="Enter contact number"
                  />
                  {errors.contactNumber && (
                    <span className="text-red-500 text-xs mt-1 block">{errors.contactNumber.message}</span>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                    Meeting Dates *
                  </label>
                  <input
                    type="text"
                    {...register("meetingDates", { required: "Meeting Dates is required" })}
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-4 py-2.5 text-sm text-slate-900 dark:text-white"
                    placeholder="e.g. July 12 - July 14, 2026"
                  />
                  {errors.meetingDates && (
                    <span className="text-red-500 text-xs mt-1 block">{errors.meetingDates.message}</span>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                    Number of Days *
                  </label>
                  <input
                    type="number"
                    {...register("numberOfDays", { 
                      required: "Number of Days is required",
                      valueAsNumber: true,
                      min: { value: 1, message: "Must be at least 1 day" }
                    })}
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-4 py-2.5 text-sm text-slate-900 dark:text-white"
                  />
                  {errors.numberOfDays && (
                    <span className="text-red-500 text-xs mt-1 block">{errors.numberOfDays.message}</span>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                    Expected Attendance *
                  </label>
                  <input
                    type="number"
                    {...register("expectedAttendance", { 
                      required: "Expected Attendance is required",
                      valueAsNumber: true,
                      min: { value: 1, message: "Must be at least 1 attendee" }
                    })}
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-4 py-2.5 text-sm text-slate-900 dark:text-white"
                  />
                  {errors.expectedAttendance && (
                    <span className="text-red-500 text-xs mt-1 block">{errors.expectedAttendance.message}</span>
                  )}
                </div>

                {/* Field 1: Meeting Session / Time of Day */}
                <div className="md:col-span-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                    Meeting Session / Time of Day *
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { value: "Morning", label: "Morning", icon: Sunrise, desc: "09:00 AM – 12:00 PM" },
                      { value: "Afternoon", label: "Afternoon", icon: Sun, desc: "01:00 PM – 04:00 PM" },
                      { value: "Evening", label: "Evening", icon: Moon, desc: "05:00 PM – 09:00 PM" },
                    ].map((s) => {
                      const IconComp = s.icon;
                      const isSelected = selectedSession === s.value;
                      return (
                        <button
                          key={s.value}
                          type="button"
                          onClick={() => setValue("meetingSession", s.value as any, { shouldValidate: true })}
                          className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all cursor-pointer ${
                            isSelected
                              ? "bg-indigo-50 dark:bg-indigo-950/40 border-indigo-500 text-indigo-600 dark:text-indigo-400 ring-2 ring-indigo-500/20 shadow-xs"
                              : "border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-slate-700 dark:text-slate-300 hover:bg-slate-100"
                          }`}
                        >
                          <IconComp className={`h-5 w-5 mb-1 ${isSelected ? "text-indigo-600 dark:text-indigo-400" : "text-slate-400"}`} />
                          <span className="font-bold text-xs">{s.label}</span>
                          <span className="text-[10px] text-slate-400 mt-0.5">{s.desc}</span>
                        </button>
                      );
                    })}
                  </div>
                  <input type="hidden" {...register("meetingSession", { required: "Meeting Session is required" })} />
                  {errors.meetingSession && (
                    <span className="text-red-500 text-xs mt-1 block">{errors.meetingSession.message}</span>
                  )}
                </div>

                {/* Field 2: Travel Mode */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                    Travel Mode to Location *
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                    {[
                      { value: "Car", label: "Car", icon: Car },
                      { value: "Flight", label: "Flight", icon: Plane },
                      { value: "Train", label: "Train", icon: Train },
                      { value: "Bus", label: "Bus", icon: Bus },
                      { value: "Other", label: "Other", icon: Navigation },
                    ].map((t) => {
                      const IconComp = t.icon;
                      const isSelected = selectedTravelMode === t.value;
                      return (
                        <button
                          key={t.value}
                          type="button"
                          onClick={() => setValue("travelMode", t.value as any, { shouldValidate: true })}
                          className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                            isSelected
                              ? "bg-indigo-50 dark:bg-indigo-950/40 border-indigo-500 text-indigo-600 dark:text-indigo-400 ring-2 ring-indigo-500/20 shadow-xs"
                              : "border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-slate-700 dark:text-slate-300 hover:bg-slate-100"
                          }`}
                        >
                          <IconComp className={`h-4 w-4 ${isSelected ? "text-indigo-600 dark:text-indigo-400" : "text-slate-400"}`} />
                          <span>{t.label}</span>
                        </button>
                      );
                    })}
                  </div>
                  <input type="hidden" {...register("travelMode", { required: "Travel Mode is required" })} />
                  {errors.travelMode && (
                    <span className="text-red-500 text-xs mt-1 block">{errors.travelMode.message}</span>
                  )}

                  {/* Other Travel Details text input */}
                  {selectedTravelMode === "Other" && (
                    <div className="mt-3 animate-fadeIn">
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                        Please Specify Travel Details *
                      </label>
                      <input
                        type="text"
                        {...register("travelOtherDetails", {
                          required: selectedTravelMode === "Other" ? "Please enter travel details" : false,
                        })}
                        className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-4 py-2.5 text-sm text-slate-900 dark:text-white"
                        placeholder="e.g. Hired Taxi, Bike, Ferry, etc."
                      />
                      {errors.travelOtherDetails && (
                        <span className="text-red-500 text-xs mt-1 block">{errors.travelOtherDetails.message}</span>
                      )}
                    </div>
                  )}
                </div>

                {/* Field 3: Stay Location */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                    Stay Location *
                  </label>
                  <div className="relative">
                    <Hotel className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      {...register("stayLocation", { required: "Stay Location is required" })}
                      className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 pl-10 pr-4 py-2.5 text-sm text-slate-900 dark:text-white"
                      placeholder="Enter hotel name, address or accommodation location"
                    />
                  </div>
                  {errors.stayLocation && (
                    <span className="text-red-500 text-xs mt-1 block">{errors.stayLocation.message}</span>
                  )}
                </div>

                {/* Field 4: Meeting Arranged By / Referred By (Person-Wise Tracking) */}
                <div className="md:col-span-2">
                  <PersonSearchSelect
                    value={arrangedBy}
                    onChange={setArrangedBy}
                    error={arrangedByError}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Ministry Background */}
          {step === 2 && (
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl p-4 sm:p-6 shadow-sm space-y-6">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3">
                {translate("Section 2 - Ministry Background", language)}
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                    {translate("Years of Ministry", language)} *
                  </label>
                  <input
                    type="number"
                    {...register("yearsOfMinistry", { 
                      required: "Years of Ministry is required",
                      valueAsNumber: true,
                      min: { value: 0, message: "Cannot be negative" }
                    })}
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-4 py-2.5 text-sm text-slate-900 dark:text-white"
                  />
                  {errors.yearsOfMinistry && (
                    <span className="text-red-500 text-xs mt-1 block">{errors.yearsOfMinistry.message}</span>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                    Church Members *
                  </label>
                  <input
                    type="number"
                    {...register("churchMembers", { 
                      required: "Church Members is required",
                      valueAsNumber: true,
                      min: { value: 0, message: "Cannot be negative" }
                    })}
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-4 py-2.5 text-sm text-slate-900 dark:text-white"
                  />
                  {errors.churchMembers && (
                    <span className="text-red-500 text-xs mt-1 block">{errors.churchMembers.message}</span>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                    Workers / Leaders *
                  </label>
                  <input
                    type="number"
                    {...register("workersLeaders", { 
                      required: "Workers/Leaders is required",
                      valueAsNumber: true,
                      min: { value: 0, message: "Cannot be negative" }
                    })}
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-4 py-2.5 text-sm text-slate-900 dark:text-white"
                  />
                  {errors.workersLeaders && (
                    <span className="text-red-500 text-xs mt-1 block">{errors.workersLeaders.message}</span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Connection with WCM */}
          {step === 3 && (
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl p-4 sm:p-6 shadow-sm space-y-6">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3">
                {translate("Section 3 - Connection with WCM", language)}
              </h3>

              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
                    How did you come to know about WCM?
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {["YouTube Messages", "WCM Books", "Friends / Relatives", "Church Leaders", "Social Media", "Other"].map((opt) => (
                      <label key={opt} className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 font-medium">
                        <input
                          type="radio"
                          value={opt}
                          {...register("knowAboutWcm")}
                          className="h-4 w-4 text-sky-600 focus:ring-sky-500 border-slate-300"
                        />
                        {opt}
                      </label>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
                      Have you read WCM books?
                    </label>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 font-medium">
                        <input
                          type="radio"
                          value="true"
                          {...register("readWcmBooks")}
                          className="h-4 w-4 text-sky-600"
                        />
                        Yes
                      </label>
                      <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 font-medium">
                        <input
                          type="radio"
                          value="false"
                          {...register("readWcmBooks")}
                          className="h-4 w-4 text-sky-600"
                        />
                        No
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
                      Have you previously attended Prophet Kiran Paul Garu&apos;s meeting?
                    </label>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 font-medium">
                        <input
                          type="radio"
                          value="true"
                          {...register("attendedProphetMeeting")}
                          className="h-4 w-4 text-sky-600"
                        />
                        Yes
                      </label>
                      <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 font-medium">
                        <input
                          type="radio"
                          value="false"
                          {...register("attendedProphetMeeting")}
                          className="h-4 w-4 text-sky-600"
                        />
                        No
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Meeting Arrangements */}
          {step === 4 && (
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl p-4 sm:p-6 shadow-sm space-y-6">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3">
                {translate("Section 4 - Meeting Arrangements", language)}
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
                    Meeting Hall / Stage
                  </label>
                  <div className="flex gap-4">
                    {["Good", "Average", "Poor"].map((opt) => (
                      <label key={opt} className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 font-medium">
                        <input
                          type="radio"
                          value={opt}
                          {...register("meetingHallStage")}
                          className="h-4 w-4 text-sky-600"
                        />
                        {opt}
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
                    Sound System
                  </label>
                  <div className="flex gap-4">
                    {["Good", "Average", "Poor"].map((opt) => (
                      <label key={opt} className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 font-medium">
                        <input
                          type="radio"
                          value={opt}
                          {...register("soundSystem")}
                          className="h-4 w-4 text-sky-600"
                        />
                        {opt}
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
                    Accommodation for Team
                  </label>
                  <div className="flex gap-4">
                    {["Arranged", "Not Arranged"].map((opt) => (
                      <label key={opt} className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 font-medium">
                        <input
                          type="radio"
                          value={opt}
                          {...register("accommodationTeam")}
                          className="h-4 w-4 text-sky-600"
                        />
                        {opt}
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
                    Volunteer Support
                  </label>
                  <div className="flex gap-4">
                    {["Strong", "Moderate", "Weak"].map((opt) => (
                      <label key={opt} className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 font-medium">
                        <input
                          type="radio"
                          value={opt}
                          {...register("volunteerSupport")}
                          className="h-4 w-4 text-sky-600"
                        />
                        {opt}
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              {/* Verification Images Upload Section */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                <MediaUploader
                  category="VERIFICATION_IMAGE"
                  value={verificationImages}
                  onChange={setVerificationImages}
                  title="Verification Images"
                  description="Upload a minimum of 1 image and a maximum of 5 images for meeting verification."
                  minCount={1}
                  maxCount={5}
                />
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-between items-stretch sm:items-center bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl p-3 sm:p-4 shadow-sm">
            <button
              type="button"
              onClick={prevStep}
              disabled={step === 1 || saving}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 hover:bg-slate-50 disabled:opacity-50 transition-colors min-h-11 cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4" />
              {translate("Previous Step", language)}
            </button>

            {step < 4 ? (
              <button
                type="button"
                onClick={nextStep}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 px-5 py-2.5 text-xs font-black uppercase tracking-wider text-white transition-all shadow-md active:scale-[0.97] cursor-pointer min-h-11"
              >
                {translate("Next Step", language)}
                <ArrowRight className="h-4 w-4" />
              </button>
            ) : (
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <button
                  type="button"
                  onClick={handleSubmit((d) => saveVerification(d, false))}
                  disabled={saving || submitting}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200 hover:bg-slate-50 transition-colors disabled:opacity-50 cursor-pointer shadow-xs min-h-11"
                >
                  <Save className="h-4 w-4" />
                  {saving ? "Saving..." : "Save Draft"}
                </button>
                <button
                  type="button"
                  onClick={handleSubmit((d) => saveVerification(d, true))}
                  disabled={saving || submitting}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-5 py-2.5 text-xs font-black uppercase tracking-wider text-white transition-all shadow-md active:scale-[0.97] disabled:opacity-50 cursor-pointer min-h-11"
                >
                  <CheckCircle className="h-4 w-4" />
                  {submitting ? "Submitting..." : "Submit & Forward to Zonal Leader"}
                </button>
              </div>
            )}
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
