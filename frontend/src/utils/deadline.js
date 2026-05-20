// frontend/src/utils/deadline.js
// Tiện ích tính hạn chót quy trình có loại trừ chủ nhật và ngày nghỉ/ngày lễ
// (lấy từ bảng Lib_NgayNghi_ChiTiet trên HiGMF qua API /api/holidays).

import { useEffect, useState } from "react";
import API from "../api/api";

const pad2 = (n) => String(n).padStart(2, "0");

const toKey = (date) =>
  `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;

// Trả về true nếu ngày là chủ nhật hoặc nằm trong tập ngày nghỉ/ngày lễ
export const isNonWorkingDay = (date, holidaySet) => {
  if (date.getDay() === 0) return true;
  return !!holidaySet && holidaySet.has(toKey(date));
};

// Tính Date hạn chót: lùi `deadlineDays` ngày làm việc từ baseDate, bỏ qua
// chủ nhật và ngày nghỉ/ngày lễ. Trả về `null` nếu không thể tính.
export const computeDeadlineDate = (
  actualDateString,
  planDateString,
  deadlineDays,
  holidaySet
) => {
  if (
    deadlineDays === null ||
    deadlineDays === undefined ||
    deadlineDays === ""
  ) {
    return null;
  }

  const dateToUse = actualDateString || planDateString;
  if (!dateToUse) return null;

  const baseDate = new Date(dateToUse);
  const deadlineDate = new Date(
    baseDate.getFullYear(),
    baseDate.getMonth(),
    baseDate.getDate()
  );

  let remaining = parseInt(deadlineDays, 10);
  if (Number.isNaN(remaining)) return null;

  const set = holidaySet || new Set();

  while (remaining > 0) {
    deadlineDate.setDate(deadlineDate.getDate() - 1);
    if (!isNonWorkingDay(deadlineDate, set)) {
      remaining -= 1;
    }
  }

  // Nếu vẫn rơi vào ngày nghỉ thì lùi tiếp tới ngày làm việc gần nhất.
  while (isNonWorkingDay(deadlineDate, set)) {
    deadlineDate.setDate(deadlineDate.getDate() - 1);
  }

  return deadlineDate;
};

// Trả về chuỗi DD/MM/YYYY của hạn chót, hoặc "-" nếu không có.
export const calculateDeadlineDate = (
  actualDateString,
  planDateString,
  deadlineDays,
  holidaySet
) => {
  const d = computeDeadlineDate(
    actualDateString,
    planDateString,
    deadlineDays,
    holidaySet
  );
  if (!d) return "-";
  return `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}/${d.getFullYear()}`;
};

// Kiểm tra một quy trình đã quá hạn hay chưa.
export const checkIsOverdue = (
  actualDate,
  planDate,
  deadline,
  holidaySet
) => {
  if (!deadline) return false;
  if (!actualDate && !planDate) return false;

  const d = computeDeadlineDate(actualDate, planDate, deadline, holidaySet);
  if (!d) return false;
  d.setHours(23, 59, 59, 999);
  return new Date() > d;
};

// Hook lấy danh sách ngày nghỉ/ngày lễ quanh `baseDateString`.
// Lấy 3 năm (năm trước, hiện tại, năm sau) để bao trùm trường hợp deadline
// lùi qua biên năm.
export const useHolidays = (baseDateString) => {
  const [holidaySet, setHolidaySet] = useState(() => new Set());

  useEffect(() => {
    let cancelled = false;
    const baseYear = baseDateString
      ? new Date(baseDateString).getFullYear()
      : new Date().getFullYear();
    const years = [baseYear - 1, baseYear, baseYear + 1];

    Promise.all(years.map((y) => API.getHolidays(y).catch(() => null))).then(
      (responses) => {
        if (cancelled) return;
        const set = new Set();
        responses.forEach((resp) => {
          if (resp && Array.isArray(resp.holidays)) {
            resp.holidays.forEach((d) => set.add(d));
          }
        });
        setHolidaySet(set);
      }
    );

    return () => {
      cancelled = true;
    };
  }, [baseDateString]);

  return holidaySet;
};
