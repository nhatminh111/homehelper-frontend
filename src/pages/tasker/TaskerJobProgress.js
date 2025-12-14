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
const SHOW_ELAPSED = true;

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
  } catch (e) { }
};

const clearStoredTasks = (bookingId) => {
  try {
    localStorage.removeItem(tasksKeyFor(bookingId));
  } catch (e) { }
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
  } catch (e) { }
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
  } catch (e) { }
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

  const NO_PHOTO_SERVICES = [
    "Chăm sóc người già và bệnh nhân",
    "Chăm sóc trẻ em"
  ];

  const [tick, setTick] = useState(0);

  useEffect(() => {

    if (!id) return;            // chưa có id → không làm gì
    if (booking) return;        // đã có booking → không fetch lại

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
  }, [id]);

  useEffect(() => {
    if (location.state?.booking) {
      setBooking(location.state.booking);
      // try to load sessions from location state first
      if (location.state.sessions) {
        setSessions(location.state.sessions || {});
      }

      const stored = loadStoredTasks(location.state.booking?.booking_id);
      if (stored) {
        setTasks(stored);
        return;
      }
      setTasks(normalizeTasks(location.state.booking?.task_checklist));
    }
  }, [location.state?.booking]);

  useEffect(() => {
    if (booking?.booking_id) {
      const stored = loadStoredTasks(booking.booking_id);
      if (stored) {
        setTasks(stored);
      } else {
        setTasks(normalizeTasks(booking.task_checklist));
      }
    }
  }, [booking?.booking_id]);

  useEffect(() => {
    if (booking?.booking_id) {
      persistStoredTasks(booking.booking_id, tasks);
    }
  }, [tasks, booking?.booking_id]);

  useEffect(() => {
    const id = setInterval(() => {
      setTick(t => t + 1);
    }, 1000);

    return () => clearInterval(id);
  }, []);


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

  const safeBack = () => {
    if (location.state?.fromProgress && booking?.booking_id) {
      navigate(`/tasker/bookings/${booking.booking_id}/progress`);
    } else if (location.state?.booking?.booking_id) {
      navigate(`/tasker/bookings/${location.state.booking.booking_id}/progress`);
    } else if (booking?.booking_id) {
      navigate(`/tasker/bookings/${booking.booking_id}`);
    } else {
      navigate("/tasker/bookings");
    }
  };

  // initialize sessions when booking and daysList are ready (correct placement)
  useEffect(() => {
    console.log(
      "%c[INIT] Start init sessions",
      "color: green; font-weight:bold;",
      {
        bookingId: booking?.booking_id,
        isWeeklyOrMonthly,
        daysList,
        tasksBeforeInit: tasks,
        storedBeforeInit: loadStoredSessions(booking?.booking_id),
      }
    );

    if (!booking?.booking_id) return;

    // xác định loại booking
    const safeDaysList =
      isWeeklyOrMonthly && daysList.length > 0
        ? daysList
        : [{ dayKey: "default" }];

    const stored = loadStoredSessions(booking.booking_id) || {};
    const next = { ...stored };

    console.log("%c[INIT] Stored sessions loaded", "color:purple", next);
    console.log("[INIT] Loaded timers:", stored?.default?.timers);

    safeDaysList.forEach(({ dayKey }) => {
      console.log("%c[INIT] Processing dayKey:", "color:cyan", dayKey);
      if (!next[dayKey]) {
        console.log(" → creating new empty session");

        next[dayKey] = {
          done: false,
          taskStatuses: {},
          timers: {},
          accumulatedMs: 0,
          startedAt: null,
        };
      }

      const session = next[dayKey];

      console.log("Before fill:", JSON.stringify(session, null, 2));

      // 2) Đảm bảo các field quan trọng luôn tồn tại
      if (!session.taskStatuses) session.taskStatuses = {};
      if (!session.timers) session.timers = {};
      if (typeof session.accumulatedMs !== "number")
        session.accumulatedMs = 0;
      if (!session.hasOwnProperty("startedAt"))
        session.startedAt = null;

      // 3) Đồng bộ taskStatuses — thêm những task mới, giữ nguyên task cũ
      tasks.forEach((t) => {
        if (!session.taskStatuses.hasOwnProperty(t.id)) {
          console.log(" → Adding missing taskStatus for:", t.id);

          session.taskStatuses[t.id] = t.status || "pending";
        }
      });

      // 4) Đồng bộ timers — thêm những task mới, giữ nguyên elapsed cũ
      tasks.forEach((t) => {
        if (!session.timers[t.id]) {
          console.log(" → Adding missing TIMER for:", t.id);
          session.timers[t.id] = {
            elapsedMs: 0,
            startedAt: null,
          };
        }
      });

      console.log(
        "After fill:",
        JSON.stringify(session, null, 2)
      );
    });

    console.log("%c[INIT] Final session object:", "color:#00ff99",
      next
    );

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

  useEffect(() => {
    const interval = setInterval(() => {
      setNowMs(Date.now());
    }, 1000);

    return () => clearInterval(interval);
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

  const handleTaskStatus = async (taskId, dayKey = null) => {
    let isStart = false;
    let isComplete = false;
    // If dayKey provided (multi-day), toggle session-local task status
    if (dayKey && isWeeklyOrMonthly) {

      setSessions((prev) => {
        // deep clone previous sessions to ensure React detects nested changes
        let next = JSON.parse(JSON.stringify(prev || {}));

        const cur =
          next[dayKey] || {
            done: false,
            taskStatuses: {},
            timers: {},
            accumulatedMs: 0,
            startedAt: null,
          };
        const current = cur.taskStatuses?.[taskId] || "pending";
        const now = Date.now();

        // ❗CHẶN START LẦN 2 (MULTI-DAY)
        const tmr = cur.timers?.[taskId];
        if (current === "completed" && tmr) {
          if (tmr.elapsedMs > 0 || tmr.startedAt) {
            showToast.warning("Checklist này đã được bắt đầu trước đó. Không thể bắt đầu lại.");
            return prev;
          }
        }


        // For session tasks: only allow pending -> in_progress (Start),
        // and allow toggling in_progress -> pending (undo Start).
        // Converting in_progress -> completed is done when the session
        // is finalized via `toggleSessionDone` (Mark Session Done).
        // Cycle: pending -> in_progress -> completed -> pending
        const nextStatus =
          current === "pending"
            ? "in_progress"
            : current === "in_progress"
              ? "completed"
              : "pending";

        if (current === "pending" && nextStatus === "in_progress") {
          isStart = true;
          cur.timers[taskId] = {
            ...(cur.timers[taskId] || { elapsedMs: 0 }),
            startedAt: now,
          };
          if (!cur.startedAt) cur.startedAt = now;
        }


        // If transitioning to in_progress, start session timer if not started
        if (current === "in_progress" && nextStatus === "completed") {
          isComplete = true;
          const t = cur.timers[taskId];
          if (t?.startedAt) {
            t.elapsedMs += now - t.startedAt;
            t.startedAt = null;
          }
        }

        cur.taskStatuses[taskId] = nextStatus;

        next[dayKey] = cur;

        if (booking?.booking_id) persistStoredSessions(booking.booking_id, next);
        return next;
      });

      if (isStart) {
        await api.post("/tasker/timers/start", {
          booking_id: booking.booking_id,
          task_id: taskId,
          checklist_key: taskId,
          session_date: dayKey,
        });
      }

      if (isComplete) {
        await api.post("/tasker/timers/end", {
          booking_id: booking.booking_id,
          task_id: taskId,
          checklist_key: taskId,
          session_date: dayKey,
        });
      }
      return;
    }

    // Fallback: toggle global task status
    // Fallback: toggle global task status  (NON-WEEKLY FIX INCLUDED)
    setTasks((prev) => {
      const current = prev.find((t) => t.id === taskId)?.status || "pending";
      const nextStatus =
        current === "pending"
          ? "in_progress"
          : current === "in_progress"
            ? "completed"
            : "pending";

      const session = sessions?.default;
      const tmrCheck = session?.timers?.[taskId];
      if (current === "completed" && tmrCheck) {
        if (tmrCheck.elapsedMs > 0 || tmrCheck.startedAt) {
          showToast.warning("Checklist này đã được bắt đầu. Không thể bắt đầu lại.");
          return prev;
        }
      }

      const updatedTasks = prev.map((t) =>
        t.id === taskId ? { ...t, status: nextStatus } : t
      );

      // 🔥 UPDATE SESSION TIMERS FOR NON-WEEKLY BOOKINGS
      setSessions((prevSessions) => {
        let next = {};
        try {
          next = prevSessions ? JSON.parse(JSON.stringify(prevSessions)) : {};
        } catch (e) {
          next = { ...(prevSessions || {}) };
        }

        const cur =
          next["default"] || {
            done: false,
            taskStatuses: {},
            timers: {},
            accumulatedMs: 0,
            startedAt: null,
          };

        const now = Date.now();
        const tmr = cur.timers?.[taskId] || { elapsedMs: 0, startedAt: null };

        // START
        if (current === "pending" && nextStatus === "in_progress") {
          isStart = true;
          tmr.startedAt = now;
          if (!cur.startedAt) cur.startedAt = now;
        }

        // COMPLETE
        if (current === "in_progress" && nextStatus === "completed") {
          isComplete = true;
          if (tmr.startedAt) {
            tmr.elapsedMs += now - tmr.startedAt;
            tmr.startedAt = null;
          }
        }

        cur.timers[taskId] = tmr;
        cur.taskStatuses[taskId] = nextStatus;
        next["default"] = cur;

        if (booking?.booking_id) persistStoredSessions(booking.booking_id, next);
        return next;
      });

      return updatedTasks;
    });

    if (isStart) {
      await api.post("/tasker/timers/start", {
        booking_id: booking.booking_id,
        task_id: taskId,
        checklist_key: taskId,
        session_date: null,
      });
    }

    if (isComplete) {
      await api.post("/tasker/timers/end", {
        booking_id: booking.booking_id,
        task_id: taskId,
        checklist_key: taskId,
        session_date: null,
      });
    }
  };

  const toggleSessionDone = (dayKey) => {
    setSessions((prev) => {
      const next = { ...(prev || {}) };
      const cur = next[dayKey] || {
        done: false,
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
        } catch (e) { }
      } else {
        // Unmark done -> resume session
        cur.done = false;
        cur.startedAt = now;
        try {
          showToast?.info(`Đã bỏ tick phiên ${dayKey}`);
        } catch (e) { }
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

  useEffect(() => {
    console.log(
      "%c[SESSIONS UPDATED]",
      "color:#ff8800; font-weight:bold;",
      JSON.parse(JSON.stringify(sessions))
    );
  }, [sessions]);

  // Debug: log session changes for easier tracing
  useEffect(() => {
    try {
      console.debug("sessions updated:", sessions);
    } catch (e) { }
  }, [sessions]);

  const handleCompleteJob = async () => {
    if (!booking?.booking_id) return;

    if (!tasks.every((task) => task.status === "completed")) {
      showToast.warning(
        "Vui lòng hoàn thành toàn bộ checklist trước khi kết thúc công việc."
      );
      return;
    }

    navigate(`/tasker/bookings/${booking.booking_id}/complete`, {
      state: {
        booking,
        tasks,
        fromProgress: true,
      },
    });
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
        <Button variant="secondary" onClick={safeBack}>
          ← Quay lại
        </Button>
      </Container>
    );
  }

  if (!booking) {
    return (
      <Container className="py-5 text-center">
        <p className="text-muted">Không tìm thấy dữ liệu công việc.</p>
        <Button variant="secondary" onClick={safeBack}>
          ← Quay lại
        </Button>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      <style>{`
      .task-action-btn {
    flex: 0 0 auto !important;
    width: 110px !important;
}
      `}</style>
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
            {/* {SHOW_ELAPSED && (
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
            )} */}
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
                  {groupedTasks.map(({ group, items, dayKey }, groupIndex) => {
                    const safeDayKey = dayKey ?? "default";
                    return (
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
                                  Ca làm: 07:00 – 21:00
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
                                    <div className="ms-2">
                                      <button
                                        className={`btn ${sessions?.[dayKey]?.done
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

                          const safeDayKey = dayKey || "default";
                          const session = sessions?.[safeDayKey] ?? {
                            timers: {},
                            taskStatuses: {},
                          };
                          const tmr = session?.timers?.[task.id];

                          console.log(
                            "%c[UI RENDER] Task Timer Check",
                            "color: #00aaff; font-weight: bold;",
                            {
                              taskId: task.id,
                              dayKey,
                              session,
                              timers: session?.timers,
                              tmr: session?.timers?.[task.id],
                            }
                          );

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
                              <Card.Body className="d-flex justify-content-between py-3 px-4">
                                <div className="d-flex align-items-center gap-3">
                                  <div
                                    className={`d-flex align-items-center justify-content-center rounded-circle ${currentStatus === "completed"
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
                                    <div className="fw-semibold text-dark">{task.label}</div>

                                    <small className="text-muted d-block">
                                      {STATUS_LABELS[currentStatus] || "Pending"}
                                    </small>
                                  </div>
                                </div>

                                {/* RIGHT SIDE */}
                                <div className="d-flex align-items-center gap-3 flex-shrink-0">

                                  {/* TIMER HERE — CHỈ Ở ĐÂY MỚI BẢO ĐẢM HIỆN */}
                                  <small className="text-primary d-block mt-1 data-tick={tick}">
                                    {(() => {
                                      if (!tmr) return "";
                                      const base = tmr.elapsedMs || 0;
                                      const running = tmr.startedAt
                                        ? base + (Date.now() - tmr.startedAt)
                                        : base;

                                      const format = (ms) => {
                                        const s = Math.floor(ms / 1000);
                                        const h = Math.floor(s / 3600);
                                        const m = Math.floor((s % 3600) / 60);
                                        const sec = s % 60;
                                        return `${h}h ${m}m ${sec}s`;
                                      };

                                      return `⏱ ${format(running)}`;
                                    })()}
                                  </small>

                                  <Button
                                    style={{
                                      width: "110px",
                                      textAlign: "center",
                                      whiteSpace: "nowrap",
                                      paddingLeft: "16px",
                                      paddingRight: "16px"
                                    }}
                                    variant={
                                      currentStatus === "completed"
                                        ? "outline-success"
                                        : currentStatus === "in_progress"
                                          ? "primary"
                                          : "outline-secondary"
                                    }
                                    size="sm"
                                    className="fw-semibold task-action-btn"
                                    onClick={() =>
                                      handleTaskStatus(task.id, dayKey || null)
                                    }
                                  >
                                    {currentStatus === "in_progress"
                                      ? "Mark done"
                                      : currentStatus === "completed"
                                        ? "Completed"
                                        : "Start"}
                                  </Button>
                                </div>
                              </Card.Body>
                            </Card>
                          );
                        })}
                      </div>
                    );
                  })}
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
                <h6 className="fw-semibold mb-3">Thông tin cần chú ý</h6>
                <div className="d-flex flex-column gap-3 text-muted">
                  <div>
                    <div className="fw-semibold text-dark mb-1">
                      Access Information
                    </div>
                    <p className="mb-0">
                      {customer_notes ||
                        "Liên hệ trước khi đến để được hỗ trợ thêm."}
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
