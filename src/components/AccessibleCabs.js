import React, { useState, useRef, useEffect } from "react";
import { Bot, Phone, Mail } from "lucide-react";
import { ACCESSIBLE_CAB_COMPANIES } from "../utils/constants";
import {
  startCabRequest,
  pollCabStatus,
  requestCabCallback,
} from "../utils/cabService";

export const AccessibleCabs = ({ setAnnouncement, from, to }) => {
  const [botStatus, setBotStatus] = useState("idle"); // idle, loading, complete
  const [botResults, setBotResults] = useState([]);
  const pollingRefs = useRef({}); // store interval ids per cab

  // conversation completion logic provided by the user
  const conversationComplete = (state) => {
    if (state?.correct_dispatcher === false) return true;
    if (state?.taxi_available === false) return true;

    return (
      state?.correct_dispatcher === true &&
      state?.taxi_available === true &&
      state?.earliest_pickup_time != null &&
      state?.estimated_fare != null
    );
  };

  const formatEta = (etaString) => {
    if (!etaString) return null;
    const etaDate = new Date(etaString);
    if (Number.isNaN(etaDate.getTime())) return etaString;

    const diffMs = etaDate.getTime() - Date.now();
    if (diffMs <= 0) return "Now";

    const minutes = Math.round(diffMs / 60000);
    if (minutes < 60) {
      const value = Math.max(1, minutes);
      return `${value} min${value === 1 ? "" : "s"}`;
    }

    const hours = Math.round(diffMs / 3600000);
    if (hours < 24) {
      return `${hours} hour${hours === 1 ? "" : "s"}`;
    }

    const days = Math.round(diffMs / 86400000);
    return `${days} day${days === 1 ? "" : "s"}`;
  };

  useEffect(() => {
    // cleanup intervals on unmount
    return () => {
      Object.values(pollingRefs.current).forEach((id) => {
        if (id) clearInterval(id);
      });
      pollingRefs.current = {};
    };
  }, []);

  const startPollingForCab = async (cab) => {
    try {
      const { trackingId, channel } = await startCabRequest({
        cab,
        from,
        to,
      });

      setBotResults((prev) =>
        prev.map((p) =>
          p.id === cab.id
            ? { ...p, status: "polling", callSid: trackingId, channel }
            : p
        )
      );

      const poll = async () => {
        try {
          console.log(
            "AccessibleCabs: polling status for",
            cab.name,
            "callSid=",
            trackingId
          );
          const statusJson = await pollCabStatus({
            channel,
            trackingId,
          });
          console.log("AccessibleCabs: status response", statusJson);

          if (!statusJson) {
            // If we can't parse, mark unreachable and stop
            setBotResults((prev) =>
              prev.map((p) =>
                p.id === cab.id
                  ? { ...p, status: "complete", unreachable: true }
                  : p
              )
            );
            clearInterval(pollingRefs.current[cab.id]);
            delete pollingRefs.current[cab.id];
            return;
          }

          if (conversationComplete(statusJson)) {
            if (statusJson.correct_dispatcher === false) {
              setBotResults((prev) =>
                prev.map((p) =>
                  p.id === cab.id
                    ? { ...p, status: "complete", unreachable: true }
                    : p
                )
              );
            } else if (statusJson.taxi_available === false) {
              setBotResults((prev) =>
                prev.map((p) =>
                  p.id === cab.id
                    ? { ...p, status: "complete", unavailable: true }
                    : p
                )
              );
            } else {
              // usable result
              setBotResults((prev) =>
                prev.map((p) =>
                  p.id === cab.id
                    ? {
                        ...p,
                        status: "complete",
                        price: `$${Number(statusJson.estimated_fare).toFixed(
                          2
                        )}`,
                        eta: formatEta(statusJson.earliest_pickup_time),
                      }
                    : p
                )
              );
            }

            clearInterval(pollingRefs.current[cab.id]);
            delete pollingRefs.current[cab.id];
          } else {
            setBotResults((prev) =>
              prev.map((p) =>
                p.id === cab.id ? { ...p, status: "polling" } : p
              )
            );
          }
        } catch (err) {
          setBotResults((prev) =>
            prev.map((p) =>
              p.id === cab.id
                ? { ...p, status: "complete", unreachable: true }
                : p
            )
          );
          clearInterval(pollingRefs.current[cab.id]);
          delete pollingRefs.current[cab.id];
        }
      };

      // run first poll immediately then every 5s
      await poll();
      if (!pollingRefs.current[cab.id]) {
        pollingRefs.current[cab.id] = setInterval(poll, 5000);
      }
    } catch (error) {
      // failed to start call
      setBotResults((prev) =>
        prev.map((p) =>
          p.id === cab.id ? { ...p, status: "complete", unreachable: true } : p
        )
      );
    }
  };

  const handleBotRequest = async () => {
    setBotStatus("loading");
    setAnnouncement(
      "AccessiBot is contacting companies for pricing and availability..."
    );

    // initialize botResults with pending state
    const initial = ACCESSIBLE_CAB_COMPANIES.map((cab) => ({
      ...cab,
      price: null,
      eta: null,
      status: "pending", // pending, polling, complete
      unavailable: false,
      unreachable: false,
      callSid: null,
      channel: null,
      requestingCallback: false,
    }));

    setBotResults(initial);

    await Promise.all(initial.map((cab) => startPollingForCab(cab)));

    const waitForAllComplete = () =>
      new Promise((resolve) => {
        const check = () => {
          const allDone =
            botResults.length > 0 &&
            botResults.every((r) => r.status === "complete");
          if (allDone) return resolve();
          setTimeout(check, 500);
        };
        check();
      });

    const timeout = 30000; // 30s max wait after starting polling
    await Promise.race([
      waitForAllComplete(),
      new Promise((res) => setTimeout(res, timeout)),
    ]);

    setBotStatus("complete");
    setAnnouncement("AccessiBot has found your options.");
  };

  const updateCabById = (cabId, updater) => {
    setBotResults((prev) =>
      prev.map((entry) => (entry.id === cabId ? updater(entry) : entry))
    );
  };

  const handleCallbackRequest = async (cab) => {
    if (!cab) return;

    updateCabById(cab.id, (entry) => ({ ...entry, requestingCallback: true }));
    setAnnouncement(`Requesting a callback from ${cab.name}...`);

    try {
      await requestCabCallback({ cab, from, to });
      setAnnouncement(`Callback requested from ${cab.name}. They will contact you soon.`);
    } catch (error) {
      setAnnouncement(
        `Callback request to ${cab.name} failed: ${error.message || "Unknown error"}.`
      );
    } finally {
      updateCabById(cab.id, (entry) => ({ ...entry, requestingCallback: false }));
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-md">
      <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">
        Local Accessible Cabs
      </h3>

      {botStatus === "idle" && (
        <>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Let our bot call local companies to find the best price and
            availability for you.
          </p>
          <button
            onClick={handleBotRequest}
            className="w-full text-lg font-bold p-3 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 flex items-center justify-center gap-2"
          >
            <Bot size={20} /> Request Prices via Bot
          </button>
        </>
      )}

      {botStatus === "loading" && (
        <div className="text-center p-4">
          <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-gray-600 dark:text-gray-400">
            AccessiBot is contacting companies...
          </p>
        </div>
      )}

      {botStatus === "complete" && (
        <div className="space-y-3">
          {botResults.map((cab) => {
            const contactDisabled =
              cab.unavailable ||
              cab.unreachable ||
              (!cab.phone && !cab.email);
            const hasPhone = Boolean(cab.phone);
            const hasEmail = !hasPhone && Boolean(cab.email);
            const contactHref = hasPhone
              ? `tel:${cab.phone}`
              : hasEmail
              ? `mailto:${cab.email}`
              : undefined;
            const contactLabel = hasPhone
              ? `Call ${cab.name}`
              : hasEmail
              ? `Email ${cab.name}`
              : `Contact ${cab.name}`;
            const ContactIcon = hasPhone ? Phone : Mail;

            return (
              <div
                key={cab.id}
                className="flex flex-wrap justify-between items-center bg-gray-50 dark:bg-gray-700 p-3 rounded-lg"
              >
              <div className="mb-2 w-full sm:w-auto sm:mb-0">
                <span className="font-bold text-gray-800 dark:text-gray-200">
                  {cab.name}
                </span>
                {cab.status !== "complete" && (
                  <p className="text-sm text-yellow-600 dark:text-yellow-400 font-semibold">
                    Checking availability…
                  </p>
                )}

                {cab.unreachable && (
                  <p className="text-sm text-red-600 dark:text-red-400 font-semibold">
                    Unreachable (could not contact dispatcher)
                  </p>
                )}

                {cab.unavailable && (
                  <p className="text-sm text-gray-600 dark:text-gray-300 font-semibold">
                    Unavailable
                  </p>
                )}

                {cab.status === "complete" &&
                  !cab.unavailable &&
                  !cab.unreachable &&
                  cab.price &&
                  cab.eta && (
                    <p className="text-sm text-green-600 dark:text-green-400 font-semibold">
                      {cab.price}{" "}
                      <span className="text-gray-500 dark:text-gray-400 font-normal">
                        ({cab.eta} ETA)
                      </span>
                    </p>
                  )}
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                <button
                  onClick={() =>
                    setAnnouncement(`Simulating booking with ${cab.name}.`)
                  }
                  disabled={
                    cab.unavailable ||
                    cab.unreachable ||
                    cab.status !== "complete"
                  }
                  className={`flex-1 text-sm font-bold rounded-lg px-3 py-2 ${
                    cab.unavailable ||
                    cab.unreachable ||
                    cab.status !== "complete"
                      ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                      : "text-white bg-blue-600 hover:bg-blue-700"
                  }`}
                >
                  Select
                </button>
                  {contactHref ? (
                    <a
                      href={contactHref}
                      className={`p-2 rounded-lg ${
                        contactDisabled
                          ? "bg-gray-300 pointer-events-none"
                          : "bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500"
                      }`}
                      aria-label={contactLabel}
                    >
                      <ContactIcon size={18} />
                    </a>
                  ) : (
                    <div
                      className="p-2 rounded-lg bg-gray-300 text-gray-600 cursor-not-allowed"
                      aria-label={contactLabel}
                    >
                      <ContactIcon size={18} />
                    </div>
                  )}
                <button
                  onClick={() => handleCallbackRequest(cab)}
                  disabled={
                    cab.unavailable ||
                    cab.unreachable ||
                    cab.requestingCallback
                  }
                  className={`flex-1 text-sm rounded-lg px-3 py-2 ${
                    cab.unavailable ||
                    cab.unreachable ||
                    cab.requestingCallback
                      ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                      : "text-gray-700 dark:text-gray-200 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500"
                  }`}
                >
                  {cab.requestingCallback ? "Requesting..." : "Callback"}
                </button>
                </div>
              </div>
            );
          })}
          <button
            onClick={() => {
              setBotStatus("idle");
              setBotResults([]);
            }}
            className="w-full text-sm font-bold p-2 mt-4 rounded-lg bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600"
          >
            Start Over
          </button>
        </div>
      )}
    </div>
  );
};
