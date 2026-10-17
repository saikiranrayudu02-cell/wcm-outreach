"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { DashboardLayout } from "@/components/dashboard-layout";
import { ArrowLeft, ArrowRight, Save, CheckCircle } from "lucide-react";
import { useUIStore } from "@/store/ui-store";
import { translate } from "@/lib/translations";
import { toast } from "sonner";

interface AfterMeetingFormInput {
  // Section 5
  overallMeetingOutcome: string;
  congregationResponse: string;
  // Section 6
  continueFellowship: string; // "true" | "false" in form, boolean in DB
  futureOpportunities: string[];
  // Section 7
  localChurchInfluence: string;
  networkOfPastors: string;
  followingWcmMembersCount: number;
  // Section 8
  strengthsObserved: string;
  challengesObserved: string;
  opportunityForWcm: string;
  coordinatorName: string;
  designation: string;
  signature: string;
  submissionDate: string;
}

export default function AfterMeetingPage() {
  const { language } = useUIStore();
  const router = useRouter();
  const [step, setStep] = useState(5); // Step matches sections: Section 5 to 8
  const [saving, setSaving] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
    trigger,
  } = useForm<AfterMeetingFormInput>({
    defaultValues: {
      overallMeetingOutcome: "Excellent",
      congregationResponse: "Highly Encouraged",
      continueFellowship: "true",
      futureOpportunities: [],
      localChurchInfluence: "Medium",
      networkOfPastors: "Medium",
      followingWcmMembersCount: 0,
      submissionDate: new Date().toISOString().split("T")[0],
    },
  });

  const selectedOps = watch("futureOpportunities") || [];

  const handleOpportunityChange = (val: string, checked: boolean) => {
    if (checked) {
      setValue("futureOpportunities", [...selectedOps, val]);
    } else {
      setValue("futureOpportunities", selectedOps.filter((x) => x !== val));
    }
  };

  const nextStep = async () => {
    let fieldsToValidate: any[] = [];
    if (step === 5) {
      fieldsToValidate = ["overallMeetingOutcome", "congregationResponse"];
    } else if (step === 6) {
      fieldsToValidate = ["continueFellowship", "futureOpportunities"];
    } else if (step === 7) {
      fieldsToValidate = ["localChurchInfluence", "networkOfPastors", "followingWcmMembersCount"];
    }

    const isValid = await trigger(fieldsToValidate);
    if (isValid) {
      setStep((s) => s + 1);
    } else {
      toast.error("Please correct the errors in the form before continuing.");
    }
  };

  const prevStep = () => {
    setStep((s) => Math.max(5, s - 1));
  };

  const onSubmit = async (data: AfterMeetingFormInput) => {
    setSaving(true);
    try {
      const payload = {
        ...data,
        continueFellowship: data.continueFellowship === "true",
        followingWcmMembersCount: Number(data.followingWcmMembersCount),
      };

      const res = await fetch("/api/reports/after-meeting", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await res.json();
      if (!res.ok) {
        toast.error(result.error || "Failed to submit report");
      } else {
        toast.success("Report Submitted Successfully");
        router.push("/coordinator/dashboard");
      }
    } catch (err) {
      toast.error("An unexpected error occurred");
    } finally {
      setSaving(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLFormElement>) => {
    if (e.key === "Enter" && (e.target as HTMLElement).tagName === "INPUT") {
      e.preventDefault();
    }
  };

  const stepsList = [
    { num: 5, label: "Meeting Result" },
    { num: 6, label: "Future Ministry" },
    { num: 7, label: "Influence" },
    { num: 8, label: "Final Review" },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header section */}
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">
            After Meeting Report
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Please fill in this report after the meeting is completed.
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
        <form onSubmit={handleSubmit(onSubmit)} onKeyDown={handleKeyDown} className="space-y-6">
          {/* Step 5: Meeting Result */}
          {step === 5 && (
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl p-4 sm:p-6 shadow-sm space-y-6">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3">
                {translate("Section 5 - Meeting Result", language)}
              </h3>

              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
                    {translate("Remarks", language)}
                  </label>
                  <div className="flex gap-6">
                    {["Excellent", "Good", "Average"].map((opt) => (
                      <label key={opt} className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 font-medium">
                        <input
                          type="radio"
                          value={opt}
                          {...register("overallMeetingOutcome")}
                          className="h-4 w-4 text-sky-600"
                        />
                        {translate(opt, language)}
                      </label>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
                    Congregation Response
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {["Highly Encouraged", "Encouraged", "Neutral", "Not Interested"].map((opt) => (
                      <label key={opt} className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 font-medium">
                        <input
                          type="radio"
                          value={opt}
                          {...register("congregationResponse")}
                          className="h-4 w-4 text-sky-600"
                        />
                        {opt}
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 6: Future Ministry */}
          {step === 6 && (
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl p-4 sm:p-6 shadow-sm space-y-6">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3">
                {translate("Section 6 - Future Ministry Possibilities", language)}
              </h3>

              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
                    Are they willing to continue fellowship with WCM?
                  </label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 font-medium">
                      <input
                        type="radio"
                        value="true"
                        {...register("continueFellowship")}
                        className="h-4 w-4 text-sky-600"
                      />
                      Yes
                    </label>
                    <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 font-medium">
                      <input
                        type="radio"
                        value="false"
                        {...register("continueFellowship")}
                        className="h-4 w-4 text-sky-600"
                      />
                      No
                    </label>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
                    Future Opportunities
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      { val: "Future Meetings", label: "Future Meetings" },
                      { val: "Leadership Training", label: "Leadership Training" },
                      { val: "Literature Distribution", label: "Literature Distribution" },
                      { val: "Digital Message Promotion", label: "Digital Message Promotion" },
                    ].map((opt) => (
                      <label key={opt.val} className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 font-medium">
                        <input
                          type="checkbox"
                          checked={selectedOps.includes(opt.val)}
                          onChange={(e) => handleOpportunityChange(opt.val, e.target.checked)}
                          className="h-4 w-4 text-sky-600 rounded border-slate-300"
                        />
                        {opt.label}
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 7: Ministry Influence */}
          {step === 7 && (
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl p-4 sm:p-6 shadow-sm space-y-6">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3">
                {translate("Section 7 - Ministry Influence Assessment", language)}
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
                    Local Church Influence
                  </label>
                  <div className="flex gap-4">
                    {["Low", "Medium", "High"].map((opt) => (
                      <label key={opt} className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 font-medium">
                        <input
                          type="radio"
                          value={opt}
                          {...register("localChurchInfluence")}
                          className="h-4 w-4 text-sky-600"
                        />
                        {opt}
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
                    Network of Pastors
                  </label>
                  <div className="flex gap-4">
                    {["Low", "Medium", "High"].map((opt) => (
                      <label key={opt} className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 font-medium">
                        <input
                          type="radio"
                          value={opt}
                          {...register("networkOfPastors")}
                          className="h-4 w-4 text-sky-600"
                        />
                        {opt}
                      </label>
                    ))}
                  </div>
                </div>

                <div className="col-span-1 md:col-span-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                    {translate("How many members are following WCM Ministry?", language)} *
                  </label>
                  <input
                    type="number"
                    min={0}
                    defaultValue={0}
                    {...register("followingWcmMembersCount", { 
                      required: "This field is required", 
                      valueAsNumber: true,
                      min: { value: 0, message: "Must be a positive number" } 
                    })}
                    className="w-full max-w-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-white"
                  />
                  {errors.followingWcmMembersCount && (
                    <p className="mt-1 text-xs text-red-500 font-medium">{errors.followingWcmMembersCount.message}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Step 8: Final Review */}
          {step === 8 && (
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl p-4 sm:p-6 shadow-sm space-y-6">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3">
                {translate("Section 8 - Final Review", language)}
              </h3>

              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                    Strengths Observed *
                  </label>
                  <textarea
                    rows={3}
                    {...register("strengthsObserved", { required: "Strengths observed is required" })}
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-4 py-2.5 text-sm text-slate-900 dark:text-white"
                    placeholder="Enter strengths observed"
                  />
                  {errors.strengthsObserved && (
                    <span className="text-red-500 text-xs mt-1 block">{errors.strengthsObserved.message}</span>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                    Challenges Observed *
                  </label>
                  <textarea
                    rows={3}
                    {...register("challengesObserved", { required: "Challenges observed is required" })}
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-4 py-2.5 text-sm text-slate-900 dark:text-white"
                    placeholder="Enter challenges observed"
                  />
                  {errors.challengesObserved && (
                    <span className="text-red-500 text-xs mt-1 block">{errors.challengesObserved.message}</span>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                    Opportunity for WCM Ministry *
                  </label>
                  <textarea
                    rows={3}
                    {...register("opportunityForWcm", { required: "Opportunity is required" })}
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-4 py-2.5 text-sm text-slate-900 dark:text-white"
                    placeholder="Enter opportunities for WCM"
                  />
                  {errors.opportunityForWcm && (
                    <span className="text-red-500 text-xs mt-1 block">{errors.opportunityForWcm.message}</span>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                      Coordinator / Leader Name *
                    </label>
                    <input
                      type="text"
                      {...register("coordinatorName", { required: "Coordinator name is required" })}
                      className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-4 py-2.5 text-sm text-slate-900 dark:text-white"
                      placeholder="Enter name"
                    />
                    {errors.coordinatorName && (
                      <span className="text-red-500 text-xs mt-1 block">{errors.coordinatorName.message}</span>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                      Designation *
                    </label>
                    <input
                      type="text"
                      {...register("designation", { required: "Designation is required" })}
                      className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-4 py-2.5 text-sm text-slate-900 dark:text-white"
                      placeholder="e.g. Outreach Coordinator"
                    />
                    {errors.designation && (
                      <span className="text-red-500 text-xs mt-1 block">{errors.designation.message}</span>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                      Signature *
                    </label>
                    <input
                      type="text"
                      {...register("signature", { required: "Signature text is required" })}
                      className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-4 py-2.5 text-sm text-slate-900 dark:text-white"
                      placeholder="Enter digital signature (type name)"
                    />
                    {errors.signature && (
                      <span className="text-red-500 text-xs mt-1 block">{errors.signature.message}</span>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                      Submission Date *
                    </label>
                    <input
                      type="date"
                      {...register("submissionDate", { required: "Date is required" })}
                      className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-4 py-2.5 text-sm text-slate-900 dark:text-white"
                    />
                    {errors.submissionDate && (
                      <span className="text-red-500 text-xs mt-1 block">{errors.submissionDate.message}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex flex-wrap gap-3 justify-between items-center bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl p-3 sm:p-4 shadow-sm">
            <button
              type="button"
              onClick={prevStep}
              disabled={step === 5 || saving}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 disabled:opacity-50 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              {translate("Previous Step", language)}
            </button>

            <button
              type="button"
              onClick={step < 8 ? nextStep : handleSubmit(onSubmit)}
              disabled={saving}
              className={`inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold text-white transition-colors ${
                step < 8 ? "bg-sky-600 hover:bg-sky-700" : "bg-emerald-600 hover:bg-emerald-700"
              } disabled:opacity-50`}
            >
              {step < 8 ? (
                <>
                  {translate("Next Step", language)}
                  <ArrowRight className="h-4 w-4" />
                </>
              ) : (
                <>
                  {saving ? "Submitting..." : translate("Save Form", language)}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
