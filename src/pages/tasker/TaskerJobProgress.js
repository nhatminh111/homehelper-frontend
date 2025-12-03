import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  Alert,
  Badge,
  Button,
  Card,
  Col,
  Container,
  Row,
  Spinner,
} from "react-bootstrap";
import ProgressBar from "react-bootstrap/ProgressBar";
import api from "../../services/api";
import { showToast } from "../../components/common/CustomToast";
import MediaUpload from "../../components/MediaUpload";
import moment from "moment";
// import "moment/locale/vi";
// moment.locale("vi");

const STATUS_COLORS = {
  completed: "success",
  in_progress: "primary",
  pending: "secondary",
};

const STATUS_LABELS = {
  completed: "Completed",
  in_progress: "In progress",
  pending: "Pending",
};

const STORAGE_KEY = "tasker_job_progress";
const ELAPSED_TIME_KEY = "tasker_daily_elapsed";

// Feature flag: toggle elapsed-time UI
const SHOW_ELAPSED = false;

// LocalStorage helpers (per-booking keys)
const tasksKeyFor = (bookingId) => `tasker_tasks_${bookingId}`;
const sessionsKeyFor = (bookingId) => `tasker_daily_sessions_${bookingId}`;
const dailyElapsedKeyFor = (bookingId) => `tasker_daily_elapsed_${bookingId}`;

const loadStoredTasks = (bookingId) => {
  try {
    const raw = localStorage.getItem(tasksKeyFor(bookingId));
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
};

const persistStoredTasks = (bookingId, tasks) => {
  try {
    localStorage.setItem(tasksKeyFor(bookingId), JSON.stringify(tasks));
  } catch (e) {}
};

const clearStoredTasks = (bookingId) => {
  try {
    localStorage.removeItem(tasksKeyFor(bookingId));
  } catch (e) {}
};

const loadStoredSessions = (bookingId) => {
  try {
    const raw = localStorage.getItem(sessionsKeyFor(bookingId));
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
};

const persistStoredSessions = (bookingId, sessions) => {
  try {
    localStorage.setItem(sessionsKeyFor(bookingId), JSON.stringify(sessions));
  } catch (e) {}
};

const loadDailyElapsed = (bookingId) => {
  try {
    const raw = localStorage.getItem(dailyElapsedKeyFor(bookingId));
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    return {};
  }
};

const saveDailyElapsed = (bookingId, payload) => {
  try {
    localStorage.setItem(
      dailyElapsedKeyFor(bookingId),
      JSON.stringify(payload)
    );
  } catch (e) {}
};
const parseChecklist = (rawChecklist) => {
  if (!rawChecklist) return [];
  if (Array.isArray(rawChecklist)) {
    return rawChecklist.map((item, index) => ({
      id: item?.id || `task-${index}`,
      label:
        typeof item === "string" ? item : item?.label || `Task ${index + 1}`,
      status: item?.status || "pending",
    }));
  }

  if (typeof rawChecklist === "string") {
    try {
      const parsed = JSON.parse(rawChecklist);
      if (Array.isArray(parsed)) {
        return parsed.map((item, index) => ({
          id: item?.id || `task-${index}`,
          label:
            typeof item === "string"
              ? item
              : item?.label || `Task ${index + 1}`,
          status: item?.status || "pending",
        }));
      }
      if (parsed && Array.isArray(parsed.items)) {
        return parsed.items.map((item, index) => ({
          id: item?.id || `task-${index}`,
          label:
            typeof item === "string"
              ? item
              : item?.label || `Task ${index + 1}`,
          status: item?.status || "pending",
        }));
      }
    } catch (err) {
      // ignore parse error and fallback to heuristic parsing
    }

    let normalized = String(rawChecklist)
      .replace(/\r\n/g, "\n")
      .replace(/\\n/g, "\n")
      .replace(/\u2022/g, "-");

    const lines = normalized
      .split(/\n|\r|-/)
      .map((item) => item.trim())
      .filter(Boolean);

    return lines.map((label, index) => ({
      id: `task-${index}`,
      label,
      status: "pending",
    }));
  }

  return [];
};

const normalizeTasks = (rawChecklist) => {
  const items = parseChecklist(rawChecklist);

  if (!items.length) {
    return [
      "Clean countertops and surfaces",
      "Deep-clean sink and faucet",
      "Clean stovetop and oven",
      "Clean refrigerator inside/out",
      "Organize cabinets and drawers",
      "Sweep and mop floors",
    ].map((label, index) => ({
      id: `default-${index}`,
      label,
      status: index < 2 ? "completed" : index === 2 ? "in_progress" : "pending",
      group: null,
    }));
  }

  return items.map((item, index) => ({
    id: `task-${index}`,
    label: item.label || `Task ${index + 1}`,
    status: item.status || (index === 0 ? "in_progress" : "pending"),
    group: item.group || null,
  }));
};

export default function TaskerJobProgress() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const initialBooking = location.state?.booking || null;
  const initialStoredTasks = initialBooking?.booking_id
    ? loadStoredTasks(initialBooking.booking_id)
    : null;

  const [booking, setBooking] = useState(initialBooking);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [tasks, setTasks] = useState(
    initialStoredTasks || normalizeTasks(initialBooking?.task_checklist)
  );
  const [elapsedMs, setElapsedMs] = useState(0);
  const [dailyElapsed, setDailyElapsed] = useState({});
  const [sessions, setSessions] = useState(() =>
    initialBooking?.booking_id
      ? loadStoredSessions(initialBooking.booking_id)
      : {}
  );
  const [nowMs, setNowMs] = useState(Date.now());
  const timerRef = useRef(null);
  const [hasLoadedStoredTasks, setHasLoadedStoredTasks] = useState(
    Boolean(initialStoredTasks)
  );

  useEffect(() => {
    if (!booking && id) {
      const fetchBooking = async () => {
        try {
          setLoading(true);
          setError(null);

          const response = await api.get(`/bookings/${id}`, {
            headers: { "Cache-Control": "no-cache" },
          });

          const payload = response?.data;
          const bookingData =
            (payload && (payload.booking || payload.data)) || payload;

          if (bookingData && bookingData.booking_id) {
            setBooking(bookingData);
            const stored = loadStoredTasks(bookingData.booking_id);
            if (stored) {
              setTasks(stored);
              setHasLoadedStoredTasks(true);
            } else {
              setTasks(normalizeTasks(bookingData.task_checklist));
            }
          } else {
            throw new Error("Không tìm thấy thông tin công việc");
          }
        } catch (err) {
          console.error("❌ Lỗi tải thông tin công việc:", err);
          setError("Không thể tải thông tin công việc. Vui lòng thử lại sau.");
        } finally {
          setLoading(false);
        }
      };

      fetchBooking();
    }
  }, [booking, id]);

  useEffect(() => {
    if (location.state?.booking) {
      setBooking(location.state.booking);
      // try to load sessions from location state first
      if (location.state.sessions) {
        setSessions(location.state.sessions || {});
      }
      if (!hasLoadedStoredTasks) {
        const stored = loadStoredTasks(location.state.booking?.booking_id);
        if (stored) {
          setTasks(stored);
          setHasLoadedStoredTasks(true);
          return;
        }
      }
      setTasks(normalizeTasks(location.state.booking?.task_checklist));
    }
  }, [location.state?.booking, hasLoadedStoredTasks]);

  useEffect(() => {
    if (booking?.booking_id && !hasLoadedStoredTasks) {
      const stored = loadStoredTasks(booking.booking_id);
      if (stored) {
        setTasks(stored);
      }
      setHasLoadedStoredTasks(true);
    }
  }, [booking?.booking_id, hasLoadedStoredTasks]);

  useEffect(() => {
    if (booking?.booking_id) {
      persistStoredTasks(booking.booking_id, tasks);
    }
  }, [tasks, booking?.booking_id]);

  const safeParseDate = (value) => {
    if (!value) return null;
    const str = String(value).trim();
    if (!str) return null;

    const sqlMatch =
      /^(\d{4})-(\d{2})-(\d{2})[\sT](\d{2}):(\d{2})(?::(\d{2}))?(?:\.(\d{1,3}))?/u.exec(
        str
      );

    if (sqlMatch) {
      const [, year, month, day, hour, minute, second = "0", milli = "0"] =
        sqlMatch;
      return new Date(
        Number(year),
        Number(month) - 1,
        Number(day),
        Number(hour),
        Number(minute),
        Number(second),
        Number(milli.padEnd(3, "0"))
      );
    }

    const date = new Date(str);
    if (Number.isNaN(date.getTime())) {
      return null;
    }
    return date;
  };

  const {
    task_description,
    location: bookingAddress,
    start_time,
    end_time,
    customer_name,
    customer_phone,
    customer_email,
    service_name,
    variant_name,
    customer_notes,
    special_instructions,
    additional_notes,
    unit,
  } = booking || {};

  const startDate = useMemo(() => safeParseDate(start_time), [start_time]);
  const endDate = useMemo(() => safeParseDate(end_time), [end_time]);

  // Kiểm tra xem booking có đầy đủ thông tin thời gian không
  const hasTimeInfo = useMemo(() => {
    return !!(startDate && endDate);
  }, [startDate, endDate]);

  // Kiểm tra xem booking có nên hiển thị theo ngày (nhiều session)
  // Treat as multi-day if unit explicitly says Tuần/Tháng or contains week/month keywords,
  // or if the booking spans more than one calendar day.
  const isWeeklyOrMonthly = useMemo(() => {
    const u = String(unit || "").toLowerCase();
    const explicitlyMulti =
      u.includes("tuần") ||
      u.includes("tháng") ||
      u.includes("week") ||
      u.includes("month");
    if (explicitlyMulti) return true;
    if (startDate && endDate) {
      // If booking spans more than one day, treat as multi-day sessions
      const dayMs = 24 * 60 * 60 * 1000;
      if (endDate.getTime() - startDate.getTime() >= dayMs) return true;
    }
    return false;
  }, [unit, startDate, endDate]);

  // Format date time cho label ngày
  const formatDateTimeForDay = useMemo(
    () =>
      new Intl.DateTimeFormat("vi-VN", {
        weekday: "short",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }),
    []
  );

  // Tính số ngày và danh sách các ngày
  const daysList = useMemo(() => {
    if (!isWeeklyOrMonthly || !startDate || !endDate) return [];

    const days = [];
    const current = new Date(startDate);
    current.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    while (current <= end) {
      const dayKey = current.toISOString().split("T")[0]; // YYYY-MM-DD
      days.push({
        date: new Date(current),
        dayKey,
        label: formatDateTimeForDay.format(current),
      });
      current.setDate(current.getDate() + 1);
    }

    return days;
  }, [isWeeklyOrMonthly, startDate, endDate, formatDateTimeForDay]);

  // Chia tasks thành các nhóm theo ngày (nếu là tuần/tháng)
  const tasksByDay = useMemo(() => {
    if (!isWeeklyOrMonthly || !daysList.length) return null;

    // For multi-day bookings we want the same checklist for each session (set).
    // So assign the full `tasks` array to every dayKey instead of slicing.
    const grouped = {};
    daysList.forEach((day) => {
      grouped[day.dayKey] = {
        day,
        tasks: tasks, // same checklist for every session
      };
    });

    return grouped;
  }, [isWeeklyOrMonthly, daysList, tasks]);

  // initialize sessions when booking and daysList are ready (correct placement)
  useEffect(() => {
    if (!booking?.booking_id || !isWeeklyOrMonthly || !daysList.length) return;
    const stored = loadStoredSessions(booking.booking_id) || {};
    const next = { ...stored };
    daysList.forEach(({ dayKey }) => {
      if (!next[dayKey]) {
        next[dayKey] = {
          done: false,
          beforePhotos: [],
          afterPhotos: [],
          taskStatuses: {},
          accumulatedMs: 0,
          startedAt: null,
        };
      }
      // Ensure numeric fields exist
      if (typeof next[dayKey].accumulatedMs !== "number")
        next[dayKey].accumulatedMs = 0;
      if (!next[dayKey].hasOwnProperty("startedAt"))
        next[dayKey].startedAt = null;
      // Initialize taskStatuses for each task only if missing/empty.
      // Use the current global task status if available so session
      // views reflect already-completed items and Start works per-session.
      if (
        !next[dayKey].taskStatuses ||
        Object.keys(next[dayKey].taskStatuses).length === 0
      ) {
        next[dayKey].taskStatuses = {};
        tasks.forEach((t) => {
          // prefer the task's existing status if present; otherwise default to 'pending'
          next[dayKey].taskStatuses[t.id] = t.status || "pending";
        });
      }
    });
    setSessions(next);
    // persist to localStorage
    persistStoredSessions(booking.booking_id, next);
  }, [booking?.booking_id, isWeeklyOrMonthly, daysList, tasks]);

  const computeElapsedMs = useCallback(() => {
    if (!startDate) return 0;

    const WORK_START = 7; // 07:00
    const WORK_END = 21; // 21:00

    const start = new Date(startDate);
    const end = new Date(endDate);

    const now = new Date();
    console.log("Current time:", now);
    // Nếu chưa đến giờ bắt đầu
    if (now < start) return 0;

    // Thời điểm thực tế để dừng tính
    const calcEnd = now < end ? now : end;

    // Tính giờ làm việc của hôm nay
    const workStart = new Date(calcEnd);
    workStart.setHours(WORK_START, 0, 0, 0);

    const workEnd = new Date(calcEnd);
    workEnd.setHours(WORK_END, 0, 0, 0);

    // Range cần tính trong hôm nay
    let rangeStart = start > workStart ? start : workStart;
    let rangeEnd = calcEnd < workEnd ? calcEnd : workEnd;
    console.log("Range start:", new Date(rangeStart));
    console.log("Range end:", new Date(rangeEnd));
    if (rangeEnd <= rangeStart) return 0;
    console.log("Computed elapsed ms:", rangeEnd - rangeStart);
    return rangeEnd - rangeStart;
  }, [startDate, endDate]);

  useEffect(() => {
    setElapsedMs(computeElapsedMs());
  }, [computeElapsedMs]);

  console.log("Elapsed ms:", computeElapsedMs);
  // Load daily elapsed time khi component mount
  useEffect(() => {
    if (booking?.booking_id && isWeeklyOrMonthly) {
      const saved = loadDailyElapsed(booking.booking_id);
      setDailyElapsed(saved);
    }
  }, [booking?.booking_id, isWeeklyOrMonthly]);

  // Tick to update session elapsed displays every second
  useEffect(() => {
    const id = setInterval(() => {
      setNowMs(Date.now());
    }, 1000);
    return () => clearInterval(id);
  }, []);

  // Tính elapsed time cho từng ngày (nếu là tuần/tháng)
  useEffect(() => {
    if (!isWeeklyOrMonthly || !hasTimeInfo || !startDate || !daysList.length)
      return;

    const updateDailyElapsed = () => {
      const now = Date.now();
      const newDailyElapsed = { ...dailyElapsed };

      daysList.forEach(({ dayKey, date }) => {
        const dayStart = new Date(date);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(date);
        dayEnd.setHours(23, 59, 59, 999);

        const dayStartMs = dayStart.getTime();
        const dayEndMs = dayEnd.getTime();

        if (now < dayStartMs) {
          newDailyElapsed[dayKey] = 0;
        } else if (now > dayEndMs) {
          // Ngày đã qua, tính tổng thời gian trong ngày
          // Giả sử mỗi ngày làm việc 8 giờ (có thể điều chỉnh)
          const workHoursPerDay = 8;
          newDailyElapsed[dayKey] = workHoursPerDay * 60 * 60 * 1000;
        } else {
          // Đang trong ngày, tính thời gian từ đầu ngày đến hiện tại
          const elapsed = Math.max(0, now - dayStartMs);
          // Giới hạn tối đa là 8 giờ/ngày
          const maxMs = 8 * 60 * 60 * 1000;
          newDailyElapsed[dayKey] = Math.min(elapsed, maxMs);
        }
      });

      setDailyElapsed(newDailyElapsed);

      if (booking?.booking_id) {
        saveDailyElapsed(booking.booking_id, newDailyElapsed);
      }
    };

    updateDailyElapsed();
    const interval = setInterval(updateDailyElapsed, 1000);

    return () => clearInterval(interval);
  }, [
    isWeeklyOrMonthly,
    hasTimeInfo,
    startDate,
    daysList,
    booking?.booking_id,
    dailyElapsed,
  ]);

  useEffect(() => {
    if (!hasTimeInfo || !startDate) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    timerRef.current = setInterval(() => {
      setElapsedMs(computeElapsedMs());
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [computeElapsedMs, startDate, hasTimeInfo]);

  const handleTaskStatus = (taskId, dayKey = null) => {
    // If dayKey provided (multi-day), toggle session-local task status
    if (dayKey && isWeeklyOrMonthly) {
      setSessions((prev) => {
        // deep clone previous sessions to ensure React detects nested changes
        let next = {};
        try {
          next = prev ? JSON.parse(JSON.stringify(prev)) : {};
        } catch (e) {
          next = { ...(prev || {}) };
        }
        const cur = next[dayKey] || {
          done: false,
          beforePhotos: [],
          afterPhotos: [],
          taskStatuses: {},
        };
        // For session tasks: only allow pending -> in_progress (Start),
        // and allow toggling in_progress -> pending (undo Start).
        // Converting in_progress -> completed is done when the session
        // is finalized via `toggleSessionDone` (Mark Session Done).
        const current = cur.taskStatuses?.[taskId] || "pending";
        // Cycle: pending -> in_progress -> completed -> pending
        let nextStatus = current;
        if (current === "pending") {
          nextStatus = "in_progress"; // Start
        } else if (current === "in_progress") {
          nextStatus = "completed"; // clicking while in-progress completes the task
        } else if (current === "completed") {
          nextStatus = "pending"; // allow undo from completed back to pending
        }

        // If transitioning to in_progress, start session timer if not started
        if (current !== "in_progress" && nextStatus === "in_progress") {
          if (!cur.startedAt) cur.startedAt = Date.now();
        }

        // If transitioning to completed, finalize any running timer for that session
        if (nextStatus === "completed") {
          const now = Date.now();
          if (cur.startedAt) {
            cur.accumulatedMs =
              (cur.accumulatedMs || 0) + Math.max(0, now - cur.startedAt);
            cur.startedAt = null;
          }
        }

        cur.taskStatuses = {
          ...(cur.taskStatuses || {}),
          [taskId]: nextStatus,
        };

        // temporary visual flash indicator so Start has immediate UI feedback
        cur._flash = cur._flash || {};
        cur._flash[taskId] = true;
        // clear flash after short delay
        setTimeout(() => {
          setSessions((innerPrev) => {
            try {
              const innerNext = innerPrev
                ? JSON.parse(JSON.stringify(innerPrev))
                : {};
              if (innerNext?.[dayKey]?._flash) {
                delete innerNext[dayKey]._flash[taskId];
              }
              if (booking?.booking_id)
                persistStoredSessions(booking.booking_id, innerNext);
              return innerNext;
            } catch (e) {
              return innerPrev;
            }
          });
        }, 600);

        // Debug/log + lightweight feedback so user sees Start took effect
        try {
          console.debug(
            `handleTaskStatus: booking=${booking?.booking_id} day=${dayKey} task=${taskId} ${current} -> ${nextStatus}`
          );
        } catch (e) {}

        try {
          if (nextStatus === "in_progress") {
            showToast?.info("Bắt đầu: " + (taskId || "task"));
          } else if (nextStatus === "pending") {
            showToast?.info("Hoàn tác bắt đầu: " + (taskId || "task"));
          }
        } catch (e) {}
        next[dayKey] = cur;
        if (booking?.booking_id)
          persistStoredSessions(booking.booking_id, next);
        return next;
      });
      return;
    }

    // Fallback: toggle global task status
    setTasks((prev) => {
      const next = prev.map((task) => {
        if (task.id !== taskId) return task;

        const nextStatus =
          task.status === "pending"
            ? "in_progress"
            : task.status === "in_progress"
            ? "completed"
            : "pending";

        try {
          console.debug(
            `handleTaskStatus (global): booking=${booking?.booking_id} task=${taskId} ${task.status} -> ${nextStatus}`
          );
        } catch (e) {}

        try {
          if (nextStatus === "in_progress")
            showToast?.info("Bắt đầu: " + (task.label || taskId));
          else if (nextStatus === "completed")
            showToast?.success("Hoàn thành: " + (task.label || taskId));
        } catch (e) {}

        return { ...task, status: nextStatus };
      });
      return next;
    });
  };

  // Helpers for session photo previews
  const createPreviewObjs = (files) =>
    Array.from(files || []).map((file) => ({
      file,
      name: file.name,
      preview: URL.createObjectURL(file),
    }));

  const handleSessionBeforeChange = (dayKey, event) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    try {
      console.debug(
        `handleSessionBeforeChange: booking=${booking?.booking_id} day=${dayKey} files=${files.length}`
      );
    } catch (e) {}
    setSessions((prev) => {
      const next = { ...(prev || {}) };
      const cur = next[dayKey] || {
        done: false,
        beforePhotos: [],
        afterPhotos: [],
      };
      cur.beforePhotos = [
        ...(cur.beforePhotos || []),
        ...createPreviewObjs(files),
      ];
      next[dayKey] = cur;
      if (booking?.booking_id) persistStoredSessions(booking.booking_id, next);
      return next;
    });
    // reset file input so the same file can be selected again if needed
    try {
      event.target.value = null;
    } catch (e) {}
  };

  const handleSessionAfterChange = (dayKey, event) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    try {
      console.debug(
        `handleSessionAfterChange: booking=${booking?.booking_id} day=${dayKey} files=${files.length}`
      );
    } catch (e) {}
    setSessions((prev) => {
      const next = { ...(prev || {}) };
      const cur = next[dayKey] || {
        done: false,
        beforePhotos: [],
        afterPhotos: [],
      };
      cur.afterPhotos = [
        ...(cur.afterPhotos || []),
        ...createPreviewObjs(files),
      ];
      next[dayKey] = cur;
      if (booking?.booking_id) persistStoredSessions(booking.booking_id, next);
      return next;
    });
    try {
      event.target.value = null;
    } catch (e) {}
  };

  const setSessionPhotos = (dayKey, type, photos) => {
    // Accept either an array of photos OR an updater function (like setState)
    setSessions((prev) => {
      const next = prev ? JSON.parse(JSON.stringify(prev)) : {};
      const cur = next[dayKey] || {
        done: false,
        beforePhotos: [],
        afterPhotos: [],
        taskStatuses: {},
      };

      if (typeof photos === "function") {
        const current =
          type === "before" ? cur.beforePhotos || [] : cur.afterPhotos || [];
        const updated = photos(current) || [];
        if (type === "before") cur.beforePhotos = updated;
        else cur.afterPhotos = updated;
      } else {
        if (type === "before") cur.beforePhotos = photos || [];
        else cur.afterPhotos = photos || [];
      }

      next[dayKey] = cur;
      if (booking?.booking_id) persistStoredSessions(booking.booking_id, next);
      return next;
    });
  };

  // Upload files to backend for a session (returns array of uploaded URLs)
  const uploadSessionPhotosFiles = async (dayKey, type, files) => {
    if (!booking?.booking_id) throw new Error("Missing booking id");
    try {
      const form = new FormData();
      for (const file of files) form.append("photos", file);
      form.append("type", type);
      showToast?.info("Uploading photos...");
      const resp = await api.post(
        `/bookings/${booking.booking_id}/sessions/${dayKey}/photos`,
        form
      );
      // backend responds { success: true, files: [...] }
      const urls = resp.data && resp.data.files ? resp.data.files : [];
      showToast?.success("Photos uploaded");
      return urls;
    } catch (err) {
      console.error("uploadSessionPhotosFiles error:", err);
      // Prefer server-provided message when available
      const serverMsg =
        err?.response?.data?.message || err?.response?.data?.error || null;
      if (serverMsg) {
        showToast?.error(`Upload failed: ${serverMsg}`);
      } else if (err?.message) {
        showToast?.error(`Upload failed: ${err.message}`);
      } else {
        showToast?.error("Upload failed");
      }
      return err?.response?.data || null;
    }
  };

  // Wrapper to pass to MediaUpload so new file selections are uploaded automatically
  const makeSessionSetPhotos = (dayKey, type) => (photosOrUpdater) => {
    // Compute new array and detech files to upload
    setSessions((prev) => {
      const next = prev ? JSON.parse(JSON.stringify(prev)) : {};
      const cur = next[dayKey] || {
        done: false,
        beforePhotos: [],
        afterPhotos: [],
        taskStatuses: {},
      };
      const currentArr =
        type === "before" ? cur.beforePhotos || [] : cur.afterPhotos || [];
      const newArr =
        typeof photosOrUpdater === "function"
          ? photosOrUpdater(currentArr)
          : photosOrUpdater || [];

      // Assign temp ids for newly added files so we can replace them after upload
      const processed = newArr.map((it) => {
        if (it && it.file) {
          return {
            ...it,
            tempId: `local-${Date.now()}-${Math.random()
              .toString(36)
              .slice(2, 9)}`,
            uploading: true,
          };
        }
        return it;
      });

      if (type === "before") cur.beforePhotos = processed;
      else cur.afterPhotos = processed;
      next[dayKey] = cur;
      if (booking?.booking_id) persistStoredSessions(booking.booking_id, next);
      return next;
    });

    // Start async upload for newly added files
    (async () => {
      try {
        // Determine files to upload from the photosOrUpdater result
        // We need to reconstruct the newArr similarly
        const prevSnapshot = sessions?.[dayKey] || {
          beforePhotos: [],
          afterPhotos: [],
        };
        const currentArr =
          type === "before"
            ? prevSnapshot.beforePhotos || []
            : prevSnapshot.afterPhotos || [];
        const newArr =
          typeof photosOrUpdater === "function"
            ? photosOrUpdater(currentArr)
            : photosOrUpdater || [];
        const toUpload = newArr.filter((p) => p && p.file);
        if (!toUpload || toUpload.length === 0) return;

        // Extract File objects and keep tempIds order by matching previews or file names
        const files = toUpload.map((p) => p.file);
        const tempIds = toUpload.map(
          (p) =>
            p.tempId ||
            `local-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
        );

        const urls = await uploadSessionPhotosFiles(dayKey, type, files);
        if (!urls) return;

        // Replace placeholders with server urls in sessions
        setSessions((prev) => {
          const next = prev ? JSON.parse(JSON.stringify(prev)) : {};
          const cur = next[dayKey] || {
            beforePhotos: [],
            afterPhotos: [],
            taskStatuses: {},
          };
          const arrKey = type === "before" ? "beforePhotos" : "afterPhotos";
          const arr = cur[arrKey] || [];

          // Replace uploading placeholders in order of appearance with returned urls
          let urlIndex = 0;
          const replaced = arr.map((item) => {
            if (item && item.uploading && urlIndex < urls.length) {
              const url = urls[urlIndex++];
              return { url, fileName: item.name || null, uploaded: true };
            }
            return item;
          });

          cur[arrKey] = replaced;
          next[dayKey] = cur;
          if (booking?.booking_id)
            persistStoredSessions(booking.booking_id, next);
          return next;
        });
      } catch (e) {
        console.error("Auto-upload session photos failed:", e);
      }
    })();
  };

  const removeSessionPhoto = (dayKey, type, index) => {
    setSessions((prev) => {
      const next = { ...(prev || {}) };
      const cur = next[dayKey];
      if (!cur) return prev;
      const arr =
        type === "before"
          ? [...(cur.beforePhotos || [])]
          : [...(cur.afterPhotos || [])];
      const [removed] = arr.splice(index, 1);
      if (removed && removed.preview) {
        try {
          URL.revokeObjectURL(removed.preview);
        } catch (e) {}
      }
      if (type === "before") cur.beforePhotos = arr;
      else cur.afterPhotos = arr;
      next[dayKey] = cur;
      if (booking?.booking_id) persistStoredSessions(booking.booking_id, next);
      return next;
    });
  };

  const toggleSessionDone = (dayKey) => {
    setSessions((prev) => {
      const next = { ...(prev || {}) };
      const cur = next[dayKey] || {
        done: false,
        beforePhotos: [],
        afterPhotos: [],
        accumulatedMs: 0,
        startedAt: null,
      };
      const now = Date.now();
      if (!cur.done) {
        // Marking done -> finalize elapsed
        const add = cur.startedAt ? Math.max(0, now - cur.startedAt) : 0;
        cur.accumulatedMs = (cur.accumulatedMs || 0) + add;
        cur.startedAt = null;
        // mark all in_progress tasks as completed for this session
        Object.keys(cur.taskStatuses || {}).forEach((tid) => {
          if (cur.taskStatuses[tid] === "in_progress")
            cur.taskStatuses[tid] = "completed";
        });
        cur.done = true;
        try {
          showToast?.success(`Đã hoàn thành phiên ${dayKey}`);
        } catch (e) {}
      } else {
        // Unmark done -> resume session
        cur.done = false;
        cur.startedAt = now;
        try {
          showToast?.info(`Đã bỏ tick phiên ${dayKey}`);
        } catch (e) {}
      }

      next[dayKey] = cur;
      if (booking?.booking_id) persistStoredSessions(booking.booking_id, next);
      return next;
    });
  };

  // Persist sessions when they change
  useEffect(() => {
    if (!booking?.booking_id) return;
    persistStoredSessions(booking.booking_id, sessions || {});
  }, [sessions, booking?.booking_id]);

  // Debug: log session changes for easier tracing
  useEffect(() => {
    try {
      console.debug("sessions updated:", sessions);
    } catch (e) {}
  }, [sessions]);

  // Cleanup created object URLs on unmount
  useEffect(() => {
    return () => {
      try {
        Object.values(sessions || {}).forEach((s) => {
          (s.beforePhotos || []).forEach(
            (p) => p.preview && URL.revokeObjectURL(p.preview)
          );
          (s.afterPhotos || []).forEach(
            (p) => p.preview && URL.revokeObjectURL(p.preview)
          );
        });
      } catch (e) {}
    };
  }, [sessions]);

  const handleCompleteJob = async () => {
    if (!booking?.booking_id) return;

    if (!tasks.every((task) => task.status === "completed")) {
      showToast.warning(
        "Vui lòng hoàn thành toàn bộ checklist trước khi kết thúc công việc."
      );
      return;
    }

    try {
      setLoading(true);
      const token = api.getStoredToken();
      const response = await fetch(
        `http://localhost:3001/api/bookings/${booking.booking_id}/status`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status: "Hoàn thành" }),
        }
      );
      const result = await response.json();

      if (result.success) {
        clearStoredTasks(booking.booking_id);
        const updatedBooking = {
          ...booking,
          status: "Hoàn thành",
        };
        showToast.success("Công việc đã được đánh dấu hoàn thành!");
        navigate(`/tasker/bookings/${booking.booking_id}/complete`, {
          replace: true,
          state: {
            booking: updatedBooking,
            tasks,
          },
        });
      } else {
        showToast.error("Không thể cập nhật trạng thái. Vui lòng thử lại.");
      }
    } catch (err) {
      console.error("❌ Lỗi cập nhật trạng thái:", err);
      showToast.error("Có lỗi xảy ra khi cập nhật trạng thái.");
    } finally {
      setLoading(false);
    }
  };

  const progress = useMemo(() => {
    if (!tasks.length) return 0;
    // If this is a weekly/monthly booking with sessions, derive progress
    // from per-day session taskStatuses when available so that
    // Mark Session Done updates the percent correctly.
    if (isWeeklyOrMonthly && tasksByDay) {
      let total = 0;
      let completed = 0;
      Object.values(tasksByDay).forEach(({ day, tasks: dayTasks }) => {
        const dayKey = day?.dayKey;
        total += (dayTasks || []).length;
        (dayTasks || []).forEach((t) => {
          const status = sessions?.[dayKey]?.taskStatuses?.[t.id] || t.status;
          if (status === "completed") completed += 1;
        });
      });
      return total === 0 ? 0 : Math.round((completed / total) * 100);
    }

    const completed = tasks.filter(
      (task) => task.status === "completed"
    ).length;
    return Math.round((completed / tasks.length) * 100);
  }, [tasks, isWeeklyOrMonthly, tasksByDay, sessions]);

  const summary = useMemo(() => {
    // When sessions are present, compute totals from tasksByDay + sessions
    if (isWeeklyOrMonthly && tasksByDay) {
      let total = 0;
      let completed = 0;
      let inProgress = 0;
      Object.values(tasksByDay).forEach(({ day, tasks: dayTasks }) => {
        const dayKey = day?.dayKey;
        total += (dayTasks || []).length;
        (dayTasks || []).forEach((t) => {
          const status = sessions?.[dayKey]?.taskStatuses?.[t.id] || t.status;
          if (status === "completed") completed += 1;
          else if (status === "in_progress") inProgress += 1;
        });
      });
      return { total, completed, inProgress };
    }

    const total = tasks.length;
    const completed = tasks.filter(
      (task) => task.status === "completed"
    ).length;
    const inProgress = tasks.filter(
      (task) => task.status === "in_progress"
    ).length;
    return { total, completed, inProgress };
  }, [tasks, isWeeklyOrMonthly, tasksByDay, sessions]);

  const allTasksCompleted = useMemo(
    () => summary.completed === summary.total,
    [summary.completed, summary.total]
  );

  const groupedTasks = useMemo(() => {
    // Nếu là tuần/tháng, sử dụng tasksByDay
    if (isWeeklyOrMonthly && tasksByDay) {
      return Object.values(tasksByDay).map(({ day, tasks: dayTasks }) => ({
        group: day.label,
        dayKey: day.dayKey,
        items: dayTasks,
      }));
    }

    // Nếu không phải tuần/tháng, group theo group field như cũ
    const map = new Map();
    tasks.forEach((task) => {
      const key = task.group || "__default__";
      if (!map.has(key)) {
        map.set(key, []);
      }
      map.get(key).push(task);
    });
    return Array.from(map.entries()).map(([groupKey, items]) => ({
      group: groupKey === "__default__" ? null : groupKey,
      items,
    }));
  }, [tasks, isWeeklyOrMonthly, tasksByDay]);

  // Format elapsed time cho từng ngày
  const formatDailyElapsed = useCallback(
    (dayKey) => {
      // Prefer session-based elapsed if available
      const s = sessions?.[dayKey];
      let ms = 0;
      if (s) {
        ms =
          (s.accumulatedMs || 0) +
          (s.startedAt ? Math.max(0, nowMs - s.startedAt) : 0);
      } else {
        ms = dailyElapsed[dayKey] || 0;
      }
      if (ms <= 0) return "00:00:00";
      const totalSeconds = Math.floor(ms / 1000);
      const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, "0");
      const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(
        2,
        "0"
      );
      const seconds = String(totalSeconds % 60).padStart(2, "0");
      return `${hours}:${minutes}:${seconds}`;
    },
    [dailyElapsed, sessions, nowMs]
  );

  const formatDateTime = useMemo(
    () =>
      new Intl.DateTimeFormat("vi-VN", {
        weekday: "short",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }),
    []
  );

  const formatTimeOnly = useMemo(
    () =>
      new Intl.DateTimeFormat("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }),
    []
  );
  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const endsWithZ = /z$/i.test(String(dateString)); // ISO UTC like 2025-09-20T12:07:00Z
    const options = {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    };
    // If the input is explicitly UTC (ends with 'Z'), format in UTC to avoid +7h shift
    if (endsWithZ) {
      return new Intl.DateTimeFormat("vi-VN", {
        ...options,
        timeZone: "UTC",
      }).format(date);
    }
    // Otherwise, render with default locale settings
    return new Intl.DateTimeFormat("vi-VN", options).format(date);
  };
  const formattedEnd = useMemo(() => {
    if (!booking?.end_time) return "—";
    return moment(booking.end_time).format("DD/MM/YYYY HH:mm");
  }, [booking?.end_time]);

  const dueLabel = useMemo(() => {
    if (!endDate) return "No due time";
    const now = Date.now();
    if (now > endDate.getTime()) {
      return "Đã quá thời hạn";
    }
    return `Due ${formatTimeOnly.format(endDate)}`;
  }, [endDate, formatTimeOnly]);

  const startStatusLabel = useMemo(() => {
    if (!startDate) return null;
    const now = Date.now();
    if (now < startDate.getTime()) {
      const diff = startDate.getTime() - now;
      const hours = String(Math.floor(diff / (1000 * 60 * 60))).padStart(
        2,
        "0"
      );
      const minutes = String(Math.floor((diff / (1000 * 60)) % 60)).padStart(
        2,
        "0"
      );
      return `Bắt đầu sau ${hours}:${minutes}`;
    }
    return null;
  }, [startDate]);

  const formattedElapsed = useMemo(() => {
    if (elapsedMs <= 0) return "00:00:00";
    const totalSeconds = Math.floor(elapsedMs / 1000);
    const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, "0");
    const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(
      2,
      "0"
    );
    const seconds = String(totalSeconds % 60).padStart(2, "0");
    return `${hours}:${minutes}:${seconds}`;
  }, [elapsedMs]);

  if (loading && !booking) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" role="status" />
        <p className="text-muted mt-3">Đang tải thông tin công việc...</p>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="py-5 text-center">
        <Alert variant="danger">{error}</Alert>
        <Button variant="secondary" onClick={() => navigate(-1)}>
          ← Quay lại
        </Button>
      </Container>
    );
  }

  if (!booking) {
    return (
      <Container className="py-5 text-center">
        <p className="text-muted">Không tìm thấy dữ liệu công việc.</p>
        <Button variant="secondary" onClick={() => navigate(-1)}>
          ← Quay lại
        </Button>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      <Card className="border-0 shadow-sm mb-4">
        <Card.Body className="py-4 px-4">
          <Row className="align-items-center g-3">
            <Col md={6}>
              <div className="d-flex flex-column gap-1">
                <small className="text-uppercase text-muted fw-semibold">
                  {service_name || "Service"} • {variant_name || "Variant"}
                </small>
                <h3 className="fw-bold mb-0">
                  {task_description || "House Cleaning – 3 Bedrooms Apartment"}
                </h3>
                <div className="text-muted">
                  {bookingAddress || "Địa chỉ chưa cập nhật"} •{" "}
                  {startDate
                    ? formatDateTime.format(startDate)
                    : "Chưa rõ thời gian"}
                </div>
              </div>
            </Col>
            <Col md={3}>
              <div className="text-md-center text-start">
                <div className="text-uppercase text-muted small fw-semibold">
                  Progress
                </div>
                <div className="d-flex align-items-center gap-3 mt-2">
                  <ProgressBar
                    now={progress}
                    className="flex-grow-1"
                    style={{ height: "10px", borderRadius: "999px" }}
                  />
                  <span className="fw-bold text-dark">{progress}%</span>
                </div>
                <div className="mt-2 text-muted small">
                  {summary.completed} / {summary.total} tasks completed
                </div>
              </div>
            </Col>
            {hasTimeInfo && SHOW_ELAPSED && (
              <Col md={3} className="text-md-end">
                <div className="text-uppercase text-muted small fw-semibold">
                  Time Elapsed
                </div>
                <div className="display-6 fw-bold text-primary">
                  {formattedElapsed}
                </div>
                {startStatusLabel && (
                  <div className="text-muted small">{startStatusLabel}</div>
                )}
                <div className="text-muted small">{dueLabel}</div>
                <hr className="my-3" />
                <div className="text-muted small d-flex flex-column gap-1">
                  <span>
                    <i className="bi bi-play-circle me-2 text-success"></i>
                    Bắt đầu:{formatDate(start_time)}
                  </span>
                  <span>
                    <i className="bi bi-flag me-2 text-danger"></i>
                    Kết thúc: {formatDate(end_time)}
                  </span>
                </div>
              </Col>
            )}
          </Row>
        </Card.Body>
      </Card>

      <Row className="g-4">
        <Col lg={8}>
          <div>
            <Card className="shadow-sm border-0 mb-4">
              <Card.Body>
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <div>
                    <h5 className="mb-0 fw-semibold">Task Checklist</h5>
                    <small className="text-muted">
                      Complete all tasks to finish the job
                    </small>
                  </div>
                  <Badge
                    bg="primary"
                    className="px-3 py-2 d-inline-flex align-items-center gap-2"
                  >
                    <i className="bi bi-check2-circle"></i>
                    {progress}% Done
                  </Badge>
                </div>

                <div className="d-flex flex-column gap-4">
                  {groupedTasks.map(({ group, items, dayKey }, groupIndex) => (
                    <div
                      key={group || `group-${groupIndex}`}
                      className="d-flex flex-column gap-3"
                    >
                      {/* Session card for weekly/monthly bookings */}
                      {isWeeklyOrMonthly && dayKey && (
                        <Card className="mb-2 border-0">
                          <Card.Body className="d-flex align-items-center justify-content-between">
                            <div>
                              <div className="fw-semibold">{group}</div>
                              <div className="text-muted small">
                                Session: 07:00 - 21:00
                              </div>
                            </div>
                            <div className="d-flex align-items-center gap-3">
                              {SHOW_ELAPSED && (
                                <div className="text-center">
                                  <i className="bi bi-clock-history text-primary"></i>
                                  <div className="fw-bold">
                                    {formatDailyElapsed(dayKey)}
                                  </div>
                                </div>
                              )}
                              <div>
                                <div className="d-flex gap-2 align-items-center">
                                  <div style={{ minWidth: 220 }}>
                                    <MediaUpload
                                      label="Before"
                                      photos={
                                        sessions?.[dayKey]?.beforePhotos || []
                                      }
                                      setPhotos={makeSessionSetPhotos(
                                        dayKey,
                                        "before"
                                      )}
                                    />
                                  </div>
                                  <div style={{ minWidth: 220 }}>
                                    <MediaUpload
                                      label="After"
                                      photos={
                                        sessions?.[dayKey]?.afterPhotos || []
                                      }
                                      setPhotos={makeSessionSetPhotos(
                                        dayKey,
                                        "after"
                                      )}
                                    />
                                  </div>
                                  <div className="ms-2">
                                    <button
                                      className={`btn ${
                                        sessions?.[dayKey]?.done
                                          ? "btn-success"
                                          : "btn-primary"
                                      } btn-sm`}
                                      onClick={() => toggleSessionDone(dayKey)}
                                    >
                                      {sessions?.[dayKey]?.done
                                        ? "Session Done"
                                        : "Mark Session Done"}
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </Card.Body>
                          <div className="px-3 pb-3">
                            {/* session debug removed */}
                            {/* MediaUpload renders previews and remove controls */}
                          </div>
                        </Card>
                      )}
                      {group && (
                        <div className="d-flex align-items-center justify-content-between">
                          <div className="d-flex align-items-center gap-2">
                            <span className="badge bg-secondary-subtle text-secondary fw-semibold px-3 py-2">
                              {group}
                            </span>
                            <span className="text-muted small">
                              {isWeeklyOrMonthly && dayKey
                                ? Object.values(
                                    sessions?.[dayKey]?.taskStatuses || {}
                                  ).filter((v) => v === "completed").length
                                : items.filter(
                                    (item) => item.status === "completed"
                                  ).length}{" "}
                              / {items.length} tasks
                            </span>
                          </div>
                          {isWeeklyOrMonthly &&
                            dayKey &&
                            hasTimeInfo &&
                            SHOW_ELAPSED && (
                              <div className="d-flex align-items-center gap-2">
                                <i className="bi bi-clock-history text-primary"></i>
                                <span className="fw-bold text-primary">
                                  {formatDailyElapsed(dayKey)}
                                </span>
                              </div>
                            )}
                        </div>
                      )}
                      {items.map((task) => {
                        const currentStatus =
                          isWeeklyOrMonthly && dayKey
                            ? sessions?.[dayKey]?.taskStatuses?.[task.id] ||
                              task.status
                            : task.status;

                        return (
                          <Card
                            key={`${task.id}-${dayKey || "global"}`}
                            className="border-0 shadow-sm"
                            style={{
                              borderRadius: "16px",
                              ...(sessions?.[dayKey]?._flash?.[task.id]
                                ? { backgroundColor: "#e6f7ff" }
                                : {}),
                            }}
                          >
                            <Card.Body className="d-flex align-items-center justify-content-between py-3 px-4">
                              <div className="d-flex align-items-center gap-3">
                                <div
                                  className={`d-flex align-items-center justify-content-center rounded-circle ${
                                    currentStatus === "completed"
                                      ? "bg-success bg-opacity-10 text-success"
                                      : currentStatus === "in_progress"
                                      ? "bg-primary bg-opacity-10 text-primary"
                                      : "bg-light text-secondary"
                                  }`}
                                  style={{ width: 44, height: 44 }}
                                >
                                  {currentStatus === "completed" ? (
                                    <i className="bi bi-check-circle-fill fs-5"></i>
                                  ) : currentStatus === "in_progress" ? (
                                    <i className="bi bi-hourglass-split fs-5"></i>
                                  ) : (
                                    <i className="bi bi-circle fs-5"></i>
                                  )}
                                </div>
                                <div>
                                  <div className="fw-semibold text-dark">
                                    {task.label}
                                  </div>
                                  <small className="text-muted">
                                    {STATUS_LABELS[currentStatus] || "Pending"}
                                  </small>
                                </div>
                              </div>
                              <Button
                                variant={
                                  currentStatus === "completed"
                                    ? "outline-success"
                                    : currentStatus === "in_progress"
                                    ? "primary"
                                    : "outline-secondary"
                                }
                                size="sm"
                                className="fw-semibold"
                                onClick={() =>
                                  handleTaskStatus(task.id, dayKey || null)
                                }
                              >
                                {currentStatus === "completed"
                                  ? "Completed"
                                  : currentStatus === "in_progress"
                                  ? isWeeklyOrMonthly && dayKey
                                    ? "In progress"
                                    : "Mark done"
                                  : "Start"}
                              </Button>
                            </Card.Body>
                          </Card>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </Card.Body>
            </Card>

            <div className="d-flex gap-3 flex-wrap">
              <Button
                variant="danger"
                className="px-4 py-2 fw-semibold"
                disabled={loading || !allTasksCompleted}
                onClick={handleCompleteJob}
              >
                <i className="bi bi-stop-circle me-2"></i>
                End Job
              </Button>
            </div>
            {!allTasksCompleted && (
              <small className="text-muted d-block mt-2">
                Vui lòng hoàn thành tất cả mục trong checklist trước khi kết
                thúc công việc.
              </small>
            )}
          </div>
        </Col>

        <Col lg={4}>
          <div className="d-flex flex-column gap-4">
            <Card className="shadow-sm border-0">
              <Card.Body>
                <h6 className="fw-semibold mb-3">Customer Notes</h6>
                <div className="d-flex flex-column gap-3 text-muted">
                  <div>
                    <div className="fw-semibold text-dark mb-1">
                      Special Instructions
                    </div>
                    <p className="mb-0">
                      {special_instructions ||
                        "Không có ghi chú đặc biệt. Vui lòng hoàn thành theo yêu cầu tiêu chuẩn."}
                    </p>
                  </div>
                  <div>
                    <div className="fw-semibold text-dark mb-1">
                      Access Information
                    </div>
                    <p className="mb-0">
                      {customer_notes ||
                        "Khách hàng sẽ có mặt tại nhà. Liên hệ trước khi đến để được hỗ trợ thêm."}
                    </p>
                  </div>
                  <div>
                    <div className="fw-semibold text-dark mb-1">
                      Additional Notes
                    </div>
                    <p className="mb-0">
                      {additional_notes ||
                        "Nếu cần thêm vật dụng, vui lòng trao đổi với khách hàng."}
                    </p>
                  </div>
                </div>
              </Card.Body>
            </Card>

            <Card className="shadow-sm border-0">
              <Card.Body>
                <h6 className="fw-semibold mb-3">Contact</h6>
                <div className="text-muted d-flex flex-column gap-2">
                  <div>
                    <i className="bi bi-person me-2 text-primary"></i>
                    {customer_name || "Khách hàng ẩn danh"}
                  </div>
                  {customer_phone && (
                    <div>
                      <i className="bi bi-telephone me-2 text-primary"></i>
                      {customer_phone}
                    </div>
                  )}
                  {customer_email && (
                    <div>
                      <i className="bi bi-envelope me-2 text-primary"></i>
                      {customer_email}
                    </div>
                  )}
                  {end_time && (
                    <div>
                      <i className="bi bi-clock-history me-2 text-primary"></i>
                      Dự kiến hoàn thành: {formattedEnd}
                    </div>
                  )}
                </div>
              </Card.Body>
            </Card>
          </div>
        </Col>
      </Row>
    </Container>
  );
}
