const BASE_URL = "https://access-cab-283394852721.us-central1.run.app";

const CALL_ENDPOINT = `${BASE_URL}/call_cab`;
const EMAIL_ENDPOINT = `${BASE_URL}/email_cab`;
const STATUS_ENDPOINT = `${BASE_URL}/status`;
const REQUEST_CALLBACK_ENDPOINT = `${BASE_URL}/request-callback`;

const createHeaders = (includeJson = false) => {
  const headers = new Headers({
    "ngrok-skip-browser-warning": "true",
  });
  if (includeJson) {
    headers.append("Content-Type", "application/json");
  }
  return headers;
};

const parseTextResponse = async (response) => {
  const text = await response.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch (error) {
    return { raw: text };
  }
};

const extractTrackingId = (payload) => {
  if (!payload) return null;
  return (
    payload.CallSid ||
    payload['thread_id'] ||
    null
  );
};

export const startCabRequest = async ({ cab, from, to }) => {
  if (!cab) {
    throw new Error("Cab details are required to initiate a request.");
  }

  const commonPayload = {
    source: from,
    destination: to,
    cab_company: cab.name,
  };

  if (cab.phone) {
    const response = await fetch(CALL_ENDPOINT, {
      method: "POST",
      headers: createHeaders(true),
      body: JSON.stringify({
        ...commonPayload,
        to: cab.phone,
      }),
      redirect: "follow",
    });

    const payload = await parseTextResponse(response);
    const trackingId = extractTrackingId(payload, cab);

    if (!trackingId) {
      throw new Error("Unable to determine tracking id for phone request");
    }

    return { trackingId, channel: "phone" };
  }

  if (cab.email) {
    const response = await fetch(EMAIL_ENDPOINT, {
      method: "POST",
      headers: createHeaders(true),
      body: JSON.stringify({
        ...commonPayload,
        to: cab.email
      }),
      redirect: "follow",
    });

    const payload = await parseTextResponse(response);
    const trackingId = extractTrackingId(payload, cab);

    if (!trackingId) {
      throw new Error("Unable to determine tracking id for email request");
    }

    return { trackingId, channel: "email" };
  }

  throw new Error("No phone number or email available for this cab.");
};

export const pollCabStatus = async ({ channel, trackingId }) => {
  if (!trackingId) {
    return null;
  }

  const queryParam = channel === "email" ? "thread_id" : "CallSid";
  const endpoint = STATUS_ENDPOINT;
  const url = `${endpoint}?${queryParam}=${encodeURIComponent(trackingId)}`;

  const response = await fetch(url, {
    method: "GET",
    redirect: "follow",
    headers: createHeaders(),
  });

  const payload = await parseTextResponse(response);

  // When parseTextResponse falls back to a raw string, return null to mirror previous behavior
  return payload && !payload.raw ? payload : null;
};

export const requestCabCallback = async ({ cab, from, to }) => {
  if (!cab) {
    throw new Error("Cab details are required to request a callback.");
  }

  const toNumber = cab.phone || null;
  const toEmail = !toNumber && cab.email ? cab.email : null;

  if (!toNumber && !toEmail) {
    throw new Error("No contact information available for callback request.");
  }

  const payload = {
    to_number: toNumber,
    to_email: toEmail,
    source: from || "Unknown Location",
    destination: to || "Unknown Destination",
    user_name: "John Doe",
    user_phone: "4356432345",
    cab_company: cab.name,
  };

  const response = await fetch(REQUEST_CALLBACK_ENDPOINT, {
    method: "POST",
    headers: createHeaders(true),
    body: JSON.stringify(payload),
    redirect: "follow",
  });

  if (!response.ok) {
    const errorPayload = await parseTextResponse(response);
    const reason = errorPayload?.error || response.statusText || "Unknown error";
    throw new Error(reason);
  }

  return parseTextResponse(response);
};
