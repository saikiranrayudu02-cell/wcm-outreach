"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { DashboardLayout } from "@/components/dashboard-layout";
import { useUIStore } from "@/store/ui-store";
import { translate } from "@/lib/translations";
import { Save, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

interface AttendanceFormInput {
  date: string;
  location: string;
  fieldExecuter: string;
  coordinator: string;
  membersAttended: number;
  pastorsAttended: number;
  remarks: string;
}

export default function AttendancePage() {
  const { language } = useUIStore();
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AttendanceFormInput>({
    defaultValues: {
      date: new Date().toISOString().split("T")[0],
      coordinator: "",
      membersAttended: 0,
      pastorsAttended: 0,
    },
  });

  const onSubmit = async (data: AttendanceFormInput) => {
    setSaving(true);
    try {
      const payload = {
        ...data,
        membersAttended: Number(data.membersAttended),
        pastorsAttended: Number(data.pastorsAttended),
      };

      const res = await fetch("/api/reports/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await res.json();
      if (!res.ok) {
        toast.error(result.error || "Failed to save attendance");
      } else {
        toast.success("Attendance Saved Successfully");
        router.push("/coordinator/dashboard");
      }
    } catch (err) {
      toast.error("An unexpected error occurred");
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-2xl mx-auto">
        {/* Header section */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/coordinator/dashboard")}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white">
              {translate("Attendance", language)}
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
              Record attendance statistics for the outreach meeting.
            </p>
          </div>
        </div>

        {/* Form Container */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl p-4 sm:p-6 shadow-sm space-y-6">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3">
              {translate("Attendance Details", language)}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                  {translate("Date", language)} *
                </label>
                <input
                  type="date"
                  {...register("date", { required: "Date is required" })}
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-4 py-2.5 text-sm text-slate-900 dark:text-white"
                />
                {errors.date && (
                  <span className="text-red-500 text-xs mt-1 block">{errors.date.message}</span>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                  {translate("Location", language)} *
                </label>
                <input
                  type="text"
                  {...register("location", { required: "Location is required" })}
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-4 py-2.5 text-sm text-slate-900 dark:text-white"
                  placeholder="Enter location"
                />
                {errors.location && (
                  <span className="text-red-500 text-xs mt-1 block">{errors.location.message}</span>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                  {translate("Field Executer", language)} *
                </label>
                <input
                  type="text"
                  {...register("fieldExecuter", { required: "Field Executer is required" })}
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-4 py-2.5 text-sm text-slate-900 dark:text-white"
                  placeholder="Enter field executer name"
                />
                {errors.fieldExecuter && (
                  <span className="text-red-500 text-xs mt-1 block">{errors.fieldExecuter.message}</span>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                  {translate("Coordinator Name", language)} *
                </label>
                <input
                  type="text"
                  {...register("coordinator", { required: "Coordinator name is required" })}
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-4 py-2.5 text-sm text-slate-900 dark:text-white"
                  placeholder="Enter coordinator name"
                />
                {errors.coordinator && (
                  <span className="text-red-500 text-xs mt-1 block">{errors.coordinator.message}</span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                    {translate("Members Attended", language)} *
                  </label>
                  <input
                    type="number"
                    {...register("membersAttended", { 
                      required: "Members attended is required",
                      valueAsNumber: true,
                      min: { value: 0, message: "Cannot be negative" }
                    })}
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-4 py-2.5 text-sm text-slate-900 dark:text-white"
                  />
                  {errors.membersAttended && (
                    <span className="text-red-500 text-xs mt-1 block">{errors.membersAttended.message}</span>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                    {translate("Pastors Attended", language)} *
                  </label>
                  <input
                    type="number"
                    {...register("pastorsAttended", { 
                      required: "Pastors attended is required",
                      valueAsNumber: true,
                      min: { value: 0, message: "Cannot be negative" }
                    })}
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-4 py-2.5 text-sm text-slate-900 dark:text-white"
                  />
                  {errors.pastorsAttended && (
                    <span className="text-red-500 text-xs mt-1 block">{errors.pastorsAttended.message}</span>
                  )}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                {translate("Remarks", language)} *
              </label>
              <textarea
                rows={4}
                {...register("remarks", { required: "Remarks are required" })}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-4 py-2.5 text-sm text-slate-900 dark:text-white"
                placeholder="Enter remarks"
              />
              {errors.remarks && (
                <span className="text-red-500 text-xs mt-1 block">{errors.remarks.message}</span>
              )}
            </div>
          </div>

          {/* Submit Button Section */}
          <div className="flex justify-end bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl p-4 shadow-sm">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors"
            >
              <Save className="h-4 w-4" />
              {saving ? "Saving..." : translate("Save Form", language)}
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
