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
  Tabs,
  Tab,
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

const clearStoredSessions = (bookingId) => {
  try {
    localStorage.removeItem(sessionsKeyFor(bookingId));
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
    (initialBooking?.booking_id
      ? loadStoredSessions(initialBooking.booking_id)
      : {}) || {}
  );
  const [nowMs, setNowMs] = useState(Date.now());
  const [fetchedSessions, setFetchedSessions] = useState([]);
  const timerRef = useRef(null);

  const NO_PHOTO_SERVICES = [
    "Chăm sóc người già và bệnh nhân",
    "Chăm sóc trẻ em"
  ];

  const [tick, setTick] = useState(0);
  const [activeTab, setActiveTab] = useState("");



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
    if (booking?.booking_id) {
      api.get(`/tasker/bookings/${booking.booking_id}/sessions`)
        .then(res => {
          if (res.data?.success) {
            setFetchedSessions(res.data.data);
          }
        })
        .catch(err => console.error("Error fetching sessions:", err));
    }
  }, [booking?.booking_id]);

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
    if (booking?.total_sessions && Number(booking.total_sessions) > 1) return true;
    if (explicitlyMulti) return true;
    if (startDate && endDate) {
      // If booking spans more than one day, treat as multi-day sessions
      const dayMs = 24 * 60 * 60 * 1000;
      if (endDate.getTime() - startDate.getTime() >= dayMs) return true;
    }
    return false;
  }, [unit, startDate, endDate, booking?.total_sessions]);

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
    if (!startDate) return [];

    const days = [];
    // Prioritize total_sessions count if available
    const limit = booking?.total_sessions ? Number(booking.total_sessions) : 0;

    // Check if we effectively have multiple days or sessions
    const isMulti = limit > 1 || (endDate && (endDate.getTime() - startDate.getTime() >= 24 * 60 * 60 * 1000));

    if (isMulti) {
      if (limit > 1) {
        const current = new Date(startDate);
        current.setHours(0, 0, 0, 0);
        for (let i = 0; i < limit; i++) {
          const y = current.getFullYear();
          const m = String(current.getMonth() + 1).padStart(2, "0");
          const d = String(current.getDate()).padStart(2, "0");
          const dayKey = `${y}-${m}-${d}`;
          days.push({
            date: new Date(current),
            dayKey,
            label: formatDateTimeForDay.format(current),
          });
          current.setDate(current.getDate() + 1);
        }
        return days;
      }

      const current = new Date(startDate);
      current.setHours(0, 0, 0, 0);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);

      while (current <= end) {
        const y = current.getFullYear();
        const m = String(current.getMonth() + 1).padStart(2, "0");
        const d = String(current.getDate()).padStart(2, "0");
        const dayKey = `${y}-${m}-${d}`;
        days.push({
          date: new Date(current),
          dayKey,
          label: formatDateTimeForDay.format(current),
        });
        current.setDate(current.getDate() + 1);
      }
      return days;
    }

    // Default: Single day
    const current = new Date(startDate);
    const y = current.getFullYear();
    const m = String(current.getMonth() + 1).padStart(2, "0");
    const d = String(current.getDate()).padStart(2, "0");
    const dayKey = `${y}-${m}-${d}`;
    return [{
      date: new Date(current),
      dayKey,
      label: formatDateTimeForDay.format(current),
    }];

  }, [startDate, endDate, formatDateTimeForDay, booking?.total_sessions]);

  // Chia tasks thành các nhóm theo ngày
  const tasksByDay = useMemo(() => {
    if (!daysList.length) return null;

    const grouped = {};
    daysList.forEach((day) => {
      grouped[day.dayKey] = {
        day,
        tasks: tasks,
      };
    });

    return grouped;
  }, [daysList, tasks]);

  // Tự động chọn tab ngày hiện tại hoặc ngày đầu tiên
  useEffect(() => {
    if (daysList.length > 0) {
      // Nếu đã có activeTab và nó hợp lệ thì giữ nguyên
      if (activeTab && daysList.some(d => d.dayKey === activeTab)) return;

      const today = new Date().toISOString().split("T")[0];
      const found = daysList.find((d) => d.dayKey === today);
      if (found) {
        setActiveTab(found.dayKey);
      } else if (daysList[0]) {
        setActiveTab(daysList[0].dayKey);
      }
    }
  }, [daysList, activeTab]);

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
        daysList,
        tasksBeforeInit: tasks,
        storedBeforeInit: loadStoredSessions(booking?.booking_id),
      }
    );

    if (!booking?.booking_id) return;

    const safeDaysList = daysList.length > 0 ? daysList : [{ dayKey: "default" }];
    const stored = loadStoredSessions(booking.booking_id) || {};
    const next = { ...stored };

    safeDaysList.forEach(({ dayKey }) => {
      if (!next[dayKey]) {
        next[dayKey] = {
          status: "pending",
          checkIn: null,
          checkOut: null,
          done: false,
          taskStatuses: {},
          timers: {},
        };
      }

      const session = next[dayKey];

      // Ensure key fields exist
      if (!session.status) session.status = session.done ? "completed" : "pending";
      if (!session.taskStatuses) session.taskStatuses = {};
      if (!session.timers) session.timers = {};

      // Sync tasks
      tasks.forEach((t) => {
        if (!session.taskStatuses.hasOwnProperty(t.id)) {
          session.taskStatuses[t.id] = t.status || "pending";
        }
      });
    });

    setSessions(next);
    persistStoredSessions(booking.booking_id, next);
  }, [booking?.booking_id, daysList, tasks]);



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
    if (booking?.booking_id) {
      const saved = loadDailyElapsed(booking.booking_id);
      setDailyElapsed(saved);
    }
  }, [booking?.booking_id]);

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
  // Tính elapsed time cho từng ngày (nếu là tuần/tháng)
  useEffect(() => {
    if (!hasTimeInfo || !startDate || !daysList.length)
      return;

    const updateDailyElapsed = () => {
      setDailyElapsed((prev) => {
        const now = Date.now();
        const newDailyElapsed = { ...prev };

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

        if (booking?.booking_id) {
          saveDailyElapsed(booking.booking_id, newDailyElapsed);
        }

        return newDailyElapsed;
      });
    };

    updateDailyElapsed();
    const interval = setInterval(updateDailyElapsed, 1000);

    return () => clearInterval(interval);
  }, [
    hasTimeInfo,
    startDate,
    daysList,
    booking?.booking_id,
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
    let action = null; // 'start' | 'end' | null

    // Fallback: If no dayKey provided, try to use activeTab or the first available day
    const effectiveDayKey = dayKey || activeTab || (daysList[0] ? daysList[0].dayKey : null);

    if (!effectiveDayKey) {
      console.error("Cannot determine session day key for task status update");
      return;
    }

    const currentSession = sessions[effectiveDayKey] || {};
    const currentStatus = currentSession.taskStatuses?.[taskId] || "pending";
    const tmr = currentSession.timers?.[taskId];

    if (currentStatus === "completed" && tmr && (tmr.elapsedMs > 0 || tmr.startedAt)) {
      showToast.warning("Checklist này đã được bắt đầu trước đó. Không thể bắt đầu lại.");
      return;
    }

    const nextStatus =
      currentStatus === "pending"
        ? "in_progress"
        : currentStatus === "in_progress"
          ? "completed"
          : "pending";

    if (currentStatus === "pending" && nextStatus === "in_progress") action = 'start';
    if (currentStatus === "in_progress" && nextStatus === "completed") action = 'end';

    setSessions((prev) => {
      let next = JSON.parse(JSON.stringify(prev || {}));
      const cur = next[effectiveDayKey] || {
        done: false,
        taskStatuses: {},
        timers: {},
      };
      const currentInState = cur.taskStatuses?.[taskId] || "pending";
      const now = Date.now();

      // Re-evaluate nextStatus inside setter to be safe
      const nextStatusInState =
        currentInState === "pending"
          ? "in_progress"
          : currentInState === "in_progress"
            ? "completed"
            : "pending";

      if (currentInState === "pending" && nextStatusInState === "in_progress") {
        cur.timers[taskId] = {
          ...(cur.timers[taskId] || { elapsedMs: 0 }),
          startedAt: now,
        };
        if (!cur.startedAt) cur.startedAt = now;
      }

      if (currentInState === "in_progress" && nextStatusInState === "completed") {
        const t = cur.timers[taskId];
        if (t?.startedAt) {
          t.elapsedMs += now - t.startedAt;
          t.startedAt = null;
        }
      }

      cur.taskStatuses[taskId] = nextStatusInState;
      next[effectiveDayKey] = cur;
      if (booking?.booking_id) persistStoredSessions(booking.booking_id, next);
      return next;
    });

    // Call API if needed
    if (action && booking?.booking_id) {
      try {
        // Find matching session from DB data
        let target = fetchedSessions.find(s =>
          s.session_date && moment(s.session_date).format("YYYY-MM-DD") === effectiveDayKey
        );

        // Fallback: if single session in DB and dayKey matches or we only have 1 session
        if (!target && fetchedSessions.length === 1) {
          target = fetchedSessions[0];
        }

        if (target && target.task_id) {
          const realTaskId = target.task_id;
          console.log(`Sending API ${action} timer for checklist ${taskId}, realTaskId=${realTaskId}`);
          await api.post(`/tasker/bookings/${booking.booking_id}/tasks/${realTaskId}/timer/${action}`, {
            checklist_key: taskId,
            session_date: effectiveDayKey
          });
        } else {
          console.warn("Cannot find valid real task_id to sync timer", { effectiveDayKey, fetchedSessions });
        }
      } catch (err) {
        console.error("Timer API sync error", err);
      }
    }
  };

  /* ============================================================
     *  SESSION LOGIC (START / FINISH)
     * ============================================================ */

  const handleStartSession = (dayKey) => {
    const now = new Date();
    setSessions((prev) => {
      const next = { ...prev };
      const s = { ...(next[dayKey] || {}) };
      s.status = "in_progress";
      s.checkIn = now.toISOString();
      next[dayKey] = s;

      if (booking?.booking_id) persistStoredSessions(booking.booking_id, next);
      return next;
    });
    showToast.success("Đã bắt đầu ca làm việc!");
  };

  const handleFinishSession = (dayKey) => {
    // Validate: All tasks completed? (This check is also done in render, but good to have)
    const session = sessions[dayKey];
    if (!session) return;

    // Check if checklist complete
    const allDone = tasks.every(t => session.taskStatuses?.[t.id] === "completed");
    if (!allDone) {
      showToast.warning("Vui lòng hoàn thành hết checklist trước khi kết thúc ngày.");
      return;
    }

    // Navigate to completion page for photos/notes/submission
    navigate(`/tasker/bookings/${booking.booking_id}/complete`, {
      state: {
        booking,
        tasks: tasks, // Pass tasks definition
        sessionData: session,
        dayKey: dayKey,
        isSessionCompletion: true,
        fromProgress: true
      }
    });
  };

  const isDayLocked = (dayKey) => {
    if (!daysList.length) return false;
    const idx = daysList.findIndex(d => d.dayKey === dayKey);
    if (idx <= 0) return false; // Day 1 always unlocked or if not found

    const prevDayKey = daysList[idx - 1].dayKey;
    const prevSession = sessions[prevDayKey];
    // Locked if previous day is NOT completed
    return prevSession?.status !== "completed";
  };

  // Helper to format hours:minutes
  const formatTimeHHMM = (isoString) => {
    if (!isoString) return "--:--";
    const d = new Date(isoString);
    const h = String(d.getHours()).padStart(2, "0");
    const m = String(d.getMinutes()).padStart(2, "0");
    return `${h}:${m}`;
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


  // Check if current session from activeTab is finished
  const isCurrentSessionFinished = useMemo(() => {
    if (!activeTab || !sessions[activeTab]) return false;
    if (sessions[activeTab].status !== 'in_progress') return false;
    // Check if all tasks in this session are completed
    return tasks.every(t => sessions[activeTab].taskStatuses?.[t.id] === "completed");
  }, [activeTab, sessions, tasks]);

  const handleCompleteJob = () => {
    console.log("👉 handleCompleteJob clicked");
    if (!booking?.booking_id) {
      console.error("❌ Booking ID missing");
      return;
    }

    /*
    if (!isCurrentSessionFinished) {
      console.warn("⚠️ Checklist not finished");
      showToast.warning("Vui lòng hoàn thành toàn bộ checklist trước khi kết thúc công việc.");
      return;
    }
    */

    try {
      // Determine payload based on mode
      let navState = {
        booking: JSON.parse(JSON.stringify(booking)), // Ensure clean object
        tasks: JSON.parse(JSON.stringify(tasks)),
        fromProgress: true
      };

      const dayKey = activeTab;
      const session = sessions[dayKey];
      console.log("🔄 Nav to complete. Key:", dayKey, "Session:", session);

      if (!session) {
        console.error("❌ Session data missing for key:", dayKey);
        showToast.error("Lỗi dữ liệu phiên làm việc. Vui lòng thử lại.");
        return;
      }

      navState = {
        ...navState,
        sessionData: JSON.parse(JSON.stringify(session)),
        dayKey: dayKey,
        isSessionCompletion: true,
        checklistTimers: session.timers ? JSON.parse(JSON.stringify(session.timers)) : {}
      };

      console.log("🚀 Navigating to completion page...", navState);
      navigate(`/tasker/bookings/${booking.booking_id}/complete`, {
        state: navState,
      });
    } catch (err) {
      console.error("❌ Navigation error:", err);
      showToast.error("Lỗi điều hướng: " + err.message);
    }
  };

  const progress = useMemo(() => {
    if (!tasks.length) return 0;
    // If this is a weekly/monthly booking with sessions, derive progress
    // from per-day session taskStatuses when available so that
    // Mark Session Done updates the percent correctly.
    if (tasksByDay) {
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

    return 0;
  }, [tasks, tasksByDay, sessions]);

  const summary = useMemo(() => {
    if (tasksByDay) {
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
    return { total: 0, completed: 0, inProgress: 0 };
  }, [tasks, tasksByDay, sessions]);

  const groupedTasks = useMemo(() => {
    // Always use tasksByDay
    if (tasksByDay) {
      return Object.values(tasksByDay).map(({ day, tasks: dayTasks }) => ({
        group: day.label,
        dayKey: day.dayKey,
        items: dayTasks,
      }));
    }

    // Fallback
    return [];
  }, [tasksByDay]);

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
        .custom-scroll-tabs {
          flex-wrap: nowrap;
          overflow-x: auto;
          overflow-y: hidden;
          white-space: nowrap;
          scrollbar-width: thin;
        }
        .custom-scroll-tabs .nav-item {
          display: inline-block;
        }
        .custom-scroll-tabs .nav-link {
          white-space: nowrap;
        }
      `}</style>
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
                  <Tabs
                    activeKey={activeTab}
                    onSelect={(k) => setActiveTab(k)}
                    variant="pills"
                    className="mb-3 custom-scroll-tabs pb-2"
                  >
                    {groupedTasks.map(({ group, items, dayKey }) => {
                      const safeDayKey = dayKey || "default";
                      const session = sessions?.[safeDayKey] || { status: 'pending' };
                      const status = session.status || 'pending'; // pending, in_progress, completed
                      const locked = isDayLocked(safeDayKey);

                      // Badge logic for Tab Title
                      let badge = "⏳";
                      if (status === 'completed') badge = "✔";
                      else if (status === 'in_progress') badge = "🔵";
                      else if (locked) badge = "🔒";

                      const tabTitle = (
                        <div className="d-flex align-items-center gap-2">
                          <span>{group || "Ca làm việc"}</span>
                          <small>{badge}</small>
                        </div>
                      );

                      // Calculate progress for this day
                      const dayTasksCompleted = items.filter(t => session.taskStatuses?.[t.id] === 'completed').length;
                      const dayTasksTotal = items.length;
                      const isChecklistFinished = dayTasksCompleted === dayTasksTotal && dayTasksTotal > 0;

                      return (
                        <Tab eventKey={safeDayKey} title={tabTitle} key={safeDayKey}>
                          {/* --- STATUS BANNER --- */}
                          <Card className="mb-3 border-0 bg-light">
                            <Card.Body>
                              <div className="d-flex align-items-center justify-content-between mb-2">
                                <div className="fw-bold fs-5">{group || "Chi tiết ca làm"}</div>
                                <Badge bg={status === 'completed' ? 'success' : status === 'in_progress' ? 'primary' : 'secondary'}>
                                  {status === 'completed' ? 'Đã hoàn thành' : status === 'in_progress' ? 'Đang làm việc' : 'Chưa thực hiện'}
                                </Badge>
                              </div>

                              {locked ? (
                                <Alert variant="warning" className="mb-0">
                                  <i className="bi bi-lock-fill me-2"></i>
                                  <strong>Chờ hoàn thành ngày trước</strong>
                                </Alert>
                              ) : (
                                <div className="d-flex gap-4 text-muted small">
                                  <div><i className="bi bi-box-arrow-in-right me-1"></i> Check-in: <strong>{formatTimeHHMM(session.checkIn)}</strong></div>
                                  <div><i className="bi bi-box-arrow-left me-1"></i> Check-out: <strong>{formatTimeHHMM(session.checkOut)}</strong></div>
                                </div>
                              )}
                            </Card.Body>
                          </Card>

                          {/* --- LOCKED STATE --- */}
                          {locked && (
                            <div className="text-center py-5 text-muted">
                              <i className="bi bi-lock-fill fs-1 mb-2 d-block"></i>
                              <p>Ngày này đang bị khóa. Vui lòng hoàn thành các ngày trước đó.</p>
                            </div>
                          )}

                          {/* --- PENDING (UNLOCKED) STATE --- */}
                          {!locked && status === 'pending' && (
                            <div className="text-center py-5">
                              <div className="mb-4">
                                <i className="bi bi-calendar-check fs-1 text-primary"></i>
                              </div>
                              <h4 className="mb-3">Sẵn sàng làm việc?</h4>
                              <Button size="lg" variant="primary" onClick={() => handleStartSession(safeDayKey)}>
                                <i className="bi bi-play-circle-fill me-2"></i>
                                Bắt đầu ca làm
                              </Button>
                            </div>
                          )}

                          {/* --- IN PROGRESS / COMPLETED STATE --- */}
                          {!locked && (status === 'in_progress' || status === 'completed') && (
                            <>
                              {/* Checklist */}
                              <div className="d-flex flex-column gap-3 mb-4">
                                <h6 className="fw-bold text-muted text-uppercase mb-0">Checklist công việc</h6>
                                {items.map((task) => {
                                  // For session based logic, we use session.taskStatuses
                                  const currentStatus = session.taskStatuses?.[task.id] || "pending";
                                  const tmr = session.timers?.[task.id];
                                  const isReadOnly = status === 'completed'; // Cannot toggle if day completed

                                  return (
                                    <Card
                                      key={`${task.id}-${safeDayKey}`}
                                      className="border-0 shadow-sm"
                                      style={{ borderRadius: "12px", opacity: isReadOnly ? 0.8 : 1 }}
                                    >
                                      <Card.Body className="d-flex justify-content-between py-3 px-3 align-items-center">
                                        <div className="d-flex align-items-center gap-3">
                                          <div
                                            className={`d-flex align-items-center justify-content-center rounded-circle ${currentStatus === "completed"
                                              ? "bg-success bg-opacity-10 text-success"
                                              : currentStatus === "in_progress"
                                                ? "bg-primary bg-opacity-10 text-primary"
                                                : "bg-light text-secondary"
                                              }`}
                                            style={{ width: 40, height: 40 }}
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

                                        <div className="d-flex align-items-center gap-2">
                                          {/* Timer Display */}
                                          <small className="text-primary fw-bold" style={{ minWidth: '60px', textAlign: 'right' }}>
                                            {(() => {
                                              if (!tmr) return "";
                                              const base = tmr.elapsedMs || 0;
                                              const running = tmr.startedAt ? base + (Date.now() - tmr.startedAt) : base;
                                              const s = Math.floor(running / 1000);
                                              const h = Math.floor(s / 3600);
                                              const m = Math.floor((s % 3600) / 60);
                                              const sec = s % 60;
                                              return `⏱ ${h}h ${m}m ${sec}s`;
                                            })()}
                                          </small>

                                          <Button
                                            variant={currentStatus === "completed" ? "outline-success" : currentStatus === "in_progress" ? "primary" : "outline-secondary"}
                                            size="sm"
                                            disabled={isReadOnly}
                                            onClick={() => !isReadOnly && handleTaskStatus(task.id, safeDayKey)}
                                            style={{ minWidth: "100px" }}
                                          >
                                            {currentStatus === "in_progress" ? "Done" : currentStatus === "completed" ? "Completed" : "Start"}
                                          </Button>
                                        </div>
                                      </Card.Body>
                                    </Card>
                                  );
                                })}
                              </div>
                              {status === 'completed' && (
                                <div className="alert alert-success d-flex align-items-center">
                                  <i className="bi bi-check-circle-fill fs-4 me-3"></i>
                                  <div>
                                    <strong>Ngày này đã hoàn thành!</strong>
                                    <div>Bạn đã checkout lúc {formatTimeHHMM(session.checkOut)}.</div>
                                  </div>
                                </div>
                              )}
                            </>
                          )}
                        </Tab>
                      );
                    })}
                  </Tabs>
                </div>

              </Card.Body>
            </Card>

            <div className="d-flex gap-3 flex-wrap">
              <Button
                variant="danger"
                className="px-4 py-2 fw-semibold"
                disabled={loading}
                onClick={handleCompleteJob}
              >
                <i className="bi bi-stop-circle me-2"></i>
                End Job
              </Button>
            </div>
            {!isCurrentSessionFinished && (
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
    </Container >
  );
}
