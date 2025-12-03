import { useState, useEffect } from "react";
import api from "../services/api";

export default function useUserPoints() {
  const [points, setPoints] = useState(0);

  const fetchPoints = async () => {
    try {
      const res = await api.get("/vouchers/my");
      if (res?.data?.success) {
        setPoints(res.data.points);
      }
    } catch (err) {
      console.error("Lỗi lấy điểm:", err);
    }
  };

  useEffect(() => {
    fetchPoints();
  }, []);

  return { points, refreshPoints: fetchPoints };
}
