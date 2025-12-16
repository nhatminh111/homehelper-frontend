import { useEffect, useState } from "react";
import api from "../services/api";

export default function useTaskerReputation(taskerId) {
    const [score, setScore] = useState(null);

    const loadScore = async () => {
        try {
            const res = await api.get(`/tasker/reputation/${taskerId}`);
            if (res.data.success) {
                setScore(res.data.reputation);
            }
        } catch (err) {
            console.error("Lỗi lấy uy tín tasker:", err);
        }
    };

    useEffect(() => {
        if (taskerId) loadScore();
    }, [taskerId]);

    return score;
}
