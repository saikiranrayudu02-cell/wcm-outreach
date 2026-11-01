/**
 * OmniDimension AI Voice Agent Integration Client
 * Agent: WCM Prayer Meeting Confirmation Telugu (ID: 272514)
 * Platform: https://omnidim.io/api/v1
 */

export interface PhoneValidationResult {
  isValid: boolean;
  e164Number?: string;
  formattedNumber?: string;
  error?: string;
}

/**
 * Normalizes phone numbers to standard E.164 format.
 * Defaults to Indian country code (+91) if a 10-digit mobile number is provided.
 */
export function normalizePhoneNumber(rawNumber: string): PhoneValidationResult {
  if (!rawNumber || typeof rawNumber !== "string") {
    return { isValid: false, error: "Phone number is required." };
  }

  // Strip all whitespace, dashes, brackets, and periods
  let cleaned = rawNumber.trim().replace(/[\s\-\(\)\.]/g, "");

  // If already starts with +, validate length
  if (cleaned.startsWith("+")) {
    const digitsOnly = cleaned.slice(1);
    if (!/^\d{10,15}$/.test(digitsOnly)) {
      return { isValid: false, error: "Invalid international phone number format." };
    }
    return {
      isValid: true,
      e164Number: cleaned,
      formattedNumber: cleaned,
    };
  }

  // Handle Indian 0-prefixed 11-digit numbers (e.g., 09876543210 -> +919876543210)
  if (cleaned.startsWith("0") && cleaned.length === 11) {
    cleaned = cleaned.slice(1);
  }

  // Handle standard 10-digit Indian mobile number
  if (/^[6-9]\d{9}$/.test(cleaned)) {
    return {
      isValid: true,
      e164Number: `+91${cleaned}`,
      formattedNumber: `+91 ${cleaned.slice(0, 5)} ${cleaned.slice(5)}`,
    };
  }

  // Handle general digits between 10 and 15
  if (/^\d{10,15}$/.test(cleaned)) {
    // If 12 digits starting with 91, add leading plus
    if (cleaned.startsWith("91") && cleaned.length === 12) {
      return {
        isValid: true,
        e164Number: `+${cleaned}`,
        formattedNumber: `+${cleaned}`,
      };
    }
    return {
      isValid: true,
      e164Number: `+${cleaned}`,
      formattedNumber: `+${cleaned}`,
    };
  }

  return {
    isValid: false,
    error: "Invalid phone number format. Please provide a valid 10-digit mobile number.",
  };
}

export interface DispatchCallOptions {
  toNumber: string;
  convenerName: string;
  churchName: string;
  meetingDates?: string;
  expectedAttendance?: number;
  location?: string;
  verificationId: string;
  meetingReportId: string;
  callAttemptId: string;
  webhookUrl?: string;
}

export interface DispatchCallResponse {
  success: boolean;
  status: string; // "dispatched", "queued", etc.
  requestId?: number | string;
  customVariablesCount?: number;
  languagesApplied?: string[];
  error?: string;
}

/**
 * Dispatches an outbound voice call through OmniDimension
 */
export async function dispatchOmnidimCall(options: DispatchCallOptions): Promise<DispatchCallResponse> {
  const apiKey = process.env.OMNIDIM_API_KEY;
  if (!apiKey) {
    throw new Error("OMNIDIM_API_KEY environment variable is not configured.");
  }

  const agentId = Number(process.env.OMNIDIM_AGENT_ID || 272514);
  const baseUrl = (process.env.OMNIDIM_BASE_URL || "https://omnidim.io/api/v1").replace(/\/$/, "");

  const validation = normalizePhoneNumber(options.toNumber);
  if (!validation.isValid || !validation.e164Number) {
    throw new Error(validation.error || "Invalid destination phone number.");
  }

  const payload: any = {
    agent_id: agentId,
    to_number: validation.e164Number,
    call_context: {
      contact_name: options.convenerName,
      convener_name: options.convenerName,
      church_name: options.churchName,
      meeting_dates: options.meetingDates || "Upcoming Outreach",
      expected_attendance: options.expectedAttendance ? String(options.expectedAttendance) : "N/A",
      location: options.location || "N/A",
      verification_id: options.verificationId,
      ministry_name: "World Change Ministries (WCM)",
    },
    metadata: {
      call_attempt_id: options.callAttemptId,
      verification_sheet_id: options.verificationId,
      meeting_report_id: options.meetingReportId,
      dispatched_at: new Date().toISOString(),
    },
  };

  // Attach post-call webhook if available
  const webhookUrl = options.webhookUrl || 
    (process.env.NEXT_PUBLIC_APP_URL ? `${process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "")}/api/webhooks/omnidimension` : undefined);

  if (webhookUrl && webhookUrl.startsWith("http")) {
    payload.__post_call_actions = {
      type: "webhook",
      url: webhookUrl,
      include: ["summary", "extracted_variables", "fullConversation", "sentiment"],
      trigger_call_statuses: ["completed", "voicemail_detected", "failed", "no-answer", "busy", "canceled"],
    };
  }

  const response = await fetch(`${baseUrl}/calls/dispatch`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok || data.error) {
    const errorMsg = data.error_description || data.error || data.message || `Provider responded with status ${response.status}`;
    return {
      success: false,
      status: "FAILED",
      error: errorMsg,
    };
  }

  return {
    success: true,
    status: data.status || "dispatched",
    requestId: data.requestId || data.id,
    customVariablesCount: data.custom_variables_count,
    languagesApplied: data.languages_applied,
  };
}

export interface OmnidimCallLog {
  id: number;
  bot_name?: string;
  time_of_call?: string;
  from_number?: string;
  to_number?: string;
  call_direction?: string;
  call_status?: string; // completed, busy, failed, no-answer, etc.
  call_duration?: string; // "0:42"
  call_duration_in_seconds?: number;
  recording_url?: string | boolean;
  sentiment_score?: string;
  sentiment_analysis_details?: string;
  call_conversation?: string;
  extracted_variables?: Record<string, any>;
  call_request_id?: any;
}

/**
 * Retrieves a specific call log by provider ID from OmniDimension
 */
export async function getOmnidimCallLog(callLogId: number | string): Promise<OmnidimCallLog | null> {
  const apiKey = process.env.OMNIDIM_API_KEY;
  if (!apiKey) return null;

  const baseUrl = (process.env.OMNIDIM_BASE_URL || "https://omnidim.io/api/v1").replace(/\/$/, "");

  try {
    const response = await fetch(`${baseUrl}/calls/logs/${callLogId}`, {
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) return null;
    const data = await response.json();
    if (data.call_log_data && Array.isArray(data.call_log_data) && data.call_log_data.length > 0) {
      return data.call_log_data[0];
    }
    return null;
  } catch (err) {
    console.error("Error fetching OmniDimension call log:", err);
    return null;
  }
}

/**
 * Lists call logs from OmniDimension with optional status or agent filter
 */
export async function listOmnidimCallLogs(params?: {
  page?: number;
  pageSize?: number;
  agentId?: number;
  callStatus?: string;
}): Promise<{ logs: OmnidimCallLog[]; total: number }> {
  const apiKey = process.env.OMNIDIM_API_KEY;
  if (!apiKey) return { logs: [], total: 0 };

  const baseUrl = (process.env.OMNIDIM_BASE_URL || "https://omnidim.io/api/v1").replace(/\/$/, "");
  const searchParams = new URLSearchParams();

  if (params?.page) searchParams.set("pageno", String(params.page));
  if (params?.pageSize) searchParams.set("pagesize", String(params.pageSize));
  if (params?.agentId) searchParams.set("agentid", String(params.agentId));
  if (params?.callStatus) searchParams.set("call_status", params.callStatus);

  try {
    const url = `${baseUrl}/calls/logs${searchParams.toString() ? `?${searchParams.toString()}` : ""}`;
    const response = await fetch(url, {
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) return { logs: [], total: 0 };
    const data = await response.json();
    return {
      logs: data.call_log_data || [],
      total: data.total_records || 0,
    };
  } catch (err) {
    console.error("Error listing OmniDimension call logs:", err);
    return { logs: [], total: 0 };
  }
}

/**
 * Normalizes a recording URL returned from OmniDimension.
 * If OmniDimension returns a relative path like '/api/v1/recording/...',
 * resolves it with the canonical OmniDimension origin ('https://omnidim.io').
 */
export function resolveRecordingUrl(rawUrl: string | null | undefined): string | null {
  if (!rawUrl || typeof rawUrl !== "string") return null;
  const trimmed = rawUrl.trim();
  if (!trimmed) return null;

  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }

  const base = "https://omnidim.io";
  return trimmed.startsWith("/") ? `${base}${trimmed}` : `${base}/${trimmed}`;
}
